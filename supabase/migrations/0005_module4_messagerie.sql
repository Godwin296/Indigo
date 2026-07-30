-- ============================================================================
-- Module 4 : Messagerie évolutive & appels unifiés
-- Voir docs/ARCHITECTURE.md. 3 niveaux de conversation (Social/Professionnel/
-- Contrat), anti-spam, blocage appliqué en base (pas seulement côté app),
-- révélation d'identité réelle uniquement en Mode Contrat (promesse ADR-003).
-- Appels : bouton natif (tel:), pas de VoIP maison — ADR-004.
-- Chiffrement : standard transit+stockage, pas de vrai E2EE — ADR-004
-- (contradiction avec l'arbitrage admin des litiges).
-- ============================================================================

create table public.conversations (
  id uuid primary key default gen_random_uuid(),

  type text not null default 'social'
    check (type in ('social', 'professional', 'contract')),

  -- Toujours stocké avec participant_a < participant_b (ordre alphabétique
  -- des uuid) pour empêcher les doublons (A,B) et (B,A) de la même conversation.
  participant_a uuid not null references public.profiles(id) on delete cascade,
  participant_b uuid not null references public.profiles(id) on delete cascade,
  constraint participants_ordered check (participant_a < participant_b),

  -- Lien vers l'offre/service qui a démarré l'échange (Module 4 §1, niveau 2)
  related_post_id uuid references public.posts(id) on delete set null,

  -- Mode Contrat (Module 4 §1, niveau 3 + Module 7 §3 gestion des litiges)
  contract_status text not null default 'none'
    check (contract_status in ('none', 'pending', 'active', 'completed', 'disputed')),

  last_message_at timestamptz,
  last_message_preview text,
  created_at timestamptz not null default now(),

  unique (participant_a, participant_b, related_post_id)
);

create index conversations_participant_a_idx on public.conversations (participant_a, last_message_at desc);
create index conversations_participant_b_idx on public.conversations (participant_b, last_message_at desc);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  media_url text,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index messages_conversation_id_idx on public.messages (conversation_id, created_at);

-- ============================================================================
-- Anti-spam (Module 4 §4) : un même message envoyé identique à 10+ personnes
-- (10+ conversations distinctes) dans les 10 dernières minutes est bloqué et
-- vaut un avertissement automatique.
-- ============================================================================
create or replace function public.check_message_spam()
returns trigger as $$
declare
  v_distinct_convs int;
begin
  select count(distinct conversation_id) into v_distinct_convs
  from public.messages
  where sender_id = new.sender_id
    and content = new.content
    and created_at > now() - interval '10 minutes';

  if v_distinct_convs >= 10 then
    update public.profiles_private
      set warnings = warnings + 1
      where id = new.sender_id;
    raise exception 'Message bloqué : envoi identique détecté vers trop de personnes (anti-spam).';
  end if;

  return new;
end;
$$ language plpgsql security definer;

create trigger before_message_insert_spam_check
  before insert on public.messages
  for each row execute function public.check_message_spam();

-- ============================================================================
-- Blocage (Module 2 §3 / Module 4 §4) appliqué EN BASE, pas seulement côté
-- app — sinon un appel API direct contournerait le blocage.
-- ============================================================================
create or replace function public.check_message_not_blocked()
returns trigger as $$
declare
  v_conversation record;
  v_recipient uuid;
  v_sender_blocked jsonb;
  v_recipient_blocked jsonb;
begin
  select * into v_conversation from public.conversations where id = new.conversation_id;
  v_recipient := case when v_conversation.participant_a = new.sender_id
                       then v_conversation.participant_b
                       else v_conversation.participant_a end;

  select blocked_users into v_sender_blocked from public.profiles_private where id = new.sender_id;
  select blocked_users into v_recipient_blocked from public.profiles_private where id = v_recipient;

  if v_sender_blocked ? v_recipient::text or v_recipient_blocked ? new.sender_id::text then
    raise exception 'Message bloqué : blocage actif entre ces deux utilisateurs.';
  end if;

  return new;
end;
$$ language plpgsql security definer;

create trigger before_message_insert_block_check
  before insert on public.messages
  for each row execute function public.check_message_not_blocked();

-- Met à jour `last_message_at` sur la conversation à chaque nouveau message
-- (pour trier la liste des conversations par activité récente).
create or replace function public.touch_conversation()
returns trigger as $$
begin
  update public.conversations
    set last_message_at = new.created_at,
        last_message_preview = left(new.content, 100)
    where id = new.conversation_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger after_message_insert_touch
  after insert on public.messages
  for each row execute function public.touch_conversation();

-- ============================================================================
-- Révélation d'identité réelle — UNIQUEMENT en Mode Contrat (promesse faite
-- dans ADR-003 lors de la conception du Module 1). C'est ici, et seulement
-- ici, que le nom réel et la photo réelle peuvent sortir de `profiles_private`.
-- ============================================================================
create or replace function public.get_participant_identity(p_conversation_id uuid, p_target_user_id uuid)
returns jsonb as $$
declare
  v_conversation record;
  v_result jsonb;
