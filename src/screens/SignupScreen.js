// src/screens/SignupScreen.js
// Étape "Vitale" de l'entonnoir de profil (Module 1 §2A — inscription en
// moins d'une minute). L'étape "Expertise" (avatar, photo réelle, nom réel,
// compétence détaillée...) est volontairement repoussée à EditProfileScreen,
// pas ici — sinon on recrée la friction qu'on cherche justement à éviter
// (voir ADR-006, pivot croissance). Même thème visuel que LoginScreen.
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, TouchableOpacity, Image, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { authService } from '../services/AuthService';
import { FIELD_LIMITS } from '../utils/validators';
import InputField from '../components/InputField';

const PARTICULIER_LEVELS = [
  { value: 'ETUDIANT', label: 'Étudiant' },
  { value: 'TRAVAILLEUR', label: 'Travailleur' },
];
const ENTREPRISE_LEVELS = [
  { value: 'FREELANCE', label: 'Freelance' },
  { value: 'PME', label: 'PME' },
  { value: 'GRANDE ENTREPRISE', label: 'Grande entreprise' },
];

const SOCIAL_PROVIDERS = [
  { key: 'google', icon: 'google', color: '#DB4437' },
  { key: 'github', icon: 'github', color: '#FFFFFF' },
  { key: 'linkedin', icon: 'linkedin', color: '#0A66C2' },
];

