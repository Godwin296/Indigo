import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

const { width } = Dimensions.get('window');

export default function FeedPostCard({ user, location, time, title, description, avatar, images, verified, rating, reviews, hashtags }) {
  return (
    <View style={styles.card}>
      {/* Header avec Badge Nouveau */}
      <View style={styles.header}>
        <Image source={{ uri: avatar }} style={styles.avatar} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={styles.nameRow}>
            <Text style={styles.userName}>{user}</Text>
            {verified && <MaterialCommunityIcons name="check-decagram" size={16} color={COLORS.primary} style={{marginLeft: 4}} />}
          </View>
          <Text style={styles.location}>{location} • {time}</Text>
        </View>
        <View style={styles.newBadge}><Text style={styles.newBadgeText}>Nouveau</Text></View>
        <TouchableOpacity><Ionicons name="ellipsis-vertical" size={20} color="white" /></TouchableOpacity>
      </View>

      {/* Contenu Texte */}
      <Text style={styles.postTitle}>{title}</Text>
      <Text style={styles.description} numberOfLines={3}>{description}</Text>
      <Text style={styles.hashtags}>{hashtags}</Text>

      {/* GRILLE D'IMAGES (Logique Maquette) */}
      <View style={styles.imageGrid}>
        <Image source={{ uri: images[0] }} style={styles.mainImage} />
        <View style={styles.sideImages}>
          <Image source={{ uri: images[1] }} style={styles.smallImage} />
          <View style={styles.moreImagesContainer}>
             <Image source={{ uri: images[2] }} style={styles.smallImage} />
             <View style={styles.overlay}>
                <Text style={styles.moreText}>+3</Text>
             </View>
          </View>
        </View>
      </View>

      {/* Footer Info (Localisation & Note) */}
      <View style={styles.infoRow}>
        <View style={styles.locationDetail}>
          <Ionicons name="location" size={14} color={COLORS.primary} />
          <Text style={styles.infoText}>Dschang, Quartier Fongo</Text>
        </View>
        <View style={styles.ratingBox}>
          <Ionicons name="star" size={14} color={COLORS.gold} />
          <Text style={styles.infoText}>{rating} ({reviews})</Text>
        </View>
      </View>

      {/* Actions (Like, Comment, Share) */}
      <View style={styles.actions}>
        <View style={styles.actionGroup}>
           <Ionicons name="heart" size={22} color={COLORS.danger} />
           <Text style={styles.actionCount}>56</Text>
           <Ionicons name="chatbubble-outline" size={20} color="white" style={{marginLeft: 15}} />
           <Text style={styles.actionCount}>12</Text>
           <Ionicons name="share-social-outline" size={20} color="white" style={{marginLeft: 15}} />
           <Text style={styles.actionCount}>7</Text>
        </View>
        <Ionicons name="bookmark-outline" size={22} color="white" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.card, marginHorizontal: 16, borderRadius: 28, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 24, borderWeight: 1, borderColor: COLORS.primary },
  userName: { color: 'white', fontWeight: 'bold', fontSize: 17 },
  location: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  newBadge: { backgroundColor: COLORS.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginRight: 10 },
  newBadgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  postTitle: { color: 'white', fontWeight: '800', fontSize: 19, marginBottom: 8 },
  description: { color: COLORS.textSoft, fontSize: 14, lineHeight: 20 },
  hashtags: { color: COLORS.primary, fontSize: 13, marginVertical: 10, fontWeight: '600' },
  imageGrid: { flexDirection: 'row', height: 220, gap: 8, marginTop: 5 },
  mainImage: { flex: 2, height: '100%', borderRadius: 20 },
  sideImages: { flex: 1, gap: 8 },
  smallImage: { width: '100%', flex: 1, borderRadius: 15 },
  moreImagesContainer: { flex: 1, position: 'relative' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  moreText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  locationDetail: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoText: { color: COLORS.textSoft, fontSize: 12 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  actionGroup: { flexDirection: 'row', alignItems: 'center' },
  actionCount: { color: 'white', fontSize: 12, marginLeft: 5 }
});
