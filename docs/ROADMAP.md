# Indigo — Roadmap

Roadmap en 4 phases livrables. On ne passe à la phase suivante que quand la
précédente est validée. Voir `docs/ARCHITECTURE.md` pour le détail des décisions
techniques.

## Phase 0 — Fondations (en cours)
- [x] Choix de stack (ADR-001, ADR-002)
- [x] Schéma de données Module 1 (`profiles` / `profiles_private`)
- [ ] Client Supabase + variables d'environnement
- [ ] Auth (inscription/connexion) migrée vers Supabase
- [ ] Règles de sécurité (RLS) posées et testées
- [ ] Hook responsive mobile-first → desktop/PWA

## Phase 1 — MVP social
- [ ] Profil complet (entonnoir : vital → expertise) — `EditProfileScreen`
- [ ] Feed + publication (Module 2) sur Supabase
- [ ] Modération niveau 1 (filtre automatique, signalement communautaire)
- [ ] Recherche basique (Module 3, sans scoring avancé)

## Phase 2 — Confiance & argent
- [ ] Notation post-contrat (Module 2 §2)
- [ ] Scoring côté serveur (Postgres function / Edge Function)
- [ ] Messagerie 3 niveaux : Social / Professionnel / Contrat (Module 4)
- [ ] Révélation d'identité réelle via RPC contractuelle (voir ADR-003)
- [ ] Intégration Campay (Mobile Money) + abonnements (Module 5)

## Phase 3 — Admin, croissance & robustesse
- [ ] Export PWA installable (service worker Workbox)
- [ ] Parrainage / Boost viral (Module 7)
- [ ] Mode Data Saver (compression, cache local)
- [ ] Gestion des litiges (Module 7)
- [ ] Dashboard admin custom si Supabase Studio devient insuffisant (Module 6)

## Backlog (reporté, pas oublié)
- Scroll infini sur le feed (à la Facebook/Instagram) au lieu du simple
  chargement de la première page — décision de Godwin du 20/07/2026 : plus
  adapté à ce type d'app que la pagination classique, mais pas prioritaire
  tant que le volume de publications reste faible.

## Suivi
Chaque case cochée correspond à un commit documenté. Les décisions ambiguës ou
flexibles sont toujours posées à Godwin avant d'être tranchées (voir ADR-004 pour
le format de suivi de ces arbitrages).
