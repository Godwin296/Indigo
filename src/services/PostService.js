// src/services/PostService.js
// Module 2 : Flux de publications & moteur de confiance. Voir
// docs/ARCHITECTURE.md et supabase/migrations/0003_module2_posts.sql.
import { supabase } from '../lib/supabase';
import { uploadToCloudinary } from '../utils/cloudinary';

const FEED_PAGE_SIZE = 10;

export const postService = {
  /**
   * Crée une publication. `mediaUris` est un tableau d'URIs locales (picker),
   * uploadées vers Cloudinary avant écriture en base.
   */
  createPost: async (userId, profile, postData, mediaUris = []) => {
    const uploadedMedia = (
      await Promise.all(
        mediaUris.map(async (uri) => {
          const url = await uploadToCloudinary(uri);
          return url ? { url, type: 'photo' } : null;
        })
      )
    ).filter(Boolean);

    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        post_type: postData.postType,
        title: postData.title,
        description: postData.description,
        category: postData.category || profile?.main_skill || null,
        price: postData.price ? parseFloat(postData.price) : null,
        city: profile?.city || 'Dschang',
        neighborhood: profile?.neighborhood || null,
        media: uploadedMedia,
        is_urgent: postData.postType === 'urgence',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /** Charge une page du flux + les IDs des posts déjà likés par l'utilisateur. */
  fetchFeed: async ({ page = 0 } = {}) => {
    const from = page * FEED_PAGE_SIZE;
    const to = from + FEED_PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from('posts')
      .select(
        `*, author:profiles!posts_user_id_fkey (
          pseudo, avatar_url, main_skill, city, neighborhood,
          rating_average, rating_count, verified_badge
        )`
      )
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return data;
  },

  /** IDs des publications déjà likées par l'utilisateur (pour l'état du cœur). */
  fetchLikedPostIds: async (userId) => {
    const { data, error } = await supabase.from('post_likes').select('post_id').eq('user_id', userId);
    if (error) throw error;
    return data.map((row) => row.post_id);
  },

  toggleLike: async (postId, userId, isCurrentlyLiked) => {
    if (isCurrentlyLiked) {
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('post_likes').insert({ post_id: postId, user_id: userId });
      if (error && error.code !== '23505') throw error; // 23505 = déjà liké, on ignore
    }
  },

  fetchComments: async (postId) => {
    const { data, error } = await supabase
      .from('post_comments')
      .select('*, author:profiles!post_comments_user_id_fkey (pseudo, avatar_url)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  },

  addComment: async (postId, userId, content) => {
    const { data, error } = await supabase
      .from('post_comments')
      .insert({ post_id: postId, user_id: userId, content })
      .select('*, author:profiles!post_comments_user_id_fkey (pseudo, avatar_url)')
      .single();
    if (error) throw error;
    return data;
  },

  /** Publications d'un utilisateur donné (son propre profil, réalisations...) */
  fetchUserPosts: async (userId) => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  /** Signalement communautaire (Module 2 §1). Un seul signalement par personne. */
  reportPost: async (postId, reporterId, reason) => {
    const { error } = await supabase
      .from('post_reports')
      .insert({ post_id: postId, reporter_id: reporterId, reason });

    if (error) {
      if (error.code === '23505') {
        throw new Error('Tu as déjà signalé cette publication.');
      }
      throw error;
    }
  },

  deletePost: async (postId) => {
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) throw error;
  },
};
