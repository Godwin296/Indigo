# Indigo — Décisions d'architecture

Ce fichier est la source de vérité des choix techniques. Chaque décision importante
est documentée ici avec sa date, sa raison, et ses compromis assumés. On l'actualise
à chaque décision structurante pour ne jamais avoir à reformuler tout le contexte.

---

## ADR-001 — Stack applicative : Expo (React Native) universel

**Décision** : on garde Expo/React Native comme socle unique pour iOS, Android **et**
Web (PWA), au lieu de choisir entre "app mobile" et "PWA".

**Pourquoi** : le projet a déjà `react-native-web` en dépendance. Une seule base de
code peut produire les trois cibles. Ça évite une réécriture et répond au besoin
budgétaire (pas de deuxième équipe/code pour le web).

**Compromis assumé** : Expo Router (basé sur Metro) ne génère pas de PWA installable
"clé en main" — le service worker (mode hors-ligne, installation) doit être branché
manuellement avec Workbox. → Reporté en **Phase 3** (pas bloquant pour le MVP mobile).

**Mobile-first** : tous les écrans sont conçus pour un viewport mobile (~375–430px)
en premier. Sur web/desktop, on ne "réétire" pas les composants dans le vide — on
centre le contenu dans une colonne de largeur contrainte (comme X/Twitter ou LinkedIn
en version desktop), via le hook `useResponsive` (`src/hooks/useResponsive.js`).

**Règle systématique (ajoutée le 21/07/2026, suite à un bug réel sur
`LoginScreen`)** : tout écran avec plusieurs éléments verticaux (formulaire,
liste de champs...) doit être enveloppé dans un `ScrollView`
(`keyboardShouldPersistTaps="handled"`), jamais un simple `View` avec
`justifyContent: 'center'`. Sur un écran physique plus petit que prévu, un
contenu qui déborde d'un `View` non scrollable devient définitivement
inatteignable — pas juste moche, littéralement impossible à toucher. C'était
le cas de `LoginScreen` (corrigé) ; à vérifier systématiquement sur tout
nouvel écran.

---

## ADR-002 — Backend : Supabase (Postgres) plutôt que Firebase

**Décision** : migration de Firebase vers Supabase pour l'auth, la base de données et
le storage.

**Pourquoi** :
- Firebase facture à l'opération (lecture/écriture). Un feed social avec écoute
  temps réel peut dépasser le quota gratuit (50k lectures/jour) rapidement et
  basculer sur facturation à l'usage — risque financier réel pour un projet étudiant
  sans budget.
- Supabase free tier n'a **aucune limite d'opérations** (juste stockage/bande
  passante), donc pas de facture surprise pendant la croissance.
- Les données du projet sont fondamentalement relationnelles (users ↔ posts ↔
  contrats ↔ signalements ↔ abonnements ↔ parrainages) → Postgres/SQL est un
  meilleur fit que le NoSQL Firestore.
- Row Level Security (RLS) de Postgres permet une séparation propre entre données
  publiques et privées (voir ADR-003), sans dupliquer les données dans deux
  collections comme on l'aurait fait sous Firestore.
- Le Storage Supabase transforme les images à la volée (resize/compression via URL)
  → répond quasi gratuitement au besoin "Mode Data Saver" du Module 7.
- Coût prévisible : $25/mois en Pro (forfait fixe) contre une facturation Firebase
  potentiellement imprévisible au même trafic.

**Compromis assumés** :
- Pas de persistance hors-ligne automatique "clé en main" comme Firestore — à
  construire nous-mêmes (cache local + synchronisation) quand on abordera le
  Module 4 (messagerie offline-first) et le Module 7 (Data Saver).
- Le projet gratuit Supabase se met en pause après 7 jours d'inactivité (sans
  impact en production avec du trafic réel — juste à surveiller pendant le dev).

