-- ============================================================================
-- Module 1 : Gestion des comptes et identités
-- Voir docs/ARCHITECTURE.md (ADR-002, ADR-003) pour le raisonnement complet.
-- ============================================================================

-- Extension nécessaire pour la géolocalisation (Module 3 : géo-radius)
create extension if not exists postgis;

-- ============================================================================
-- TABLE PUBLIQUE : profiles
-- Lisible par tout utilisateur authentifié (profil "Social").
-- Ne contient JAMAIS l'identité réelle (nom/photo réels) ni les données de
-- sécurité/scoring — voir profiles_private.
-- ============================================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,

  -- Étape vitale (< 1 min à l'inscription)
  pseudo text not null,
  avatar_url text,
  cover_url text,
  account_type text not null default 'particulier'
    check (account_type in ('particulier', 'entreprise', 'admin')),
  particulier_level text
    check (particulier_level in ('etudiant', 'travailleur') or particulier_level is null),

  -- Localisation
  country text default 'Cameroun',
  city text default 'Dschang',
  neighborhood text,
  geopoint geography(Point, 4326),

  -- Étape expertise (remplie progressivement — Progressive Profiling)
  main_skill text,
  skills jsonb not null default '[]'::jsonb,        -- [{ name, level }]
  experience_years int,
  languages jsonb not null default '[]'::jsonb,     -- ["Français", ...]
  disability text,
  availability text default 'disponible'
    check (availability in ('disponible', 'occupe', 'indisponible')),
  bio text,

  -- Diplômes déclaratifs (Module 1 §2B)
  diplomas jsonb not null default '[]'::jsonb,      -- [{ name, institution, year, status }]

  -- Confiance (calculée serveur — écriture réservée aux Cloud/Edge Functions, cf ADR-002)
  rating_average numeric(2,1) not null default 0,
  rating_count int not null default 0,
  contracts_completed int not null default 0,
  verified_badge boolean not null default false,    -- attribué par l'admin uniquement

  -- Abonnement — seul le "tier" est public (affichage badge), le reste est privé
  subscription_tier text not null default 'standard'
    check (subscription_tier in ('standard', 'premium_artisan', 'booste_pro', 'starter_business', 'pro_business')),

  -- Progression du profil
  profile_completed boolean not null default false,
  onboarding_step text not null default 'vital'
    check (onboarding_step in ('vital', 'expertise', 'complete')),

  created_at timestamptz not null default now(),
  last_active timestamptz not null default now()
);

create index profiles_city_idx on public.profiles (city);
create index profiles_main_skill_idx on public.profiles (main_skill);
create index profiles_geopoint_idx on public.profiles using gist (geopoint);

-- Sous-table réalisations (Module 1 §2B — Priorité 1, galerie de preuves)
create table public.realisations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  media_url text not null,
  media_type text not null check (media_type in ('photo', 'video')),
  caption text,
  created_at timestamptz not null default now()
);

create index realisations_user_id_idx on public.realisations (user_id);

-- ============================================================================
-- TABLE PRIVÉE : profiles_private
-- Lisible UNIQUEMENT par le propriétaire et l'admin. Contient l'identité réelle
-- (nom/photo — cf ADR-003), les infos de contact, et les données de sécurité.
-- ============================================================================
create table public.profiles_private (
  id uuid primary key references public.profiles(id) on delete cascade,

  email text,
  phone text,
  whatsapp text,

  -- Identité réelle — révélée uniquement en Mode Contrat via RPC dédiée (Module 4, à venir)
  real_name text,
  real_photo_url text,

  -- Abonnement (détail complet, jamais exposé publiquement)
  subscription_status text not null default 'inactive'
    check (subscription_status in ('active', 'inactive', 'expired')),
  subscription_end_date timestamptz,
  boosted_visible boolean not null default false,   -- "Shadow Boost" (Module 3 §3)

  -- Score de crédibilité "secret" (Module 3) — écrit uniquement par une Edge Function
  credibility_score numeric not null default 0,

  -- Sécurité (Module 1 §4)
  report_count int not null default 0,              -- indice de vigilance
  warnings int not null default 0,
  is_suspended boolean not null default false,
  suspension_reason text,
  failed_login_attempts int not null default 0,
  locked_until timestamptz,
  blocked_users jsonb not null default '[]'::jsonb,  -- [uuid, ...]
  device_ids jsonb not null default '[]'::jsonb,     -- empreinte d'installation (pas d'IMEI, cf ADR-004)

  -- Droit à l'oubli (Module 1 §4)
  data_deletion_requested boolean not null default false,
  data_deletion_requested_at timestamptz
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.profiles_private enable row level security;
alter table public.realisations enable row level security;

-- profiles : lecture publique (tout utilisateur authentifié), écriture par le propriétaire
create policy "profiles_select_all_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- profiles_private : lecture/écriture réservées au propriétaire (l'admin passe par
-- un rôle serveur/service_role dans les Edge Functions, pas par ce chemin client)
create policy "profiles_private_select_own"
  on public.profiles_private for select
  to authenticated
  using (auth.uid() = id);

create policy "profiles_private_update_own"
  on public.profiles_private for update
  to authenticated
  using (auth.uid() = id);

create policy "profiles_private_insert_own"
  on public.profiles_private for insert
  to authenticated
  with check (auth.uid() = id);

-- realisations : lecture publique, écriture par le propriétaire uniquement
create policy "realisations_select_all_authenticated"
  on public.realisations for select
  to authenticated
  using (true);

create policy "realisations_insert_own"
  on public.realisations for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "realisations_delete_own"
  on public.realisations for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================================================
-- Trigger : création automatique de la ligne profiles_private à l'inscription
-- (évite d'avoir à gérer deux inserts séparés côté client à chaque signup)
-- ============================================================================
create or replace function public.handle_new_profile()
returns trigger as $$
begin
  insert into public.profiles_private (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_profile_created
  after insert on public.profiles
  for each row execute function public.handle_new_profile();