begin
  select * into v_conversation from public.conversations where id = p_conversation_id;

  if v_conversation is null then
    raise exception 'Conversation introuvable';
  end if;

  if auth.uid() not in (v_conversation.participant_a, v_conversation.participant_b) then
    raise exception 'Accès refusé : vous ne participez pas à cette conversation';
  end if;

  if v_conversation.type = 'contract' then
    select jsonb_build_object(
      'display_name', coalesce(pp.real_name, p.pseudo),
      'display_photo', coalesce(pp.real_photo_url, p.avatar_url),
      'phone', pp.phone,
      'is_real_identity', true
    ) into v_result
    from public.profiles p
    join public.profiles_private pp on pp.id = p.id
    where p.id = p_target_user_id;
  else
    select jsonb_build_object(
      'display_name', p.pseudo,
      'display_photo', p.avatar_url,
      'is_real_identity', false
    ) into v_result
    from public.profiles p
    where p.id = p_target_user_id;
  end if;

  return v_result;
end;
$$ language plpgsql security definer;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create policy "conversations_select_participant"
  on public.conversations for select
  to authenticated
  using (auth.uid() in (participant_a, participant_b));

create policy "conversations_insert_participant"
  on public.conversations for insert
  to authenticated
  with check (auth.uid() in (participant_a, participant_b));

create policy "conversations_update_participant"
  on public.conversations for update
  to authenticated
  using (auth.uid() in (participant_a, participant_b));

create policy "messages_select_participant"
  on public.messages for select
  to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and auth.uid() in (c.participant_a, c.participant_b)
    )
  );

create policy "messages_insert_participant"
  on public.messages for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id and auth.uid() in (c.participant_a, c.participant_b)
    )
  );

-- ============================================================================
-- Notation post-contrat (Module 2 §2) : uniquement entre participants d'une
-- conversation de type 'contract' passée en statut 'completed' — "preuve
-- d'interaction", pas d'avis sans échange réel.
-- ============================================================================
create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  rater_id uuid not null references public.profiles(id) on delete cascade,
  rated_id uuid not null references public.profiles(id) on delete cascade,
  seriousness int not null check (seriousness between 1 and 5),
  quality int not null check (quality between 1 and 5),
  timeliness int not null check (timeliness between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),

  unique (conversation_id, rater_id)
);

create or replace function public.check_rating_allowed()
returns trigger as $$
declare
  v_conversation record;
begin
  select * into v_conversation from public.conversations where id = new.conversation_id;

  if v_conversation is null or v_conversation.type != 'contract' or v_conversation.contract_status != 'completed' then
    raise exception 'La notation n''est possible qu''après un contrat marqué terminé.';
  end if;

  if new.rater_id not in (v_conversation.participant_a, v_conversation.participant_b)
     or new.rated_id not in (v_conversation.participant_a, v_conversation.participant_b)
     or new.rater_id = new.rated_id then
    raise exception 'Notation invalide pour cette conversation.';
  end if;

  return new;
end;
$$ language plpgsql security definer;

create trigger before_rating_insert
  before insert on public.ratings
  for each row execute function public.check_rating_allowed();

-- Moyenne pondérée simple (Module 3 §3A). Note : une vraie pondération par
-- ancienneté du contrat est repoussée — voir docs/ARCHITECTURE.md, on ne
-- fabrique pas une formule de pondération arbitraire sans données réelles
-- pour la calibrer.
create or replace function public.update_profile_rating()
returns trigger as $$
declare
  v_avg_quality numeric;
begin
  select avg((quality + seriousness + timeliness) / 3.0) into v_avg_quality
  from public.ratings where rated_id = new.rated_id;

  update public.profiles
    set rating_average = round(v_avg_quality, 1),
        rating_count = rating_count + 1
    where id = new.rated_id;

  return new;
end;
$$ language plpgsql security definer;

create trigger after_rating_insert
  after insert on public.ratings
  for each row execute function public.update_profile_rating();

alter table public.ratings enable row level security;

create policy "ratings_select_all"
  on public.ratings for select
  to authenticated
  using (true);

create policy "ratings_insert_participant"
  on public.ratings for insert
  to authenticated
  with check (rater_id = auth.uid());

-- ============================================================================
-- Signalement direct d'un utilisateur (Module 4 §4, protection anti-
-- harcèlement) — distinct de post_reports (Module 2) qui signale un contenu,
-- pas une personne.
-- ============================================================================
create table public.user_reports (
  id uuid primary key default gen_random_uuid(),
  reported_user_id uuid not null references public.profiles(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (reason in ('harcelement', 'arnaque', 'langage', 'usurpation', 'autre')),
  conversation_id uuid references public.conversations(id) on delete set null,
  created_at timestamptz not null default now(),

  unique (reported_user_id, reporter_id, conversation_id)
);

create or replace function public.handle_user_report()
returns trigger as $$
begin
  update public.profiles_private
    set report_count = report_count + 1
    where id = new.reported_user_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_user_report
  after insert on public.user_reports
  for each row execute function public.handle_user_report();

alter table public.user_reports enable row level security;

create policy "user_reports_insert_own"
  on public.user_reports for insert
  to authenticated
  with check (reporter_id = auth.uid());