**Migration** : Firebase n'est **pas retiré d'un coup**. On migre module par module
pour ne rien casser :
- ✅ Migré : Auth + Profil (Module 1) → ce commit.
- ⏳ À migrer ensuite : `PostService`, `scoreService`, `ratingService`,
  `blockService`, `reportService`, `activityService`, `subscriptionService`
  (Modules 2/3/5), + `EditProfileScreen`, `RequestVerificationScreen`.
- La dépendance `firebase` et `src/firebase/` restent dans le repo jusqu'à ce que
  ces services soient migrés, pour ne pas casser les écrans qui en dépendent encore.

**Upload d'images** : reste sur **Cloudinary** (déjà en place dans
`AuthService.js`, gratuit, indépendant du choix de backend) — pas de raison de
changer ça.

---

## ADR-003 — Modèle de données Module 1 : séparation identité publique/privée

**Décision** : deux tables Postgres au lieu d'un seul document utilisateur.

- `profiles` — lisible publiquement (profil "Social", pseudo, compétences, avis...).
- `profiles_private` — lisible uniquement par le propriétaire + l'admin (via RLS) :
  email, téléphone, **nom réel et photo réelle**, score de crédibilité brut, statut
  "boosté" (Shadow Boost), signalements, sécurité.

**Raffinement par rapport à la discussion initiale** : le nom réel et la photo
réelle (`real_name`, `real_photo_url`) ont été déplacés dans `profiles_private`,
et non simplement "cachés côté écran" comme évoqué au départ. Sinon, n'importe qui
pourrait interroger directement la table publique et lire l'identité réelle d'un
utilisateur, ce qui viderait de son sens la "levée d'anonymat progressive" du
Module 1. La révélation de l'identité réelle en Mode Contrat (Module 4) devra
passer par une fonction serveur (RPC Postgres) qui vérifie qu'un contrat/échange
valide existe entre les deux utilisateurs avant de renvoyer ces champs — **à
construire au Module 4**, pas maintenant. Le schéma est posé pour que ce soit
possible sans nouvelle migration.

---

## ADR-004 — Fonctionnalités révisées pour réalisme technique/budgétaire

Ces points du cahier des charges initial sont volontairement **redéfinis**, avec
l'accord de Godwin (18/07/2026) :

| Sujet | Prévu initialement | Décision retenue | Raison |
|---|---|---|---|
| Appels audio/vidéo | Appels internes intégrés (VoIP) | Bouton "Appeler" natif du téléphone (`tel:`) en MVP | VoIP maison = infra coûteuse (WebRTC/TURN). Reporté en V2 quand il y aura des revenus pour un service managé. |
| Chiffrement messagerie | "Chiffré de bout en bout" | Chiffrement en transit + au repos (standard) | Le vrai E2EE empêcherait l'admin de lire les 5 derniers messages pour arbitrer un litige (exigé au Module 6) — contradiction logique. |
| Bannissement "IMEI/SIM" | Bannissement matériel du téléphone | Liste noire par numéro + empreinte d'installation | iOS et Android ne donnent plus accès à l'IMEI aux apps depuis plusieurs années. |
| Dashboard Admin (Module 6) | App/panneau admin custom | Supabase Studio en MVP | Interface d'administration déjà fournie gratuitement par Supabase — construire un panneau custom attend que le volume de modération le justifie. |

---

## ADR-005 — Infrastructure locale, mode offline, compression, sécurité

Décision prise suite à la demande de Godwin du 19/07/2026. Chaque point est traité
séparément, avec ce qu'on adopte, ce qu'on adapte, et ce qu'on écarte (avec la
raison).

### 1. Docker — oui, mais pas pour ce que tu penses
**Docker pour l'app mobile elle-même : non.** Expo/React Native tourne sur un
simulateur ou un vrai téléphone, pas dans un conteneur — le conteneuriser
n'apporterait rien et compliquerait le développement (accès caméra, GPS,
notifications... tout ça ne marche pas bien depuis un conteneur Linux).

