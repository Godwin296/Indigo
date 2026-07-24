# Développement local — Docker + Supabase CLI

Voir `docs/ARCHITECTURE.md` (ADR-005 §1) pour le raisonnement. Ce guide permet
de tester les migrations et l'app **sans toucher au projet Supabase de
production**.

## Installation (une seule fois)

1. Installer **Docker Desktop** : https://www.docker.com/products/docker-desktop/
   (gratuit, requis pour que le CLI Supabase puisse lancer Postgres/Auth/Storage
   en local).
2. Installer le **CLI Supabase** :
   ```bash
   npm install -g supabase
   ```
3. Depuis la racine du projet, se connecter et lier le projet :
   ```bash
   supabase login
   supabase link --project-ref <ton-project-ref>   # trouvable dans l'URL du dashboard
   ```

## Utilisation au quotidien

```bash
# Démarrer la stack locale (Postgres + Auth + Storage + Studio local)
supabase start

# Appliquer toutes les migrations de supabase/migrations/ à la base locale
supabase db reset

# Une fois testé en local et validé, pousser la migration vers la prod
supabase db push
```

`supabase start` affiche une URL et une clé `anon` **locales** (différentes de
celles de production) — utiliser temporairement celles-ci dans `.env` pendant
qu'on développe/teste une migration, puis remettre les clés de prod pour tester
contre les vraies données.

## Pourquoi ce flux
Avant, toute migration SQL était collée directement dans le SQL Editor du
projet de production. Ça marche, mais une erreur de migration touche
directement les vraies données. Avec `supabase start`, on teste d'abord sur une
base jetable en local (les conteneurs Docker), et on ne pousse en prod
(`supabase db push`) qu'une fois sûr que ça fonctionne.
