// src/services/searchService.js
// Module 3 : Moteur de recherche & navigation. Voir docs/ARCHITECTURE.md.
// Recherche "basique" (Phase 1) : pas de scoring avancé, pas de géo-radius
// réel — filtre ville en texte, tri par note décroissante par défaut.
import { supabase } from '../lib/supabase';

const RESULTS_PAGE_SIZE = 20;

export const searchService = {
  /**
   * Recherche des profils. `accountType` filtre Talents ('particulier') vs
   * Entreprises ('entreprise'). `query` cherche dans le pseudo et la
   * compétence principale. `minRating` applique le filtre qualité optionnel
   * (Module 3 §2). Tri par défaut : note décroissante, puis nombre d'avis.
   */
  searchProfiles: async ({ query = '', accountType, city, minRating, page = 0 } = {}) => {
    const from = page * RESULTS_PAGE_SIZE;
    const to = from + RESULTS_PAGE_SIZE - 1;

    let request = supabase
      .from('profiles')
      .select(
        'id, pseudo, avatar_url, account_type, main_skill, city, neighborhood, ' +
          'experience_years, availability, rating_average, rating_count, ' +
          'contracts_completed, verified_badge'
      )
      .order('rating_average', { ascending: false })
      .order('rating_count', { ascending: false })
      .range(from, to);

    if (accountType) {
      request = request.eq('account_type', accountType);
    }
    if (city) {
      request = request.ilike('city', `%${city}%`);
    }
    if (minRating) {
      request = request.gte('rating_average', minRating);
    }
    if (query?.trim()) {
      // Recherche sur le pseudo OU la compétence principale.
      request = request.or(`pseudo.ilike.%${query}%,main_skill.ilike.%${query}%`);
    }

    const { data, error } = await request;
    if (error) throw error;
    return data;
  },

  /**
   * Recherche des publications (Services/Offres/Publications). `postType`
   * filtre un type précis (Module 2), ou laisse tout passer si omis.
   */
  searchPosts: async ({ query = '', postType, city, page = 0 } = {}) => {
    const from = page * RESULTS_PAGE_SIZE;
    const to = from + RESULTS_PAGE_SIZE - 1;

    let request = supabase
      .from('posts')
      .select(
        `*, author:profiles!posts_user_id_fkey (pseudo, avatar_url, verified_badge, rating_average, rating_count)`
      )
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (postType) request = request.eq('post_type', postType);
    if (city) request = request.ilike('city', `%${city}%`);
    if (query?.trim()) {
      request = request.or(`title.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`);
    }

    const { data, error } = await request;
    if (error) throw error;
    return data;
  },
};
