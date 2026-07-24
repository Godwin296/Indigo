-- ============================================================================
-- Module 1 (complément) : demande de vérification "Expert Vérifié"
-- Le badge lui-même (profiles.verified_badge) n'est modifiable que par l'admin
-- (via Supabase Studio en MVP, cf ADR-004 dans docs/ARCHITECTURE.md). Ici on
-- ajoute juste le suivi de la demande, côté utilisateur.
-- ============================================================================

alter table public.profiles_private
  add column verification_requested boolean not null default false,
  add column verification_status text not null default 'none'
    check (verification_status in ('none', 'pending', 'approved', 'rejected')),
  add column verification_requested_at timestamptz;
