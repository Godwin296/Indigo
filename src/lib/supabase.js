// src/lib/supabase.js
// Client Supabase unique pour toute l'app. Voir docs/ARCHITECTURE.md (ADR-002).
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Les clés viennent des variables d'environnement Expo (EXPO_PUBLIC_*).
// Voir .env.example à la racine du projet : il faut créer un vrai .env avec
// les clés du projet Supabase (URL + clé "anon", jamais la clé "service_role").
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  Constants.expoConfig?.extra?.supabaseUrl;
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  Constants.expoConfig?.extra?.supabaseAnonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] Variables EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY manquantes. ' +
      'Copie .env.example vers .env et renseigne les clés de ton projet Supabase.'
  );
}

export const supabaseAnonKeyPublic = supabaseAnonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // false sur mobile ; géré différemment sur web (Phase 3 PWA)
  },
});
