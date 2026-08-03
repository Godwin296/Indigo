// src/services/AuthService.js
//
// Source unique de vérité pour l'authentification (Supabase). Remplace l'ancien
// src/firebase/auth.js et l'ancienne version Firebase de ce fichier — voir
// docs/ARCHITECTURE.md (ADR-002, ADR-003).
//
// ⚠️ Prérequis côté dashboard Supabase pour que register() fonctionne tel quel :
// Authentication > Providers > Email > désactiver "Confirm email" en développement
// (sinon aucune session active n'existe encore au moment de l'insertion du
// profil, et la policy RLS "profiles_insert_own" refusera l'écriture). En
// production, on préférera confirmer l'email puis créer le profil après
// confirmation (Phase 1).
import { supabase, supabaseAnonKeyPublic } from '../lib/supabase';
import { uploadToCloudinary } from '../utils/cloudinary';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

// Normalise le "level" du formulaire d'inscription vers le schéma DB
// (particulier_level: 'etudiant' | 'travailleur' | null). Voir SignupScreen.js.
const toParticulierLevel = (accountType, level) => {
  if (accountType?.toUpperCase() !== 'PARTICULIER') return null;
  return level?.toUpperCase() === 'ETUDIANT' ? 'etudiant' : 'travailleur';
};

// Les tokens OAuth reviennent dans le fragment (#access_token=...) ou parfois
// en query (?code=...) selon le flux — on gère les deux avec URLSearchParams
// (polyfillé globalement via react-native-url-polyfill, voir src/lib/supabase.js).
const parseUrlParams = (url) => {
  const raw = url.includes('#') ? url.split('#')[1] : url.split('?')[1];
  if (!raw) return {};
  return Object.fromEntries(new URLSearchParams(raw));
};

// Crée un pseudo de départ à partir du nom Google, pour ne pas laisser le
// profil vide — modifiable ensuite depuis EditProfileScreen (étape Expertise
// de l'entonnoir, Module 1 §2).
const pseudoFromProviderName = (name, email) => {
  const base = (name || email?.split('@')[0] || 'Utilisateur').trim();
  return base.slice(0, 20);
};

export const authService = {
  /**
   * Inscription. Garde la même signature que la version précédente
   * (email, password, userData) pour ne pas casser SignupScreen.js.
   * userData attendu : { pseudo, phone, whatsapp, realName, accountType,
   *                       level, mainSkill, neighborhood, avatar, realPhoto }
   */
  register: async (email, password, userData) => {
    // 1. Création du compte (Supabase Auth)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (authError) throw authError;

    const user = authData.user;
    if (!user) {
      throw new Error(
        "Compte créé mais aucune session active (email de confirmation requis ?). " +
          'Voir le commentaire en tête de ce fichier.'
      );
    }

    // 2. Upload des images vers Cloudinary
    const [avatarUrl, realPhotoUrl] = await Promise.all([
      uploadToCloudinary(userData.avatar),
      uploadToCloudinary(userData.realPhoto),
    ]);

    // 3. Profil public (table `profiles`)
    const { error: profileError } = await supabase.from('profiles').insert({
      id: user.id,
      pseudo: userData.pseudo,
      avatar_url: avatarUrl || null,
      account_type: userData.accountType?.toLowerCase() || 'particulier',
      particulier_level: toParticulierLevel(userData.accountType, userData.level),
      neighborhood: userData.neighborhood || '',
      main_skill: userData.mainSkill || '',
    });
    if (profileError) throw profileError;

    // 4. Profil privé (ligne déjà créée par le trigger `on_profile_created` —
    //    voir supabase/migrations/0001_module1_identity.sql — on la complète)
    const { error: privateError } = await supabase
      .from('profiles_private')
      .update({
        phone: userData.phone || '',
        whatsapp: userData.whatsapp || '',
        real_name: userData.realName || '',
        real_photo_url: realPhotoUrl || null,
      })
      .eq('id', user.id);
    if (privateError) throw privateError;

    return user;
  },

  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
  },

  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Connexion OAuth générique (Google/GitHub/LinkedIn...). Ouvre le
   * navigateur système, récupère la session au retour, crée le profil
   * minimal si c'est la première connexion. `provider` doit être un
   * identifiant Supabase valide : 'google', 'github', 'linkedin_oidc'
   * (LinkedIn a migré vers OIDC — 'linkedin' seul seul ne fonctionne plus).
   *
   * ⚠️ Dans Expo Go (développement), le lien de retour utilise le proxy
   * exp://... propre à Expo Go — ça fonctionne, mais un build autonome
   * (EAS/dev client) sera plus fiable en production, voir docs/ARCHITECTURE.md.
   */
  loginWithProvider: async (provider) => {
    const redirectTo = Linking.createURL('auth/callback');

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) throw error;

    // Correctif connu du flux OAuth Expo/Supabase : l'URL d'autorisation
    // doit porter la clé publique en paramètre pour être ouverte directement
    // dans le navigateur système (sinon "No API key found in request").
    const authorizeUrl = data.url.includes('apikey=')
      ? data.url
      : `${data.url}${data.url.includes('?') ? '&' : '?'}apikey=${supabaseAnonKeyPublic}`;

    const result = await WebBrowser.openAuthSessionAsync(authorizeUrl, redirectTo);

    if (result.type === 'cancel' || result.type === 'dismiss') {
      throw new Error('Connexion annulée.');
    }
    if (result.type !== 'success' || !result.url) {
      throw new Error('La connexion a échoué, réessaie.');
    }

    const params = parseUrlParams(result.url);
    if (params.error_description) throw new Error(params.error_description);
    if (!params.access_token) throw new Error('Aucun token reçu.');

    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    if (sessionError) throw sessionError;

    const user = sessionData.user;

    // Première connexion via ce provider : pas encore de ligne `profiles`
    // (créée habituellement par register()) — on en crée une minimale ici.
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (!existingProfile) {
      const meta = user.user_metadata || {};
      const providerName = meta.full_name || meta.name || meta.user_name || meta.preferred_username;
      const providerAvatar = meta.avatar_url || meta.picture;

      const { error: profileError } = await supabase.from('profiles').insert({
        id: user.id,
        pseudo: pseudoFromProviderName(providerName, user.email),
        avatar_url: providerAvatar || null,
        account_type: 'particulier',
      });
      if (profileError) throw profileError;

      await supabase.from('profiles_private').update({ email: user.email }).eq('id', user.id);
    }

    return user;
  },

  loginWithGoogle: () => authService.loginWithProvider('google'),
  loginWithGithub: () => authService.loginWithProvider('github'),
  loginWithLinkedIn: () => authService.loginWithProvider('linkedin_oidc'),
};