**Docker pour l'environnement Supabase local : oui, et c'est très pertinent.**
Le CLI officiel Supabase (`supabase start`) utilise Docker en interne pour
lancer une stack Postgres + Auth + Storage **identique à la prod, en local, et
gratuite**. C'est exactement l'outil pour "tester en local" sans toucher au
projet de production à chaque migration. Voir `docs/LOCAL_DEV.md`.

### 2. Fidélité aux maquettes
Déjà le principe suivi depuis le début (ex : `FeedPostCard.js` reproduit l'image
3 des maquettes presque à l'identique). Rien à changer, on continue comme ça.

### 3. Mode offline
Supabase n'a pas l'équivalent du cache offline automatique de Firestore (compromis
déjà assumé en ADR-002). Construire une vraie synchronisation bidirectionnelle
(écriture hors-ligne + résolution de conflits) maintenant serait un chantier à
part entière, risqué si fait à la va-vite. On avance par étapes :
- **Maintenant** : cache de lecture simple (AsyncStorage) pour le feed et les
  profils déjà consultés — utilisable hors-ligne, avec indicateur "vu il y a
  X min". Pas d'écriture hors-ligne pour l'instant (publier un post nécessite
  une connexion).
- **Phase 3** (déjà prévu dans `docs/ROADMAP.md`, Module 7) : vraie
  synchronisation avec file d'attente d'actions en attente de réseau.

### 4. Indexation PostgreSQL
Déjà fait dans les migrations existantes : index sur `(status, created_at)`,
`user_id`, `category`, `city` pour `posts`, et `city`, `main_skill`, `geopoint`
(GIST) pour `profiles`. On garde ce réflexe à chaque nouvelle table.

### 5. Compression réseau
Supabase sert son API derrière un CDN qui gère déjà la compression HTTP standard
(gzip/brotli) au niveau transport — ce n'est pas quelque chose à coder
nous-mêmes, et y passer du temps de dev n'apporterait rien de plus que ce que la
plateforme fait déjà.

### 6. Compression de fichiers
Déjà en place : Cloudinary + qualité 0.6 sur tous les pickers d'image (voir
`ProfileImagePicker`, `AddPostScreen`). On applique systématiquement cette même
règle à chaque nouvel endroit qui upload un fichier.

### 7. Sécurité — ce qui est déjà en place
- RLS activé sur **toutes** les tables (`profiles`, `profiles_private`, `posts`,
  `post_reports`) — jamais de table ouverte par défaut.
- Séparation public/privé dès le schéma (ADR-003), pas juste côté écran.
- Compteur de tentatives de connexion échouées prévu dans le schéma
  (`profiles_private.failed_login_attempts`) + protection native Supabase
  (rate limiting / Attack Protection, vu ensemble dans le dashboard).
- Assainissement des entrées utilisateur contre les caractères d'injection
  (`src/utils/validators.js`).
- Aucun secret dans le repo : `.env` ignoré par git, seule la clé publique
  `anon` est utilisée côté app — la clé `service_role` ne sera **jamais**
  utilisée ailleurs que dans une Edge Function (Chantier D).
- Triggers Postgres qui empêchent un utilisateur normal de modifier lui-même
  ses champs de modération (`posts.status`, `report_count` — voir migration
  0003) ou ses données de confiance (`credibility_score`, `boosted_visible`).

