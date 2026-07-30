-- ============================================================================
-- Module 3 : Moteur de recherche — optimisation profils
-- Voir docs/ARCHITECTURE.md. Recherche "basique" pour la Phase 1 (pas de
-- scoring avancé, pas de géo-radius réel pour l'instant — filtre par ville en
-- texte simple, suffisant vu le volume attendu au lancement).
--
-- Note sur la portée : cette migration ne touche que `profiles` (déjà présent
-- sur `main`). La recherche sur les publications (`posts`) sera ajoutée une
-- fois le Chantier A (Module 2) fusionné dans `main` — voir docs/WORKSTREAMS.md
-- pour ne pas coupler deux branches non encore validées.
-- ============================================================================

-- pg_trgm permet une recherche texte "floue" (ILIKE) performante avec un
-- index, au lieu d'un scan complet de la table à chaque recherche.
create extension if not exists pg_trgm;

create index profiles_pseudo_trgm_idx on public.profiles using gin (pseudo gin_trgm_ops);
create index profiles_main_skill_trgm_idx on public.profiles using gin (main_skill gin_trgm_ops);

-- Index composé pour le tri par défaut du Module 3 §2 (qualité décroissante).
create index profiles_rating_idx on public.profiles (rating_average desc, rating_count desc);
