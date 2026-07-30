// src/services/ratingService.js
// Module 2 §2 : notation basée sur la preuve d'interaction. La base refuse
// elle-même toute notation hors d'un contrat marqué 'completed' (voir
// trigger check_rating_allowed, migration 0005) — ce service ne fait que
// relayer, la vraie garantie est côté base.
import { supabase } from '../lib/supabase';

export const ratingService = {
  rateContract: async (conversationId, raterId, ratedId, { seriousness, quality, timeliness, comment }) => {
    const { data, error } = await supabase
      .from('ratings')
      .insert({
        conversation_id: conversationId,
        rater_id: raterId,
        rated_id: ratedId,
        seriousness,
        quality,
        timeliness,
        comment,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Tu as déjà noté cette collaboration.');
      }
      throw error;
    }
    return data;
  },

  hasRated: async (conversationId, raterId) => {
    const { data, error } = await supabase
      .from('ratings')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('rater_id', raterId)
      .maybeSingle();
    if (error) throw error;
    return !!data;
  },
};
