// src/screens/FeedScreen.js
// Module 2 : flux de publications réel (Supabase), remplace les données
// codées en dur de la version précédente. Voir docs/ARCHITECTURE.md.
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { useResponsive } from '../hooks/useResponsive';
import { postService } from '../services/PostService';
import { formatTimeAgo } from '../utils/formatTimeAgo';

import StoryItem from '../components/StoryItem';
import ComposerCards from '../components/ComposerCards';
import FeedPostCard from '../components/FeedPostCard';

export default function FeedScreen({ navigation }) {
  const { user, profile } = useAuth();
  const { contentMaxWidth } = useResponsive();

  const [posts, setPosts] = useState([]);
  const [likedPostIds, setLikedPostIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadFeed = useCallback(async () => {
    try {
      setError(null);
      const [feedData, likedIds] = await Promise.all([
        postService.fetchFeed({ page: 0 }),
        user?.id ? postService.fetchLikedPostIds(user.id) : Promise.resolve([]),
      ]);
      setPosts(feedData);
      setLikedPostIds(likedIds);
    } catch (e) {
      console.error('Erreur chargement feed:', e.message);
      setError("Impossible de charger le fil pour l'instant.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadFeed();
  };

  const handleReport = async (postId, reason) => {
    if (!user?.id) return;
    try {
      await postService.reportPost(postId, user.id, reason);
    } catch (e) {
      console.error(e.message);
    }
  };

  const handleLikeToggle = async (postId, wasLiked) => {
    if (!user?.id) return;
    try {
      await postService.toggleLike(postId, user.id, wasLiked);
    } catch (e) {
      console.error('Erreur like:', e.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#050530', '#07073D', '#040426']}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="menu" size={30} color="white" />
        </TouchableOpacity>

        <View style={styles.logoContainer}>
          <Text style={styles.logo}>indigo</Text>
          <Text style={styles.logoSub}>TOUCO</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => navigation.navigate('Recherche')}>
            <Ionicons name="search-outline" size={26} color="white" />
          </TouchableOpacity>
          <View style={styles.notificationWrapper}>
            <Ionicons name="notifications-outline" size={26} color="white" />
          </View>
          <Ionicons name="chatbubble-ellipses-outline" size={25} color="white" />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />
        }
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.storyContainer}
        >
          <StoryItem image="https://i.pravatar.cc/300" title="Votre story" add />
          <StoryItem icon="compass-outline" active title="Découverte" />
          <StoryItem icon="color-filter-outline" title="Talents" />
          <StoryItem icon="briefcase-outline" title="Services" />
          <StoryItem icon="bag-handle-outline" title="Offres" />
          <StoryItem icon="business-outline" title="Entreprises" />
        </ScrollView>

        <ComposerCards onPress={() => navigation.navigate('Publier')} avatarUrl={profile?.avatar_url} />

        {loading && (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
        )}

        {!loading && error && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{error}</Text>
          </View>
        )}

        {!loading && !error && posts.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="images-outline" size={40} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>
              Aucune publication pour l'instant. Sois le premier à publier !
            </Text>
          </View>
        )}

        {posts.map((post) => (
          <FeedPostCard
            key={post.id}
            postId={post.id}
            userId={user?.id}
            user={post.author?.pseudo || 'Utilisateur'}
            location={`${post.author?.main_skill || post.category || ''} • ${post.city}`}
            time={formatTimeAgo(post.created_at)}
            verified={post.author?.verified_badge}
            rating={post.author?.rating_average ? post.author.rating_average.toFixed(1) : null}
            reviews={post.author?.rating_count ? `${post.author.rating_count} avis` : null}
            title={post.title}
            description={post.description}
            price={post.price}
            avatar={post.author?.avatar_url}
            images={(post.media || []).map((m) => m.url)}
            isNew={Date.now() - new Date(post.created_at).getTime() < 24 * 60 * 60 * 1000}
            likeCount={post.like_count || 0}
            commentCount={post.comment_count || 0}
            isLiked={likedPostIds.includes(post.id)}
            onReport={(reason) => handleReport(post.id, reason)}
            onLikeToggle={(wasLiked) => handleLikeToggle(post.id, wasLiked)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 12,
  },
  logoContainer: { alignItems: 'center' },
  logo: { color: 'white', fontSize: 34, fontWeight: '800', letterSpacing: -1.2 },
  logoSub: { color: '#E4B04E', fontSize: 11, textAlign: 'center', letterSpacing: 5, marginTop: -2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  notificationWrapper: { position: 'relative' },
  scrollContent: { paddingBottom: 100 },
  storyContainer: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 14, gap: 18 },
  emptyState: { alignItems: 'center', padding: 40, gap: 10 },
  emptyText: { color: COLORS.textMuted, textAlign: 'center', fontSize: 14 },
});
