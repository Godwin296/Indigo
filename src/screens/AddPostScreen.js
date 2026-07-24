// src/screens/AddPostScreen.js
// Module 2 : création de publication. Voir docs/ARCHITECTURE.md et la
// maquette "Créer une publication" (image 6 fournie par Godwin).
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import { useResponsive } from '../hooks/useResponsive';
import { postService } from '../services/PostService';
import { validatePostContent, FIELD_LIMITS } from '../utils/validators';
import InputField from '../components/InputField';
import Button from '../components/Button';

const POST_TYPES = [
  { value: 'service', label: 'Service', sub: 'Proposer un service', icon: 'construct-outline' },
  { value: 'offre_emploi', label: "Offre d'emploi", sub: 'Recruter', icon: 'briefcase-outline' },
  { value: 'recherche', label: 'Recherche', sub: 'Chercher un talent', icon: 'people-outline' },
  { value: 'realisation', label: 'Réalisation', sub: 'Montrer un travail', icon: 'image-outline' },
  { value: 'urgence', label: 'Urgence', sub: 'Besoin immédiat', icon: 'notifications-outline' },
];

const MAX_MEDIA = 5;

export default function AddPostScreen({ navigation }) {
  const { user, profile } = useAuth();
  const { contentMaxWidth } = useResponsive();

  const [postType, setPostType] = useState('service');
  const [media, setMedia] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(profile?.main_skill || '');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);

  const pickMedia = async () => {
    if (media.length >= MAX_MEDIA) {
      Alert.alert('Limite atteinte', `Maximum ${MAX_MEDIA} photos par publication.`);
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissions', 'Nous avons besoin d’accéder à vos photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.6, // compression — cohérent avec le Mode Data Saver (Module 7)
    });
    if (!result.canceled && result.assets?.length) {
      setMedia((m) => [...m, result.assets[0].uri]);
    }
  };

  const removeMedia = (index) => {
    setMedia((m) => m.filter((_, i) => i !== index));
  };

  const handlePublish = async () => {
    const titleCheck = validatePostContent(title);
    if (!titleCheck.valid) return Alert.alert('Titre', titleCheck.error);

    const descCheck = validatePostContent(description);
    if (!descCheck.valid) return Alert.alert('Description', descCheck.error);

    if (postType === 'realisation' && media.length === 0) {
      return Alert.alert('Preuve requise', 'Une réalisation nécessite au moins une photo.');
    }

    setLoading(true);
    try {
      await postService.createPost(
        user.id,
        profile,
        { postType, title, description, category, price },
        media
      );
      Alert.alert('Publié !', 'Ta publication est en ligne.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Erreur', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }]}
    >
      <Text style={styles.screenTitle}>Créer une publication</Text>
      <Text style={styles.screenSubtitle}>Partagez votre talent, service ou offre</Text>

      {/* Type de publication */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeRow}>
        {POST_TYPES.map((t) => (
          <TouchableOpacity
            key={t.value}
            onPress={() => setPostType(t.value)}
            style={[styles.typeCard, postType === t.value && styles.typeCardActive]}
          >
            <Ionicons name={t.icon} size={22} color={postType === t.value ? COLORS.white : COLORS.indigoPrimary} />
            <Text style={[styles.typeLabel, postType === t.value && styles.typeLabelActive]}>{t.label}</Text>
            <Text style={[styles.typeSub, postType === t.value && styles.typeSubActive]}>{t.sub}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Médias */}
      <Text style={styles.sectionTitle}>Médias ({media.length}/{MAX_MEDIA})</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaRow}>
        <TouchableOpacity onPress={pickMedia} style={styles.addMediaBtn}>
          <Ionicons name="add" size={28} color={COLORS.indigoPrimary} />
          <Text style={styles.addMediaText}>Ajouter</Text>
        </TouchableOpacity>
        {media.map((uri, i) => (
          <View key={i} style={styles.mediaThumbWrapper}>
            <Image source={{ uri }} style={styles.mediaThumb} />
            <TouchableOpacity style={styles.removeMediaBtn} onPress={() => removeMedia(i)}>
              <Ionicons name="close" size={14} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <Text style={styles.sectionTitle}>Informations principales</Text>
      <InputField
        placeholder="Titre de votre publication"
        value={title}
        onChangeText={setTitle}
        maxLength={80}
      />
      <InputField
        placeholder="Décrivez votre service, vos compétences..."
        value={description}
        onChangeText={setDescription}
        maxLength={500}
        multiline
      />
      <InputField
        placeholder="Catégorie (ex: Menuiserie)"
        value={category}
        onChangeText={setCategory}
        maxLength={FIELD_LIMITS.SKILL}
      />
      {(postType === 'service' || postType === 'offre_emploi') && (
        <InputField
          placeholder="Prix (FCFA) — optionnel"
          value={price}
          onChangeText={(t) => setPrice(t.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
        />
      )}

      {postType === 'urgence' && (
        <View style={styles.urgentNotice}>
          <Feather name="zap" size={16} color={COLORS.error} />
          <Text style={styles.urgentText}>
            Les publications urgentes sont mises en avant dans "Découverte Locale".
          </Text>
        </View>
      )}

      <Button
        title={loading ? 'PUBLICATION...' : 'Publier maintenant'}
        onPress={handlePublish}
        disabled={loading}
        loading={loading}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.l, paddingBottom: SPACING.l * 2 },
  screenTitle: { color: COLORS.white, fontSize: 22, fontWeight: '800', marginTop: SPACING.m },
  screenSubtitle: { color: COLORS.textSecondary, fontSize: 13, marginBottom: SPACING.m },
  typeRow: { marginBottom: SPACING.l },
  typeCard: {
    width: 110,
    padding: SPACING.s,
    borderRadius: BORDER_RADIUS.medium,
    backgroundColor: COLORS.cardBackground,
    marginRight: SPACING.s,
    alignItems: 'flex-start',
    gap: 4,
  },
  typeCardActive: { backgroundColor: COLORS.indigoPrimary },
  typeLabel: { color: COLORS.white, fontWeight: '700', fontSize: 13, marginTop: 6 },
  typeLabelActive: { color: COLORS.white },
  typeSub: { color: COLORS.textSecondary, fontSize: 10 },
  typeSubActive: { color: 'rgba(255,255,255,0.8)' },
  sectionTitle: { color: COLORS.white, fontSize: 15, fontWeight: '800', marginBottom: SPACING.s, marginTop: SPACING.s },
  mediaRow: { marginBottom: SPACING.l },
  addMediaBtn: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.medium,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.indigoPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.s,
  },
  addMediaText: { color: COLORS.indigoPrimary, fontSize: 10, marginTop: 2 },
  mediaThumbWrapper: { marginRight: SPACING.s },
  mediaThumb: { width: 80, height: 80, borderRadius: BORDER_RADIUS.medium },
  removeMediaBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  urgentNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,77,77,0.1)',
    padding: SPACING.s,
    borderRadius: BORDER_RADIUS.small,
    marginBottom: SPACING.m,
  },
  urgentText: { color: COLORS.error, fontSize: 12, flex: 1 },
});
