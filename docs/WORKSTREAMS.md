# Indigo — Découpage en 4 chantiers (Workstreams)

**But** : permettre 4 discussions de développement en parallèle sans conflits de
commit. Chaque chantier a sa propre branche Git et son propre périmètre de
fichiers. Une discussion = une branche = un chantier. On ne travaille jamais à
deux chantiers sur la même branche.

## Règle d'or
1. Au début de **chaque nouvelle discussion**, dire explicitement à Claude :
   *"On travaille sur le Chantier [A/B/C/D], branche `[nom-de-branche]`."*
2. Claude doit d'abord lire ce fichier + `docs/PROJECT_GUIDE.md` +
   `docs/ROADMAP.md`, puis se placer (`git checkout`) sur la bonne branche
   avant de coder quoi que ce soit.
3. Un chantier ne modifie **que les fichiers listés dans son périmètre**. S'il a
   besoin de toucher un fichier "partagé" (voir plus bas), il doit le signaler à
   Godwin avant de le faire — pas juste foncer.
4. Quand un chantier est validé par Godwin, il est fusionné dans `main` (via
   Pull Request GitHub, ou directement par Claude si Godwin le demande). Après
   chaque fusion dans `main`, les **autres chantiers doivent récupérer `main`**
   dans leur branche (`git merge main`) avant de continuer, pour rester
   synchronisés.

---

## Chantier A — Profil & Publications
**Branche** : `track-a-profil-contenu`
**Modules couverts** : fin du Module 1 (profil), Module 2 (publications/feed)

Fichiers/dossiers concernés :
- `src/screens/EditProfileScreen.js`, `RequestVerificationScreen.js`
- `src/screens/FeedScreen.js`, `AddPostScreen.js`, `PostCard.js`
- `src/services/PostService.js`
- Nouvelles migrations SQL : `supabase/migrations/0002_module2_posts.sql`

## Chantier B — Recherche & Découverte
**Branche** : `track-b-recherche`
**Modules couverts** : Module 3 (moteur de recherche, géolocalisation, classement)

Fichiers/dossiers concernés :
- Nouvel écran `src/screens/SearchScreen.js` (à créer)
- Nouveau service `src/services/searchService.js` (à créer)
- Migration SQL dédiée : `supabase/migrations/0003_module3_search.sql`

## Chantier C — Messagerie & Confiance
**Branche** : `track-c-messagerie-confiance`
**Modules couverts** : Module 4 (messagerie 3 niveaux, appels), notation
(Module 2 §2), scoring serveur (Module 3 §3)

Fichiers/dossiers concernés :
- `src/services/ratingService.js`, `scoreService.js`, `blockService.js`,
  `reportService.js`
- Nouveaux écrans de chat (à créer sous `src/screens/chat/`)
- Migration SQL dédiée : `supabase/migrations/0004_module4_messagerie.sql`
- La fonction RPC de révélation d'identité réelle (voir ADR-003 dans
  `docs/ARCHITECTURE.md`) est codée ici.

## Chantier D — Monétisation & Administration
**Branche** : `track-d-monetisation-admin`
**Modules couverts** : Module 5 (abonnements, Campay), Module 6 (admin/modération),
Module 7 (parrainage, mode Data Saver, litiges)

Fichiers/dossiers concernés :
- `src/screens/UpgradeScreen.js`
- `src/services/subscriptionService.js`, `activityService.js`
- Migration SQL dédiée : `supabase/migrations/0005_module5_abonnements.sql`
- Intégration Campay (nouveau dossier `src/services/payments/`)

---

## Fichiers "partagés" (coordination obligatoire avant modification)
Ces fichiers sont utilisés par tous les chantiers. Toute modification dessus doit
être annoncée à Godwin (quel chantier, pourquoi) avant d'être faite, pour éviter
qu'un chantier casse le travail d'un autre sans le savoir :
- `src/lib/supabase.js`, `src/context/AuthContext.js`, `src/services/AuthService.js`
- `src/navigation/AppNavigator.js`
- `src/theme/theme.js`, `src/constants/colors.js`
- `docs/ARCHITECTURE.md`, `docs/ROADMAP.md` (tout le monde peut **ajouter** une
  décision qui le concerne, personne ne doit réécrire la partie d'un autre
  chantier)
- `package.json` (ajout de dépendance : à signaler, pas de suppression sans accord)

## État des chantiers
| Chantier | Branche | Statut |
|---|---|---|
## État des chantiers
| Chantier | Branche | Statut |
|---|---|---|
| A — Profil & Publications | `track-a-profil-contenu` | 🟢 Fusionné dans main (Module 1 fini, Module 2 : posts + likes/commentaires) |
| B — Recherche & Découverte | `track-b-recherche` | 🟢 Fusionné dans main (Talents/Entreprises ; Services/Offres/Publications à activer maintenant que Module 2 est dans main) |
| C — Messagerie & Confiance | `track-c-messagerie-confiance` | 🟢 Fusionné dans main (conversations 3 niveaux, Mode Contrat, notation, litiges Module 7 §3) |
| D — Monétisation & Admin | `track-d-monetisation-admin` | 🟡 Prêt à démarrer |

*(Mettre à jour ce tableau — 🟡 prêt / 🔵 en cours / 🟢 fusionné dans main — à
chaque étape importante, dans le commit qui la marque.)*