export default function SignupScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    pseudo: '',
    email: '',
    password: '',
    phone: '',
    accountType: 'PARTICULIER',
    level: 'ETUDIANT',
  });

  const levels = form.accountType === 'PARTICULIER' ? PARTICULIER_LEVELS : ENTREPRISE_LEVELS;

  const handleRegister = async () => {
    if (!form.pseudo || !form.email || !form.password) {
      return Alert.alert('Champs requis', 'Pseudo, email et mot de passe sont nécessaires pour démarrer.');
    }
    setLoading(true);
    try {
      // realName/mainSkill/neighborhood/avatar/realPhoto sont volontairement
      // vides ici — à compléter depuis "Modifier le profil" après inscription
      // (étape Expertise de l'entonnoir, Module 1 §2B).
      await authService.register(form.email, form.password, {
        ...form,
        realName: '',
        mainSkill: '',
        neighborhood: '',
        avatar: null,
        realPhoto: null,
      });
    } catch (error) {
      Alert.alert('Échec de l’inscription', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialPress = async (providerKey) => {
    setLoading(true);
    try {
      if (providerKey === 'google') await authService.loginWithGoogle();
      else if (providerKey === 'github') await authService.loginWithGithub();
      else if (providerKey === 'linkedin') await authService.loginWithLinkedIn();
    } catch (error) {
      Alert.alert('Connexion', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#050530', '#02021A']} style={styles.background}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={styles.innerContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <View style={styles.logoWrapper}>
                <Image source={require('../assets/logo_indigo.png')} style={styles.logo} resizeMode="contain" />
              </View>
              <Text style={styles.brandTitle}>Indigo</Text>
              <Text style={styles.welcomeText}>Crée ton compte en moins d'une minute</Text>
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.labelSection}>Je suis</Text>
              <View style={styles.typeRow}>
                <TouchableOpacity
                  style={[styles.typeBtn, form.accountType === 'PARTICULIER' && styles.typeBtnActive]}
                  onPress={() => setForm({ ...form, accountType: 'PARTICULIER', level: 'ETUDIANT' })}
                >
                  <Ionicons name="person" size={16} color={form.accountType === 'PARTICULIER' ? COLORS.text : COLORS.textMuted} />
                  <Text style={[styles.typeBtnText, form.accountType === 'PARTICULIER' && styles.typeBtnTextActive]}>Particulier</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeBtn, form.accountType === 'ENTREPRISE' && styles.typeBtnActive]}
                  onPress={() => setForm({ ...form, accountType: 'ENTREPRISE', level: 'FREELANCE' })}
                >
                  <Ionicons name="business" size={16} color={form.accountType === 'ENTREPRISE' ? COLORS.text : COLORS.textMuted} />
                  <Text style={[styles.typeBtnText, form.accountType === 'ENTREPRISE' && styles.typeBtnTextActive]}>Entreprise</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.chipRow}>
                {levels.map((l) => (
                  <TouchableOpacity
                    key={l.value}
                    style={[styles.chip, form.level === l.value && styles.chipActive]}
                    onPress={() => setForm({ ...form, level: l.value })}
                  >
                    <Text style={[styles.chipText, form.level === l.value && styles.chipTextActive]}>{l.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Pseudo</Text>
                <InputField placeholder="Ton nom public" value={form.pseudo} onChangeText={(t) => setForm({ ...form, pseudo: t })} maxLength={FIELD_LIMITS.PSEUDO} />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Email</Text>
                <InputField placeholder="ton@email.com" value={form.email} onChangeText={(t) => setForm({ ...form, email: t })} keyboardType="email-address" autoCapitalize="none" />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Mot de passe</Text>
                <InputField placeholder="6 caractères minimum" value={form.password} onChangeText={(t) => setForm({ ...form, password: t })} secureTextEntry />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Téléphone</Text>
                <InputField placeholder="+237 6xx xxx xxx" value={form.phone} onChangeText={(t) => setForm({ ...form, phone: t })} keyboardType="phone-pad" maxLength={FIELD_LIMITS.PHONE} />
              </View>

              <TouchableOpacity style={styles.registerButton} onPress={handleRegister} disabled={loading}>
                <LinearGradient colors={['#F2C94C', '#D4AF37']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.buttonGradient}>
                  <Text style={styles.buttonText}>{loading ? 'Création...' : 'Créer mon compte'}</Text>
                  <Ionicons name="chevron-forward" size={20} color="#000" />
                </LinearGradient>
              </TouchableOpacity>
              <Text style={styles.hint}>
                Photo, nom réel et compétences se complètent ensuite, depuis ton profil.
              </Text>
            </View>

            <View style={styles.separatorRow}>
              <View style={styles.line} />
              <Text style={styles.separatorText}>ou continuer avec</Text>
              <View style={styles.line} />
            </View>

            <View style={styles.socialRow}>
              {SOCIAL_PROVIDERS.map((p) => (
                <TouchableOpacity key={p.key} style={styles.socialIconBox} onPress={() => handleSocialPress(p.key)}>
                  <MaterialCommunityIcons name={p.icon} size={22} color={p.color} />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginLink}>
              <Text style={styles.footerText}>
                Déjà un compte ? <Text style={styles.footerTextBold}>Se connecter</Text>
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1 },
  innerContent: { flexGrow: 1, paddingHorizontal: 30, paddingTop: 20, paddingBottom: 16 },
  header: { alignItems: 'center', marginBottom: 16 },
  logoWrapper: { width: 44, height: 44, marginBottom: 4 },
  logo: { width: '100%', height: '100%' },
  brandTitle: { color: COLORS.text, fontSize: 26, fontWeight: 'bold' },
  welcomeText: { color: COLORS.textMuted, fontSize: 13, marginTop: 2, textAlign: 'center' },
  formContainer: { width: '100%' },
  labelSection: { color: COLORS.textMuted, fontSize: 11, fontWeight: '700', marginBottom: 8, letterSpacing: 1 },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  typeBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeBtnText: { fontWeight: '700', color: COLORS.textMuted, fontSize: 13 },
  typeBtnTextActive: { color: COLORS.text },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  chipActive: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  chipText: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  chipTextActive: { color: '#050530', fontWeight: '800' },
  inputWrapper: { marginBottom: 10 },
  label: { color: COLORS.text, fontSize: 13, fontWeight: '600', marginBottom: 5 },
  registerButton: { height: 50, borderRadius: 25, overflow: 'hidden', marginTop: 8 },
  buttonGradient: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#000', fontSize: 16, fontWeight: 'bold', marginRight: 10 },
  hint: { color: COLORS.textMuted, fontSize: 11, textAlign: 'center', marginTop: 8 },
  separatorRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  line: { flex: 1, height: 1, backgroundColor: COLORS.border },
  separatorText: { color: COLORS.textMuted, marginHorizontal: 12, fontSize: 11 },
  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 14 },
  socialIconBox: { width: 56, height: 48, backgroundColor: COLORS.card, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  loginLink: { marginTop: 18, alignItems: 'center' },
  footerText: { color: COLORS.textMuted, fontSize: 13 },
  footerTextBold: { color: COLORS.gold, fontWeight: 'bold' },
});
