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
import { supabase } from '../lib/supabase';
import { uploadToCloudinary } from '../utils/cloudinary';

// Normalise le "level" du formulaire d'inscription vers le schéma DB
// (particulier_level: 'etudiant' | 'travailleur' | null). Voir SignupScreen.js.
const toParticulierLevel = (accountType, level) => {
  if (accountType?.toUpperCase() !== 'PARTICULIER') return null;
  return level?.toUpperCase() === 'ETUDIANT' ? 'etudiant' : 'travailleur';
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
};
