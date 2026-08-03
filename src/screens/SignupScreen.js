// src/screens/SignupScreen.js
// Étape "Vitale" de l'entonnoir de profil (Module 1 §2A — inscription en
// moins d'une minute), en plusieurs petites étapes plutôt qu'un mur de
// champs d'un coup. L'alternative sociale reste visible à chaque étape :
// si la personne choisit Google/GitHub/LinkedIn en cours de route, son
// profil est créé automatiquement et elle complète le reste depuis
// "Modifier le profil" — jamais sur cet écran. Étape "Expertise" (avatar,
// photo réelle, nom réel...) volontairement absente ici, cf ADR-006.
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
const TOTAL_STEPS = 3;

export default function SignupScreen({ navigation }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    accountType: 'PARTICULIER',
    level: 'ETUDIANT',
    pseudo: '',
    email: '',
    password: '',
    phone: '',
  });

  const levels = form.accountType === 'PARTICULIER' ? PARTICULIER_LEVELS : ENTREPRISE_LEVELS;
  const update = (patch) => setForm((f) => ({ ...f, ...patch }));

  const handleSocialPress = async (providerKey) => {
    setLoading(true);
    try {
      if (providerKey === 'google') await authService.loginWithGoogle();
      else if (providerKey === 'github') await authService.loginWithGithub();
      else if (providerKey === 'linkedin') await authService.loginWithLinkedIn();
      // Si ça aboutit, AuthContext prend le relais automatiquement (nouvelle
      // session détectée) — le profil, lui, se complètera plus tard depuis
      // "Modifier le profil", jamais ici.
    } catch (error) {
      Alert.alert('Connexion', error.message);
    } finally {
      setLoading(false);
    }
  };

  const goNext = () => {
    if (step === 1 && (!form.pseudo || !form.email || !form.password)) {
      return Alert.alert('Champs requis', 'Pseudo, email et mot de passe sont nécessaires.');
    }
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
  };

  const handleRegister = async () => {
    if (!form.phone) return Alert.alert('Téléphone requis', 'Un numéro est nécessaire pour finaliser.');
    setLoading(true);
    try {
      // realName/mainSkill/neighborhood/avatar/realPhoto restent vides ici —
      // à compléter depuis "Modifier le profil" (étape Expertise, Module 1 §2B).
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

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#050530', '#02021A']} style={styles.background}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={styles.innerContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header — logo bien présent, pas collé en haut */}
            <View style={styles.header}>
              <View style={styles.logoWrapper}>
                <Image source={require('../assets/logo_indigo.png')} style={styles.logo} resizeMode="contain" />
              </View>
              <Text style={styles.brandTitle}>Indigo</Text>
              <Text style={styles.welcomeText}>Crée ton compte en quelques secondes</Text>
            </View>

            {/* Indicateur d'étape */}
            <View style={styles.stepDots}>
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <View key={i} style={[styles.dot, i === step && styles.dotActive, i < step && styles.dotDone]} />
              ))}
            </View>

            <View style={styles.formContainer}>
              {step === 0 && (
                <>
                  <Text style={styles.stepTitle}>Tu es...</Text>
                  <View style={styles.typeRow}>
                    <TouchableOpacity
                      style={[styles.typeBtn, form.accountType === 'PARTICULIER' && styles.typeBtnActive]}
                      onPress={() => update({ accountType: 'PARTICULIER', level: 'ETUDIANT' })}
                    >
                      <Ionicons name="person" size={18} color={form.accountType === 'PARTICULIER' ? COLORS.text : COLORS.textMuted} />
                      <Text style={[styles.typeBtnText, form.accountType === 'PARTICULIER' && styles.typeBtnTextActive]}>Particulier</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.typeBtn, form.accountType === 'ENTREPRISE' && styles.typeBtnActive]}
                      onPress={() => update({ accountType: 'ENTREPRISE', level: 'FREELANCE' })}
                    >
                      <Ionicons name="business" size={18} color={form.accountType === 'ENTREPRISE' ? COLORS.text : COLORS.textMuted} />
                      <Text style={[styles.typeBtnText, form.accountType === 'ENTREPRISE' && styles.typeBtnTextActive]}>Entreprise</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.chipRow}>
                    {levels.map((l) => (
                      <TouchableOpacity
                        key={l.value}
                        style={[styles.chip, form.level === l.value && styles.chipActive]}
                        onPress={() => update({ level: l.value })}
                      >
                        <Text style={[styles.chipText, form.level === l.value && styles.chipTextActive]}>{l.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {step === 1 && (
                <>
                  <Text style={styles.stepTitle}>Ton identité</Text>
                  <View style={styles.inputWrapper}>
                    <InputField placeholder="Pseudo" value={form.pseudo} onChangeText={(t) => update({ pseudo: t })} maxLength={FIELD_LIMITS.PSEUDO} />
                  </View>
                  <View style={styles.inputWrapper}>
                    <InputField placeholder="ton@email.com" value={form.email} onChangeText={(t) => update({ email: t })} keyboardType="email-address" autoCapitalize="none" />
                  </View>
                  <View style={styles.inputWrapper}>
                    <InputField placeholder="Mot de passe (6 caractères min.)" value={form.password} onChangeText={(t) => update({ password: t })} secureTextEntry />
                  </View>
                </>
              )}

              {step === 2 && (
                <>
                  <Text style={styles.stepTitle}>Dernière étape</Text>
                  <View style={styles.inputWrapper}>
                    <InputField placeholder="+237 6xx xxx xxx" value={form.phone} onChangeText={(t) => update({ phone: t })} keyboardType="phone-pad" maxLength={FIELD_LIMITS.PHONE} />
                  </View>
                  <Text style={styles.hint}>
                    Photo, nom réel et compétences se complètent ensuite, depuis ton profil.
                  </Text>
                </>
              )}

              <View style={styles.navRow}>
                {step > 0 && (
                  <TouchableOpacity style={styles.backBtn} onPress={() => setStep(step - 1)}>
                    <Ionicons name="chevron-back" size={20} color={COLORS.text} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.nextButton}
                  onPress={step < TOTAL_STEPS - 1 ? goNext : handleRegister}
                  disabled={loading}
                >
                  <LinearGradient colors={['#F2C94C', '#D4AF37']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.buttonGradient}>
                    <Text style={styles.buttonText}>
                      {loading ? 'Un instant...' : step < TOTAL_STEPS - 1 ? 'Continuer' : 'Créer mon compte'}
                    </Text>
                    <Ionicons name="chevron-forward" size={20} color="#000" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            {/* Alternative sociale — toujours visible, à n'importe quelle étape */}
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
  innerContent: { flexGrow: 1, paddingHorizontal: 30, paddingTop: 36, paddingBottom: 16, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 20 },
  logoWrapper: { width: 68, height: 68, marginBottom: 8 },
  logo: { width: '100%', height: '100%' },
  brandTitle: { color: COLORS.text, fontSize: 30, fontWeight: 'bold' },
  welcomeText: { color: COLORS.textMuted, fontSize: 13, marginTop: 4, textAlign: 'center' },
  stepDots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.card },
  dotActive: { backgroundColor: COLORS.gold, width: 22 },
  dotDone: { backgroundColor: COLORS.primary },
  formContainer: { width: '100%', minHeight: 200 },
  stepTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800', marginBottom: 16, textAlign: 'center' },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: 14, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  typeBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeBtnText: { fontWeight: '700', color: COLORS.textMuted, fontSize: 14 },
  typeBtnTextActive: { color: COLORS.text },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  chipActive: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  chipText: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  chipTextActive: { color: '#050530', fontWeight: '800' },
  inputWrapper: { marginBottom: 12 },
  hint: { color: COLORS.textMuted, fontSize: 12, textAlign: 'center', marginTop: 6 },
  navRow: { flexDirection: 'row', gap: 10, marginTop: 16, alignItems: 'center' },
  backBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  nextButton: { flex: 1, height: 50, borderRadius: 25, overflow: 'hidden' },
  buttonGradient: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#000', fontSize: 15, fontWeight: 'bold', marginRight: 10 },
  separatorRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 18 },
  line: { flex: 1, height: 1, backgroundColor: COLORS.border },
  separatorText: { color: COLORS.textMuted, marginHorizontal: 12, fontSize: 11 },
  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 14 },
  socialIconBox: { width: 56, height: 48, backgroundColor: COLORS.card, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  loginLink: { marginTop: 18, alignItems: 'center' },
  footerText: { color: COLORS.textMuted, fontSize: 13 },
  footerTextBold: { color: COLORS.gold, fontWeight: 'bold' },
});
