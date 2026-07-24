-- ============================================================================
-- Module 2 : Flux de publications & moteur de confiance
-- Voir docs/ARCHITECTURE.md pour le raisonnement. Numérotation 0003 (et non
-- 0002) car 0002 a servi à compléter le Module 1 (vérification) — voir
-- docs/WORKSTREAMS.md.
-- ============================================================================

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,

  post_type text not null
    check (post_type in ('service', 'offre_emploi', 'recherche', 'realisation', 'urgence')),

  title text not null,
  description text not null,

  -- Filtre automatique niveau 1 (Module 2 §1) : on bloque les liens externes
  -- évidents dès l'écriture en base, en plus du contrôle côté app (PostService)
  -- qui donne un retour immédiat à l'utilisateur.
  constraint no_url_in_title check (title !~* 'https?://|www\.'),
  constraint no_url_in_description check (description !~* 'https?://|www\.'),

  category text,          -- reprend main_skill de l'auteur par défaut
  subcategory text,

  price numeric,
  price_currency text default 'FCFA',

  city text default 'Dschang',
  neighborhood text,

  media jsonb not null default '[]'::jsonb,  -- [{ url, type: 'photo'|'video' }]
  is_urgent boolean not null default false,

  -- Modération (Module 2 §1) — protégée par trigger, voir plus bas :
  -- un utilisateur normal ne peut jamais modifier ces deux champs lui-même.
  status text not null default 'active'
    check (status in ('active', 'quarantine', 'hidden', 'archived')),
  report_count int not null default 0,

  -- Micro-boost ponctuel (Module 5 "Flash Boost") — à relier au paiement
  -- Campay quand le Chantier D (monétisation) sera fait.
  boosted_until timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index posts_status_created_idx on public.posts (status, created_at desc);
create index posts_user_id_idx on public.posts (user_id);
create index posts_category_idx on public.posts (category);
create index posts_city_idx on public.posts (city);

-- ============================================================================
-- Signalement communautaire (Module 2 §1)
-- ============================================================================
create table public.post_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (reason in ('futilite', 'arnaque', 'langage', 'violence', 'spam', 'autre')),
  created_at timestamptz not null default now(),

  unique (post_id, reporter_id) -- un seul signalement par personne et par post
);

-- Seuil de mise en quarantaine automatique (Module 2 §1). 3 signalements =
-- même seuil que la sanction de compte (Module 2 §5), pour rester cohérent.
create or replace function public.handle_post_report()
returns trigger as $$
declare
  v_owner uuid;
  v_count int;
begin
  select user_id into v_owner from public.posts where id = new.post_id;
  if v_owner = new.reporter_id then
    raise exception 'Impossible de signaler sa propre publication';
  end if;

  update public.posts
    set report_count = report_count + 1
    where id = new.post_id
    returning report_count into v_count;

  if v_count >= 3 then
    update public.posts set status = 'quarantine' where id = new.post_id and status = 'active';
  end if;

  -- L'indice de vigilance de l'auteur (Module 3 §3B) est mis à jour ici aussi.
  update public.profiles_private
    set report_count = report_count + 1
    where id = v_owner;

  return new;
end;
$$ language plpgsql security definer;

create trigger on_post_report
  after insert on public.post_reports
  for each row execute function public.handle_post_report();

-- Empêche un utilisateur "normal" (rôle `authenticated`) de modifier lui-même
-- son statut de modération ou son compteur de signalements — seul un appel
-- avec la clé service_role (Edge Function admin, Chantier D) le peut.
create or replace function public.protect_post_moderation_fields()
returns trigger as $$
begin
  if current_user = 'authenticated' then
    new.status := old.status;
    new.report_count := old.report_count;
  end if;
  new.updated_at := now();
  return new;
end;
$$ language plpgsql security definer;

create trigger before_post_update
  before update on public.posts
  for each row execute function public.protect_post_moderation_fields();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table public.posts enable row level security;
alter table public.post_reports enable row level security;

-- Lecture : les publications actives sont visibles de tous, + l'auteur voit
-- toujours les siennes même en quarantaine/masquées (pour comprendre pourquoi).
create policy "posts_select_active_or_own"
  on public.posts for select
  to authenticated
  using (status = 'active' or user_id = auth.uid());

create policy "posts_insert_own"
  on public.posts for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "posts_update_own"
  on public.posts for update
  to authenticated
  using (user_id = auth.uid());

create policy "posts_delete_own"
  on public.posts for delete
  to authenticated
  using (user_id = auth.uid());

create policy "post_reports_insert_own"
  on public.post_reports for insert
  to authenticated
  with check (reporter_id = auth.uid());

-- Pas de policy select sur post_reports pour les utilisateurs normaux : seul
-- l'admin (service_role, via Edge Function/Supabase Studio) doit voir qui a
-- signalé quoi (cf Module 6, Chantier D).
