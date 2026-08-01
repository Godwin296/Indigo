-- ============================================================================
-- Pivot stratégique (20/07/2026) : lancement comme "app de promotion" pour
-- construire la communauté avant d'exposer Mode Contrat / monétisation.
-- Voir docs/ARCHITECTURE.md (ADR-006) pour le raisonnement complet.
-- ============================================================================

-- 1. Nouveau type de publication : promotion (flyers/pubs de business locaux)
alter table public.posts drop constraint if exists posts_post_type_check;
alter table public.posts add constraint posts_post_type_check
  check (post_type in ('service', 'offre_emploi', 'recherche', 'realisation', 'urgence', 'promotion'));

alter table public.posts add column valid_until timestamptz;

-- 2. Seul un compte admin peut créer une publication de type 'promotion'.
-- On remplace la policy d'insertion existante pour y ajouter cette condition.
drop policy if exists "posts_insert_own" on public.posts;

create policy "posts_insert_own"
  on public.posts for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and (
      post_type != 'promotion'
      or exists (select 1 from public.profiles where id = auth.uid() and account_type = 'admin')
    )
  );

-- ============================================================================
-- 3. CORRECTIF DE SÉCURITÉ : rien n'empêchait un utilisateur normal de
-- modifier lui-même des champs privilégiés de son propre profil
-- (account_type -> 'admin', verified_badge, notes, statut d'abonnement...)
-- via une simple requête UPDATE — la policy `profiles_update_own` vérifie
-- seulement que c'est son propre profil, pas QUELS champs sont modifiés.
-- Même pattern de protection que pour `posts.status` (migration 0003).
-- ============================================================================
create or replace function public.protect_privileged_profile_fields()
returns trigger as $$
begin
  if current_user = 'authenticated' then
    new.account_type := old.account_type;
    new.verified_badge := old.verified_badge;
    new.rating_average := old.rating_average;
    new.rating_count := old.rating_count;
    new.contracts_completed := old.contracts_completed;
    new.subscription_tier := old.subscription_tier;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger before_profile_update_protect
  before update on public.profiles
  for each row execute function public.protect_privileged_profile_fields();
