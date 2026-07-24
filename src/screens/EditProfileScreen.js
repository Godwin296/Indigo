// src/screens/EditProfileScreen.js
// Étape "Expertise" de l'entonnoir de profil (Module 1 §2B). Écrit dans
// `profiles` (Supabase) — voir docs/ARCHITECTURE.md (ADR-002, ADR-003).
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme/theme';
import { useResponsive } from '../hooks/useResponsive';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { uploadToCloudinary } from '../utils/cloudinary';
import InputField from '../components/InputField';
import ProfileImagePicker from '../components/ProfileImagePicker';
import Button from '../components/Button';
import { FIELD_LIMITS } from '../utils/validators';

const AVAILABILITY_OPTIONS = [
  { value: 'disponible', label: 'Disponible', color: COLORS.success },
  { value: 'occupe', label: 'Occupé', color: '#F5B53D' },
  { value: 'indisponible', label: 'Indisponible', color: COLORS.error },
];

export default function EditProfileScreen({ navigation }) {
  const { user, profile, refreshProfile } = useAuth();
  const { contentMaxWidth } = useResponsive();

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    pseudo: '',
    avatarUrl: '',
    coverUrl: '',
    bio: '',
    neighborhood: '',
    mainSkill: '',
    experienceYears: '',
    availability: 'disponible',
    languages: '',
    diplomas: [],
  });
  const [newDiploma, setNewDiploma] = useState({ name: '', institution: '', year: '' });

  // Nouveaux fichiers image locaux (pas encore uploadés)
  const [newAvatarUri, setNewAvatarUri] = useState(null);
  const [newCoverUri, setNewCoverUri] = useState(null);

  useEffect(() => {
    if (!profile) return;
    setForm({
      pseudo: profile.pseudo || '',
      avatarUrl: profile.avatar_url || '',
      coverUrl: profile.cover_url || '',
      bio: profile.bio || '',
      neighborhood: profile.neighborhood || '',
      mainSkill: profile.main_skill || '',
      experienceYears: profile.experience_years ? String(profile.experience_years) : '',
      availability: profile.availability || 'disponible',
      languages: Array.isArray(profile.languages) ? profile.languages.join(', ') : '',
      diplomas: Array.isArray(profile.diplomas) ? profile.diplomas : [],
    });
  }, [profile]);

  const pickCover = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissions', 'Nous avons besoin d’accéder à vos photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.6, // compression — voir Module 7 "Data Saver"
    });
    if (!result.canceled && result.assets?.length) {
      setNewCoverUri(result.assets[0].uri);
    }
  }, []);

  const addDiploma = () => {
    if (!newDiploma.name.trim()) {
      Alert.alert('Diplôme', 'Le nom du diplôme est requis.');
      return;
    }
    setForm((f) => ({
      ...f,
      diplomas: [
        ...f.diplomas,
        { ...newDiploma, status: 'declared_unverified' }, // voir Module 1 §2B
      ],
    }));
    setNewDiploma({ name: '', institution: '', year: '' });
  };

  const removeDiploma = (index) => {
    setForm((f) => ({ ...f, diplomas: f.diplomas.filter((_, i) => i !== index) }));
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      // Upload des nouvelles images seulement si elles ont changé (économise
      // de la data — cohérent avec le Module 7)
      const [avatarUrl, coverUrl] = await Promise.all([
        newAvatarUri ? uploadToCloudinary(newAvatarUri) : form.avatarUrl,
        newCoverUri ? uploadToCloudinary(newCoverUri) : form.coverUrl,
      ]);

      const languagesArray = form.languages
        .split(',')
        .map((l) => l.trim())
        .filter(Boolean);

      const profileCompleted = Boolean(form.bio && form.mainSkill && form.neighborhood);

      const { error } = await supabase
        .from('profiles')
        .update({
          pseudo: form.pseudo,
          avatar_url: avatarUrl || null,
          cover_url: coverUrl || null,
          bio: form.bio,
          neighborhood: form.neighborhood,
          main_skill: form.mainSkill,
          experience_years: form.experienceYears ? parseInt(form.experienceYears, 10) : null,
          availability: form.availability,
          languages: languagesArray,
          diplomas: form.diplomas,
          profile_completed: profileCompleted,
          onboarding_step: profileCompleted ? 'complete' : 'expertise',
          last_active: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      refreshProfile();
      Alert.alert('Profil mis à jour', 'Tes informations ont bien été enregistrées.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erreur', error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scrollContent, { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }]}
      >
        {/* --- Couverture --- */}
        <TouchableOpacity onPress={pickCover} activeOpacity={0.85} style={styles.coverWrapper}>
          {newCoverUri || form.coverUrl ? (
            <Image source={{ uri: newCoverUri || form.coverUrl }} style={styles.coverImage} />
          ) : (
            <View style={styles.coverPlaceholder} />
          )}
          <View style={styles.coverBadge}>
            <Ionicons name="camera" size={16} color={COLORS.white} />
            <Text style={styles.coverBadgeText}>Modifier la couverture</Text>
          </View>
        </TouchableOpacity>

        <ProfileImagePicker
          image={newAvatarUri || form.avatarUrl}
          onImagePicked={setNewAvatarUri}
          label="Photo de profil"
        />

        <Text style={styles.sectionTitle}>Identité</Text>
        <InputField
          placeholder="Pseudo (public)"
          value={form.pseudo}
          onChangeText={(t) => setForm({ ...form, pseudo: t })}
          maxLength={FIELD_LIMITS.PSEUDO}
        />
        <InputField
          placeholder="Bio"
          value={form.bio}
          onChangeText={(t) => setForm({ ...form, bio: t })}
          maxLength={FIELD_LIMITS.BIO}
          multiline
        />
        <InputField
          placeholder="Quartier (ex: Fongo)"
          value={form.neighborhood}
          onChangeText={(t) => setForm({ ...form, neighborhood: t })}
          maxLength={FIELD_LIMITS.NEIGHBORHOOD}
        />

        <Text style={styles.sectionTitle}>Expertise</Text>
        <InputField
          placeholder="Compétence principale (ex: Menuiserie)"
          value={form.mainSkill}
          onChangeText={(t) => setForm({ ...form, mainSkill: t })}
          maxLength={FIELD_LIMITS.SKILL}
        />
        <InputField
          placeholder="Années d'expérience"
          value={form.experienceYears}
          onChangeText={(t) => setForm({ ...form, experienceYears: t.replace(/[^0-9]/g, '') })}
          keyboardType="number-pad"
          maxLength={2}
        />
        <InputField
          placeholder="Langues (séparées par des virgules)"
          value={form.languages}
          onChangeText={(t) => setForm({ ...form, languages: t })}
          maxLength={80}
        />

        <Text style={styles.label}>Disponibilité</Text>
        <View style={styles.availabilityRow}>
          {AVAILABILITY_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setForm({ ...form, availability: opt.value })}
              style={[
                styles.availabilityChip,
                form.availability === opt.value && {
                  backgroundColor: opt.color,
                  borderColor: opt.color,
                },
              ]}
            >
              <Text
                style={[
                  styles.availabilityChipText,
                  form.availability === opt.value && styles.availabilityChipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Diplômes</Text>
        <Text style={styles.hint}>
          Déclaratifs — statut "à vérifier" jusqu'à validation par un employeur ou l'admin.
        </Text>
        {form.diplomas.map((d, i) => (
          <View key={i} style={styles.diplomaRow}>
            <View style={styles.flex}>
              <Text style={styles.diplomaName}>{d.name}</Text>
              <Text style={styles.diplomaMeta}>
                {[d.institution, d.year].filter(Boolean).join(' • ') || 'Non précisé'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => removeDiploma(i)}>
              <Ionicons name="close-circle" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        ))}
        <InputField
          placeholder="Nom du diplôme"
          value={newDiploma.name}
          onChangeText={(t) => setNewDiploma({ ...newDiploma, name: t })}
          maxLength={60}
        />
        <InputField
          placeholder="Établissement"
          value={newDiploma.institution}
          onChangeText={(t) => setNewDiploma({ ...newDiploma, institution: t })}
          maxLength={60}
        />
        <InputField
          placeholder="Année"
          value={newDiploma.year}
          onChangeText={(t) => setNewDiploma({ ...newDiploma, year: t.replace(/[^0-9]/g, '') })}
          keyboardType="number-pad"
          maxLength={4}
        />
        <Button title="Ajouter le diplôme" type="secondary" onPress={addDiploma} />

        <Button title="Enregistrer" onPress={handleSave} loading={saving} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: SPACING.l, paddingBottom: SPACING.l * 2 },
  coverWrapper: {
    height: 140,
    borderRadius: BORDER_RADIUS.medium,
    overflow: 'hidden',
    marginBottom: SPACING.s,
  },
  coverImage: { width: '100%', height: '100%' },
  coverPlaceholder: { width: '100%', height: '100%', backgroundColor: COLORS.cardBackground },
  coverBadge: {
    position: 'absolute',
    bottom: SPACING.s,
    right: SPACING.s,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: SPACING.s,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.small,
    gap: 6,
  },
  coverBadgeText: { color: COLORS.white, fontSize: 12, fontWeight: '600' },
  sectionTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
    marginTop: SPACING.l,
    marginBottom: SPACING.s,
  },
  label: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '700', marginBottom: SPACING.s },
  hint: { color: COLORS.textSecondary, fontSize: 12, marginBottom: SPACING.s },
  availabilityRow: { flexDirection: 'row', gap: SPACING.s, marginBottom: SPACING.m },
  availabilityChip: {
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    borderRadius: BORDER_RADIUS.large,
    borderWidth: 1,
    borderColor: COLORS.cardBackground,
    backgroundColor: COLORS.cardBackground,
  },
  availabilityChipText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
  availabilityChipTextActive: { color: COLORS.white },
  diplomaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.small,
    padding: SPACING.s,
    marginBottom: SPACING.s,
  },
  diplomaName: { color: COLORS.white, fontWeight: '700' },
  diplomaMeta: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
});
