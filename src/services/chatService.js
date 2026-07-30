// src/services/chatService.js
// Module 4 : Messagerie évolutive. Voir docs/ARCHITECTURE.md et
// supabase/migrations/0005_module4_messagerie.sql.
import { supabase } from '../lib/supabase';

const orderedPair = (userA, userB) => (userA < userB ? [userA, userB] : [userB, userA]);

export const chatService = {
  /**
   * Récupère une conversation existante ou en crée une nouvelle entre deux
   * utilisateurs (optionnellement liée à une publication — Module 4 §1,
   * niveau 2 "Professionnel"). `type` par défaut 'social'.
   */
  getOrCreateConversation: async (userIdA, userIdB, { relatedPostId = null, type = 'social' } = {}) => {
    const [participant_a, participant_b] = orderedPair(userIdA, userIdB);

    const { data: existing, error: fetchError } = await supabase
      .from('conversations')
      .select('*')
      .eq('participant_a', participant_a)
      .eq('participant_b', participant_b)
      .eq('related_post_id', relatedPostId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (existing) return existing;

    const { data, error } = await supabase
      .from('conversations')
      .insert({ participant_a, participant_b, related_post_id: relatedPostId, type })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /** Liste des conversations de l'utilisateur, triées par activité récente. */
  fetchConversations: async (userId) => {
    const { data, error } = await supabase
      .from('conversations')
      .select(
        `*, a:profiles!conversations_participant_a_fkey (id, pseudo, avatar_url, main_skill),
             b:profiles!conversations_participant_b_fkey (id, pseudo, avatar_url, main_skill)`
      )
      .or(`participant_a.eq.${userId},participant_b.eq.${userId}`)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (error) throw error;

    // Normalise pour exposer directement "l'autre" participant, quel que
    // soit son emplacement (a ou b) dans la ligne.
    return data.map((c) => ({
      ...c,
      otherParticipant: c.a.id === userId ? c.b : c.a,
    }));
  },

  fetchConversation: async (conversationId) => {
    const { data, error } = await supabase.from('conversations').select('*').eq('id', conversationId).single();
    if (error) throw error;
    return data;
  },

  fetchMessages: async (conversationId) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  sendMessage: async (conversationId, senderId, content) => {
    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: senderId, content })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /** Abonnement temps réel aux nouveaux messages d'une conversation. */
  subscribeToMessages: (conversationId, onNewMessage) => {
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => onNewMessage(payload.new)
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  },

  /** Identité à afficher pour l'autre participant — bascule automatiquement
   * sur le nom/photo réels en Mode Contrat, via la RPC dédiée (ADR-003). */
  getParticipantIdentity: async (conversationId, targetUserId) => {
    const { data, error } = await supabase.rpc('get_participant_identity', {
      p_conversation_id: conversationId,
      p_target_user_id: targetUserId,
    });
    if (error) throw error;
    return data;
  },

  // --- Cycle de vie du Mode Contrat (Module 4 §1, niveau 3) ---
  proposeContractMode: async (conversationId) => {
    const { error } = await supabase.rpc('propose_contract_mode', { p_conversation_id: conversationId });
    if (error) throw error;
  },

  confirmContractMode: async (conversationId) => {
    const { error } = await supabase.rpc('confirm_contract_mode', { p_conversation_id: conversationId });
    if (error) throw error;
  },

  completeContract: async (conversationId) => {
    const { error } = await supabase.rpc('complete_contract', { p_conversation_id: conversationId });
    if (error) throw error;
  },
};
