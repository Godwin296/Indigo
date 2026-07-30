// src/services/blockService.js
// Module 4 §4 : protection anti-harcèlement. Le blocage est aussi appliqué
// en base (voir migration 0005, trigger check_message_not_blocked) — ce
// service n'est pas la seule ligne de défense.
import { supabase } from '../lib/supabase';

export const blockService = {
  blockUser: async (userId, targetUserId) => {
    const { data: current, error: fetchError } = await supabase
      .from('profiles_private')
      .select('blocked_users')
      .eq('id', userId)
      .single();
    if (fetchError) throw fetchError;

    const blocked = new Set(current.blocked_users || []);
    blocked.add(targetUserId);

    const { error } = await supabase
      .from('profiles_private')
      .update({ blocked_users: Array.from(blocked) })
      .eq('id', userId);
    if (error) throw error;
  },

  unblockUser: async (userId, targetUserId) => {
    const { data: current, error: fetchError } = await supabase
      .from('profiles_private')
      .select('blocked_users')
      .eq('id', userId)
      .single();
    if (fetchError) throw fetchError;

    const blocked = (current.blocked_users || []).filter((id) => id !== targetUserId);

    const { error } = await supabase
      .from('profiles_private')
      .update({ blocked_users: blocked })
      .eq('id', userId);
    if (error) throw error;
  },

  isBlocked: async (userId, targetUserId) => {
    const { data, error } = await supabase
      .from('profiles_private')
      .select('blocked_users')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return (data.blocked_users || []).includes(targetUserId);
  },
};
