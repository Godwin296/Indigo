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

## Historique

- 2026-07-18 — ADR-001 à ADR-004 : bascule Firebase → Supabase, socle Expo
  universel, révisions réalistes du cahier des charges. Début de l'implémentation
  du Module 1 (Auth + Profil).
