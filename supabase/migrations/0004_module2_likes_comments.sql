-- ============================================================================
-- Module 2 (complément) : likes & commentaires
-- Numérotation 0004 sur cette branche (Chantier A). Note : les numéros de
-- migration ne sont pas réservés globalement entre chantiers/branches — voir
-- docs/WORKSTREAMS.md. En cas de doublon de préfixe avec un autre chantier au
-- moment de la fusion, les deux fichiers coexistent sans conflit (noms de
-- fichiers différents, tables différentes) ; seul l'ordre alphabétique compte
-- pour l'application des migrations, et ça n'a pas d'incidence ici.
-- ============================================================================

create table public.post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create table public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 300),
  created_at timestamptz not null default now()
);

create index post_likes_post_id_idx on public.post_likes (post_id);
create index post_comments_post_id_idx on public.post_comments (post_id, created_at);

-- Compteurs dénormalisés sur `posts` pour éviter un COUNT() sur chaque
-- publication à chaque affichage du feed (coût réseau/CPU, cf ADR-005 §4).
alter table public.posts
  add column like_count int not null default 0,
  add column comment_count int not null default 0;

create or replace function public.handle_like_change()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set like_count = like_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.posts set like_count = greatest(0, like_count - 1) where id = old.post_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger on_post_like_change
  after insert or delete on public.post_likes
  for each row execute function public.handle_like_change();

create or replace function public.handle_comment_change()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set comment_count = comment_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.posts set comment_count = greatest(0, comment_count - 1) where id = old.post_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger on_post_comment_change
  after insert or delete on public.post_comments
  for each row execute function public.handle_comment_change();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table public.post_likes enable row level security;
alter table public.post_comments enable row level security;

create policy "post_likes_select_all"
  on public.post_likes for select
  to authenticated
  using (true);

create policy "post_likes_insert_own"
  on public.post_likes for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "post_likes_delete_own"
  on public.post_likes for delete
  to authenticated
  using (user_id = auth.uid());

create policy "post_comments_select_visible_post"
  on public.post_comments for select
  to authenticated
  using (
    exists (
      select 1 from public.posts p
      where p.id = post_id and (p.status = 'active' or p.user_id = auth.uid())
    )
  );

create policy "post_comments_insert_own"
  on public.post_comments for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "post_comments_delete_own"
  on public.post_comments for delete
  to authenticated
  using (user_id = auth.uid());