### 8. Sécurité — ce qu'on écarte pour l'instant (et pourquoi)
**Détection anti-stéganographie dédiée : hors scope.** C'est un vrai sujet de
recherche à part entière (analyse d'image, taux de faux positifs élevé), pas
une fonctionnalité qu'on ajoute "en plus" à moindre coût. Pour un marketplace
artisanal à ce stade (pas une plateforme à enjeu national), le rapport
effort/risque ne le justifie pas. Si un vrai signal apparaît un jour (contenu
illicite caché signalé concrètement), on traitera **ce cas précis** avec un
outil ciblé plutôt que de construire un système préventif générique maintenant.
Le vrai rempart contre le contenu malveillant reste la modération de contenu
classique déjà prévue (Module 2 : filtre auto, signalement communautaire,
quarantaine).

**Chiffrement de bout en bout des messages : déjà tranché en ADR-004** (on reste
sur chiffrement standard transit + stockage, pas de vrai E2EE, à cause de la
contradiction avec l'arbitrage admin des litiges).

### 9. Sécurité — prochaines étapes (progressives, pas toutes d'un coup)
- Audit RLS systématique avant chaque nouvelle table mise en production.
- Authentification à deux facteurs (Supabase Multi-Factor, vu dans le
  dashboard) — à proposer en option utilisateur, Phase 2.
- Rate limiting applicatif sur les actions sensibles (signalement, publication)
  — Chantier D, avec les Edge Functions admin.

## ADR-006 — Pivot de lancement : app de promotion avant marketplace complet

**Décision** (20/07/2026) : Indigo ne se positionne plus au lancement comme un
marketplace complet avec monétisation, mais comme une **app de promotion
locale** : des flyers/publicités de business de la ville, postés uniquement
par l'admin (Godwin) au départ, que les utilisateurs découvrent, likent,
commentent et à propos desquels ils peuvent engager une conversation —
volontairement sociale au début, pas orientée contrat.

**Pourquoi** : conquérir un maximum de public avec un produit à friction quasi
nulle (voir une promo ne demande aucun engagement), avant d'exposer les
fonctionnalités plus lourdes (Mode Contrat, paiement) une fois la communauté
là. Approche "wedge product" classique.

**Ce que ça change concrètement** :
- Nouveau type de publication `promotion` (migration 0007) : bandeau visuel
  doré distinct, date de validité optionnelle (auto-nettoyage — disparaît du
  flux à l'échéance sans action manuelle, cohérent avec le principe déjà posé
  au Module 2).
- Seul un compte `account_type = 'admin'` peut créer une publication de type
  `promotion` — appliqué en base (policy RLS), pas juste caché côté écran.
- Le Chantier D ("Monétisation & Admin") se scinde : la partie **Admin/
  Modération reste prioritaire** (plus important même, avec du contenu public
  à modérer), la partie **Monétisation (Campay, abonnements) est mise en
  pause** — le code déjà pensé (schéma `subscription_tier`, etc.) reste en
  place, juste pas exposé aux utilisateurs pour l'instant.
- Roadmap réordonnée en conséquence — voir `docs/ROADMAP.md`.

**Correctif de sécurité découvert en implémentant ce pivot** : rien
n'empêchait un utilisateur normal de modifier lui-même des champs privilégiés
de son propre profil (`account_type`, `verified_badge`, `rating_average`...)
via une requête directe — la policy RLS vérifiait seulement "c'est ton
profil", pas quels champs. Corrigé par un trigger de protection (même
mécanisme que pour `posts.status`, migration 0003). Sans ce correctif, la
restriction "seul l'admin poste des promos" aurait été contournable en
changeant simplement son propre `account_type`.

**Activer le premier compte admin** : aucune UI ne permet de le faire (normal,
pour ne pas exposer ça). Une seule fois, manuellement, dans Supabase Studio →
Table Editor → `profiles` → trouver ta ligne → changer `account_type` en
`admin`. C'est tout.

## Historique

- 2026-07-20 — ADR-006 : pivot de lancement (app de promotion, croissance
  d'abord), nouveau type `promotion` (admin-only), correctif de sécurité sur
  les champs privilégiés du profil.
- 2026-07-19 — ADR-005 : environnement Supabase local via Docker/CLI, stratégie
  offline progressive, clarification compression/sécurité, périmètre explicite
  de ce qu'on n'implémente pas encore (anti-stéganographie) et pourquoi.
- 2026-07-18 — ADR-001 à ADR-004 : bascule Firebase → Supabase, socle Expo
  universel, révisions réalistes du cahier des charges. Début de l'implémentation
  du Module 1 (Auth + Profil).
