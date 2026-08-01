import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, Share } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import CommentsModal from './CommentsModal';

const REPORT_REASONS = [
  { label: 'Futilité', value: 'futilite' },
  { label: 'Arnaque', value: 'arnaque' },
  { label: 'Langage inapproprié', value: 'langage' },
  { label: 'Violence', value: 'violence' },
  { label: 'Spam', value: 'spam' },
];

function ImageGrid({ images }) {
  if (!images || images.length === 0) return null;

  if (images.length === 1) {
    return <Image source={{ uri: images[0] }} style={styles.singleImage} />;
  }

  if (images.length === 2) {
    return (
      <View style={styles.imageGrid}>
        <Image source={{ uri: images[0] }} style={styles.halfImage} />
        <Image source={{ uri: images[1] }} style={styles.halfImage} />
      </View>
    );
  }

  const remaining = images.length - 3;
  return (
    <View style={styles.imageGrid}>
      <Image source={{ uri: images[0] }} style={styles.mainImage} />
      <View style={styles.sideImages}>
        <Image source={{ uri: images[1] }} style={styles.smallImage} />
        <View style={styles.moreImagesContainer}>
          <Image source={{ uri: images[2] }} style={styles.smallImage} />
          {remaining > 0 && (
            <View style={styles.overlay}>
              <Text style={styles.moreText}>+{remaining}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

export default function FeedPostCard({
  postId,
  userId,
  user,
  location,
  time,
  title,
  description,
  avatar,
  images,
  verified,
  rating,
  reviews,
  hashtags,
  price,
  isNew,
  isPromo,
  likeCount = 0,
  commentCount = 0,
  isLiked = false,
  onReport,
  onLikeToggle,
}) {
  const [liked, setLiked] = useState(isLiked);
  const [likes, setLikes] = useState(likeCount);
  const [comments, setComments] = useState(commentCount);
  const [commentsVisible, setCommentsVisible] = useState(false);

  const handleMenuPress = () => {
    Alert.alert('Signaler cette publication', 'Pourquoi la signales-tu ?', [
      ...REPORT_REASONS.map((r) => ({ text: r.label, onPress: () => onReport?.(r.value) })),
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  const handleLike = () => {
    // Optimiste : on met à jour l'affichage tout de suite, avant la réponse
    // serveur — cohérent avec le mode "Data Saver" (pas d'attente perçue).
    setLiked((prev) => !prev);
    setLikes((prev) => prev + (liked ? -1 : 1));
    onLikeToggle?.(liked);
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: `${title} — sur Indigo\n${description}` });
    } catch (e) {
      console.error('Erreur partage:', e.message);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Image source={{ uri: avatar }} style={styles.avatar} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={styles.nameRow}>
            <Text style={styles.userName}>{user}</Text>
            {verified && <MaterialCommunityIcons name="check-decagram" size={16} color={COLORS.primary} style={{ marginLeft: 4 }} />}
          </View>
          <Text style={styles.location}>{location} • {time}</Text>
        </View>
        {isPromo && <View style={styles.promoBadge}><Ionicons name="megaphone" size={11} color="#050530" /><Text style={styles.promoBadgeText}>PROMO</Text></View>}
        {isNew && <View style={styles.newBadge}><Text style={styles.newBadgeText}>Nouveau</Text></View>}
        <TouchableOpacity onPress={handleMenuPress}>
          <Ionicons name="ellipsis-vertical" size={20} color="white" />
        </TouchableOpacity>
      </View>

      <Text style={styles.postTitle}>{title}</Text>
      <Text style={styles.description} numberOfLines={3}>{description}</Text>
      {!!price && <Text style={styles.price}>À partir de {price} FCFA</Text>}
      {!!hashtags && <Text style={styles.hashtags}>{hashtags}</Text>}

      <ImageGrid images={images} />

      <View style={styles.infoRow}>
        <View style={styles.locationDetail}>
          <Ionicons name="location" size={14} color={COLORS.primary} />
          <Text style={styles.infoText}>{location}</Text>
        </View>
        {!!rating && (
          <View style={styles.ratingBox}>
            <Ionicons name="star" size={14} color={COLORS.gold} />
            <Text style={styles.infoText}>{rating} ({reviews})</Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <View style={styles.actionGroup}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={22} color={COLORS.danger} />
            <Text style={styles.actionCount}>{likes}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setCommentsVisible(true)}>
            <Ionicons name="chatbubble-outline" size={20} color="white" />
            <Text style={styles.actionCount}>{comments}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={20} color="white" />
          </TouchableOpacity>
        </View>
        <Ionicons name="bookmark-outline" size={22} color="white" />
      </View>

      <CommentsModal
        visible={commentsVisible}
        postId={postId}
        userId={userId}
        onClose={() => setCommentsVisible(false)}
        onCommentAdded={() => setComments((c) => c + 1)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.card, marginHorizontal: 16, borderRadius: 28, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  userName: { color: 'white', fontWeight: 'bold', fontSize: 17 },
  location: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  newBadge: { backgroundColor: COLORS.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginRight: 10 },
  newBadgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  promoBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E4B04E', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginRight: 10 },
  promoBadgeText: { color: '#050530', fontSize: 10, fontWeight: 'bold' },
  postTitle: { color: 'white', fontWeight: '800', fontSize: 19, marginBottom: 8 },
  description: { color: COLORS.textSoft, fontSize: 14, lineHeight: 20 },
  price: { color: COLORS.gold, fontWeight: '700', fontSize: 14, marginTop: 8 },
  hashtags: { color: COLORS.primary, fontSize: 13, marginVertical: 10, fontWeight: '600' },
  imageGrid: { flexDirection: 'row', height: 220, gap: 8, marginTop: 10 },
  singleImage: { width: '100%', height: 220, borderRadius: 20, marginTop: 10 },
  halfImage: { flex: 1, height: '100%', borderRadius: 20 },
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
  actionGroup: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionCount: { color: 'white', fontSize: 12 },
});
