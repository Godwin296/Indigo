import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/theme';

export default function PostCard({ post }) {
  return (
    <View style={styles.card}>
      {/* HEADER DU POST */}
      <View style={styles.header}>
        <Image source={{ uri: post.authorAvatar }} style={styles.avatar} />
        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.username}>{post.authorName}</Text>
            {post.isVerified && <Ionicons name="checkmark-circle" size={14} color="#4DA6FF" />}
          </View>
          <Text style={styles.subInfo}>{post.category} • {post.location}</Text>
        </View>
        <Text style={styles.time}>2h</Text>
        <TouchableOpacity><Ionicons name="ellipsis-vertical" size={20} color={COLORS.white} /></TouchableOpacity>
      </View>

      {/* TEXTE DU POST */}
      <View style={styles.contentSection}>
        <Text style={styles.postTitle}>{post.title} 📦</Text>
        <Text style={styles.postDescription} numberOfLines={2}>{post.content}</Text>
        <Text style={styles.hashtags}>#Menuiserie #SurMesure</Text>
      </View>

      {/* GRILLE D'IMAGES (Style Instagram/Pinterest) */}
      <View style={styles.imageGrid}>
        <Image source={{ uri: post.imageUrl }} style={styles.mainImage} />
        <View style={styles.sideImages}>
          <Image source={{ uri: post.secondaryImage1 }} style={styles.smallImage} />
          <View style={styles.moreImageContainer}>
            <Image source={{ uri: post.secondaryImage2 }} style={[styles.smallImage, { opacity: 0.5 }]} />
            <Text style={styles.moreText}>+3</Text>
          </View>
        </View>
      </View>

      {/* FOOTER : ACTIONS & STATS */}
      <View style={styles.footer}>
        <View style={styles.locationTag}>
          <Ionicons name="location" size={12} color="#7B61FF" />
          <Text style={styles.locationText}>Dschang, Quartier Fongo</Text>
        </View>
        <View style={styles.ratingBox}>
          <Ionicons name="star" size={14} color="#FFD700" />
          <Text style={styles.ratingText}>4.8 (32 avis)</Text>
        </View>
      </View>

      <View style={styles.interactions}>
        <View style={styles.leftInteractions}>
          <TouchableOpacity style={styles.iconAction}><Ionicons name="heart" size={22} color="#FF4D4D" /><Text style={styles.actionCount}>56</Text></TouchableOpacity>
          <TouchableOpacity style={styles.iconAction}><Ionicons name="chatbubble-outline" size={22} color={COLORS.white} /><Text style={styles.actionCount}>12</Text></TouchableOpacity>
          <TouchableOpacity style={styles.iconAction}><Ionicons name="share-social-outline" size={22} color={COLORS.white} /><Text style={styles.actionCount}>7</Text></TouchableOpacity>
        </View>
        <TouchableOpacity><Ionicons name="bookmark-outline" size={22} color={COLORS.white} /></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#1A1D3D', borderRadius: 30, padding: 15, marginBottom: 20, marginHorizontal: 10 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 45, height: 45, borderRadius: 22.5, marginRight: 12, borderWeight: 1, borderColor: '#7B61FF' },
  headerInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  username: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  subInfo: { color: '#AAA', fontSize: 11 },
  time: { color: '#666', fontSize: 11, marginRight: 10 },
  contentSection: { marginBottom: 15 },
  postTitle: { color: COLORS.white, fontWeight: 'bold', fontSize: 16, marginBottom: 5 },
  postDescription: { color: '#CCC', fontSize: 13, lineHeight: 18 },
  hashtags: { color: '#7B61FF', fontSize: 12, marginTop: 5, fontWeight: '600' },
  imageGrid: { flexDirection: 'row', height: 200, borderRadius: 20, overflow: 'hidden', gap: 8 },
  mainImage: { flex: 2, height: '100%' },
  sideImages: { flex: 1, gap: 8 },
  smallImage: { flex: 1, width: '100%' },
  moreImageContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  moreText: { position: 'absolute', color: COLORS.white, fontWeight: 'bold', fontSize: 18 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, borderBottomWidth: 0.5, borderBottomColor: '#333', paddingBottom: 12 },
  locationTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { color: '#AAA', fontSize: 11 },
  ratingBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { color: '#AAA', fontSize: 11 },
  interactions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, alignItems: 'center' },
  leftInteractions: { flexDirection: 'row', gap: 20 },
  iconAction: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionCount: { color: COLORS.white, fontSize: 12 }
});