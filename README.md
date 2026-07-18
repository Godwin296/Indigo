# Indigo

Réseau social professionnel hyper-local (Dschang, Cameroun) — les talents réels,
les opportunités concrètes.

## 📖 Avant toute chose

Si tu reprends ce projet (nouveau clone, nouvelle session de dev), commence par
lire, dans l'ordre :

1. [`docs/PROJECT_GUIDE.md`](docs/PROJECT_GUIDE.md) — comment reprendre le projet et principes de travail
2. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — toutes les décisions techniques
3. [`docs/ROADMAP.md`](docs/ROADMAP.md) — ce qui est fait, ce qu'il reste à faire

## Stack

Expo (React Native, universel iOS/Android/Web) + Supabase (Postgres, Auth,
Storage) + Cloudinary (upload d'images) + Campay (Mobile Money, à venir).

## Démarrer en local

```bash
npm install
cp .env.example .env   # renseigner tes propres clés Supabase (jamais commité)
npx expo start
```
