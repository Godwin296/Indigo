// src/services/disputeService.js
// Module 7 §3 : "bouton de secours". Le gel du compte du prestataire visé et
// le passage de la conversation en statut 'disputed' sont gérés par un
// trigger côté base (voir migration 0006) — ce service ne fait que relayer.
import { supabase } from '../lib/supabase';
import { uploadToCloudinary } from '../utils/cloudinary';

export const disputeService = {
  fileDispute: async (conversationId, reportedBy, reportedUserId, reason) => {
    const { data, error } = await supabase
      .from('disputes')
      .insert({ conversation_id: conversationId, reported_by: reportedBy, reported_user_id: reportedUserId, reason })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /** Le prestataire visé fournit une preuve de travail pour appuyer sa
   * défense — ça ne lève PAS automatiquement la suspension, l'arbitrage
   * reste admin (Module 7 §3, Chantier D). */
  submitProof: async (disputeId, proofUri) => {
    const proofUrl = await uploadToCloudinary(proofUri);
    if (!proofUrl) throw new Error("L'envoi de la preuve a échoué, réessaie.");

    const { error } = await supabase.from('disputes').update({ proof_url: proofUrl }).eq('id', disputeId);
    if (error) throw error;
    return proofUrl;
  },

  fetchDisputeForConversation: async (conversationId) => {
    const { data, error } = await supabase
      .from('disputes')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
};
