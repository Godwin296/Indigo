# Indigo — Roadmap

Roadmap réordonnée suite au pivot de lancement (ADR-006, 20/07/2026) : on
priorise la croissance de la communauté via une app de promotion locale,
avant d'exposer Mode Contrat et monétisation. Voir `docs/ARCHITECTURE.md`
pour le détail des décisions techniques.

## Phase 0 — Fondations ✅ Terminée
- [x] Choix de stack (ADR-001, ADR-002)
- [x] Schéma de données Module 1 (`profiles` / `profiles_private`)
- [x] Client Supabase + variables d'environnement
- [x] Auth (inscription/connexion) sur Supabase
- [x] Règles de sécurité (RLS) posées sur toutes les tables
- [x] Hook responsive mobile-first → desktop/PWA

## Phase 1 — Croissance : l'app de promotion (priorité actuelle)
- [x] Profil complet (entonnoir : vital → expertise) — `EditProfileScreen`
- [x] Feed + publication (Module 2), likes/commentaires/partage
- [x] Publications de type `promotion` (admin-only) avec date de validité
- [x] Modération niveau 1 (filtre automatique, signalement communautaire)
- [x] Recherche (Talents/Entreprises/Services/Offres/Promotions/Publications)
- [x] Messagerie sociale (Module 4) pour réagir aux promos et discuter
- [ ] Écran de profil public (consulter un tiers depuis recherche/publication)
- [ ] Export PWA installable (service worker Workbox) — pour maximiser la portée

## Phase 2 — Rétention communautaire
- [ ] Parrainage / Boost viral (Module 7) — prioritaire pour la croissance
- [ ] Mode Data Saver (compression, cache local)
- [ ] Admin/Modération : file de signalements, actions rapides (Module 6) —
      plus important maintenant qu'il y a du contenu public à modérer

## Phase 3 — Confiance progressive (déjà codée, restée discrète)
- [x] Notation post-contrat (Module 2 §2)
- [x] Messagerie 3 niveaux : Social / Professionnel / Contrat (Module 4)
- [x] Révélation d'identité réelle via RPC contractuelle (ADR-003)
- [x] Gestion des litiges (Module 7 §3)
- [ ] Mettre ces fonctionnalités en avant dans l'UI, une fois la communauté là

## Phase 4 — Monétisation (en pause volontaire, ADR-006)
- [ ] Intégration Campay (Mobile Money) + abonnements (Module 5)
- [ ] Scoring de crédibilité côté serveur (Module 3 §3) — pas fabriqué sans
      données réelles pour le calibrer, voir ADR-005/006

## Points d'intégration post-fusion (à ne pas oublier)
- ~~**Chantier B ↔ C** : bouton "Contacter" de `SearchScreen`~~ — **résolu**
  (branché sur `chatService.getOrCreateConversation` + navigation vers `Chat`).
- **Chantier A ↔ C** : toujours ouvert — pas encore d'écran de profil public
  pour un tiers (seul le profil de l'utilisateur connecté existe). À faire :
  un écran `PublicProfileScreen` accessible depuis les résultats de recherche
  et les publications, avec un bouton "Contacter" branché de la même manière.

## Backlog (reporté, pas oublié)
- Scroll infini sur le feed (à la Facebook/Instagram) au lieu du simple
  chargement de la première page — décision de Godwin du 20/07/2026 : plus
  adapté à ce type d'app que la pagination classique, mais pas prioritaire
  tant que le volume de publications reste faible.

## Suivi
Chaque case cochée correspond à un commit documenté. Les décisions ambiguës ou
flexibles sont toujours posées à Godwin avant d'être tranchées (voir ADR-004 pour
le format de suivi de ces arbitrages).
