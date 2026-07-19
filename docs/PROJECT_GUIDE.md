# Indigo — Guide de reprise du projet

**Si tu reprends ce projet dans une nouvelle conversation (nouveau clone, nouvelle
session), lis ce fichier en premier, puis `docs/ARCHITECTURE.md` et
`docs/ROADMAP.md` avant de coder quoi que ce soit.**

## Le projet en une phrase
Indigo est un réseau social professionnel hyper-local (Dschang/Cameroun) qui
connecte artisans, freelances, étudiants et entreprises, avec une confiance basée
sur la preuve (réalisations, contrats, avis) plutôt que sur le déclaratif.

## Travail en parallèle sur plusieurs discussions
Si Godwin mène plusieurs discussions de développement en parallèle, le travail
est découpé en 4 chantiers indépendants, chacun sur sa propre branche Git —
voir **`docs/WORKSTREAMS.md`**. Avant de coder quoi que ce soit dans une
nouvelle discussion :
1. Demander à Godwin quel chantier est concerné s'il ne l'a pas précisé.
2. Se placer sur la branche correspondante (`git checkout track-x-...`).
3. Ne modifier que les fichiers listés dans le périmètre de ce chantier —
   pour les fichiers "partagés", prévenir avant de toucher.

## Où trouver quoi
- `docs/ARCHITECTURE.md` — **toutes** les décisions techniques, avec leur raison
  et leurs compromis assumés (stack, backend, schéma de données, arbitrages
  budgétaires). Avant de proposer un changement d'architecture, vérifier qu'il
  n'a pas déjà été tranché ici — et si oui, pourquoi.
- `docs/ROADMAP.md` — les 4 phases du projet et ce qui est fait/à faire.
- `supabase/migrations/` — le schéma de base de données, versionné, dans l'ordre.
- Les modules fonctionnels originaux (spécification complète voulue par Godwin)
  ont été discutés et affinés en conversation ; leur version **à jour** (après
  arbitrages) est reflétée dans `docs/ARCHITECTURE.md` et `docs/ROADMAP.md`, pas
  dans un brief figé — en cas de doute sur une fonctionnalité, redemander à
  Godwin plutôt que de supposer.

## Principes de travail (à respecter dans toute session future)
1. **Documenter chaque décision.** Toute décision d'architecture ou de compromis
   fonctionnel s'ajoute à `docs/ARCHITECTURE.md` (format ADR : décision,
   pourquoi, compromis assumé) au moment où elle est prise — pas après coup.
2. **On travaille à deux.** Godwin porte le projet et prend les décisions finales.
   Si un choix qu'il propose semble avoir un coût technique/financier/UX caché,
   il faut le dire clairement, expliquer pourquoi, et essayer de le convaincre
   avec des arguments concrets — mais **jamais lui imposer un autre choix
   silencieusement** ni changer une décision déjà actée sans lui expliquer
   pourquoi et obtenir son accord.
3. **Contexte camerounais toujours présent** : budget étudiant (pas de solution
   qui coûte cher dès le départ), connexions lentes/instables (compression,
   mode hors-ligne, pas d'autoplay vidéo), Mobile Money local (Campay/MTN/Orange).
4. **Tester en local avant de considérer une fonctionnalité terminée** — `npm
   install`, `.env` renseigné avec un vrai projet Supabase, `npx expo start`.
5. **Avancer par petits blocs validés**, pas par gros dump de code non discuté —
   voir `docs/ROADMAP.md` pour l'ordre des priorités.

## Démarrer en local
Voir `docs/LOCAL_DEV.md` pour l'environnement complet (Docker + Supabase CLI).
Démarrage rapide sans CLI (contre le projet Supabase de production directement) :
```bash
git clone https://github.com/Godwin296/Indigo.git
cd Indigo
npm install
cp .env.example .env   # puis renseigner les vraies clés Supabase (jamais commité)
npx expo start
```

## État des lieux rapide (voir ROADMAP.md pour le détail)
- ✅ Module 1 (Auth + Profil) codé sur Supabase.
- ⏳ `EditProfileScreen`, `RequestVerificationScreen` et les services Module
  2/3/5 (`PostService`, `scoreService`, etc.) sont encore sur l'ancien code
  Firebase — à migrer un par un, pas en bloc.
