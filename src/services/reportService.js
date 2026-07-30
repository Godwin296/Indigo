// src/services/reportService.js
// Signalement direct d'un utilisateur (Module 4 §4) — distinct de
// postService.reportPost qui signale un contenu, pas une personne.
import { supabase } from '../lib/supabase';

export const reportService = {
  reportUser: async (reporterId, targetUserId, reason, conversationId = null) => {
    const { error } = await supabase.from('user_reports').insert({
      reporter_id: reporterId,
      reported_user_id: targetUserId,
      reason,
      conversation_id: conversationId,
    });

    if (error) {
      if (error.code === '23505') {
        throw new Error('Tu as déjà signalé cette personne pour cette conversation.');
      }
      throw error;
    }
  },
};
