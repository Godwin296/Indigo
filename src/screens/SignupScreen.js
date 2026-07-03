import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { COLORS, SPACING } from '../theme/theme';
import InputField from '../components/InputField';
import Button from '../components/Button';
import ProfileImagePicker from '../components/ProfileImagePicker';
import { authService } from '../services/AuthService';
import { FIELD_LIMITS } from '../utils/validators';
import { Ionicons } from '@expo/vector-icons'; // Indispensable pour les icônes de type

const PARTICULIER_LEVELS = ['ETUDIANT', 'TRAVAILLEUR'];
const ENTREPRISE_TYPES = ['FREELANCE', 'PME', 'GRANDE ENTREPRISE'];

export default function SignupScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    email: '', password: '', pseudo: '', phone: '',
    realName: '', mainSkill: '', neighborhood: '', 
    accountType: 'PARTICULIER', 
    level: 'ETUDIANT', // Valeur par défaut
    avatar: null, realPhoto: null
  });

  // Fonction pour afficher les petites puces de sélection (Chips)
  const renderSubOptions = (options, current, field) => (
    <View style={styles.chipContainer}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt}
          style={[styles.chip, current === opt && styles.chipActive]}
          onPress={() => setForm({ ...form, [field]: opt })}
        >
          <Text style={[styles.chipText, current === opt && styles.chipTextActive]}>
            {opt}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const handleFinalRegister = async () => {
    if (!form.avatar || !form.realPhoto) {
      return Alert.alert("Sécurité", "Veuillez choisir votre Avatar et votre Photo 4x4.");
    }
    if (!form.realName || !form.mainSkill) {
      return Alert.alert("Erreur", "Remplissez votre identité réelle certifiée.");
    }
    setLoading(true);
    try {
      await authService.register(form.email, form.password, form);
    } catch (error) {
      Alert.alert("Échec", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        
        <View style={styles.header}>
          <View style={styles.circleLarge} />
          <Text style={styles.brandName}>INDIGO</Text>
          <Text style={styles.stepIndicator}>Étape {step} sur 2</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.title}>{step === 1 ? "Identité Sociale 🚀" : "Identité Réelle 🛠️"}</Text>
          
          {step === 1 ? (
            <View>
              {/* SÉLECTEUR DE TYPE DE COMPTE VISUEL */}
              <Text style={styles.labelSection}>Je suis un :</Text>
              <View style={styles.mainTypeContainer}>
                <TouchableOpacity 
                  style={[styles.typeBtn, form.accountType === 'PARTICULIER' && styles.typeBtnActive]}
                  onPress={() => setForm({...form, accountType: 'PARTICULIER', level: 'ETUDIANT'})}
                >
                  <Ionicons name="person" size={18} color={form.accountType === 'PARTICULIER' ? COLORS.white : COLORS.indigoPrimary} />
                  <Text style={[styles.typeBtnText, form.accountType === 'PARTICULIER' && styles.typeBtnTextActive]}>Particulier</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.typeBtn, form.accountType === 'ENTREPRISE' && styles.typeBtnActive]}
                  onPress={() => setForm({...form, accountType: 'ENTREPRISE', level: 'FREELANCE'})}
                >
                  <Ionicons name="business" size={18} color={form.accountType === 'ENTREPRISE' ? COLORS.white : COLORS.indigoPrimary} />
                  <Text style={[styles.typeBtnText, form.accountType === 'ENTREPRISE' && styles.typeBtnTextActive]}>Entreprise</Text>
                </TouchableOpacity>
              </View>

              {/* OPTIONS DYNAMIQUES */}
              <Text style={styles.labelSection}>Précision :</Text>
              {form.accountType === 'PARTICULIER' 
                ? renderSubOptions(PARTICULIER_LEVELS, form.level, 'level')
                : renderSubOptions(ENTREPRISE_TYPES, form.level, 'level')
              }

              <InputField placeholder="Pseudo (Public)" value={form.pseudo} onChangeText={(t) => setForm({...form, pseudo: t})} maxLength={FIELD_LIMITS.PSEUDO} />
              <InputField placeholder="Email" value={form.email} onChangeText={(t) => setForm({...form, email: t})} keyboardType="email-address" autoCapitalize="none" />
              <InputField placeholder="Mot de passe" value={form.password} onChangeText={(t) => setForm({...form, password: t})} secureTextEntry />
              <InputField placeholder="Téléphone (+237...)" value={form.phone} onChangeText={(t) => setForm({...form, phone: t})} keyboardType="phone-pad" maxLength={FIELD_LIMITS.PHONE} />
              
              <Button title="CONTINUER" onPress={() => setStep(2)} />
              <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.backLink}>
                <Text style={styles.backLinkText}>
                  Déjà un compte ? <Text style={styles.boldText}>Se connecter</Text>
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <View style={styles.photoRow}>
                <ProfileImagePicker label="AVATAR PUBLIC" image={form.avatar} onImagePicked={(uri) => setForm({...form, avatar: uri})} />
                <ProfileImagePicker label="PHOTO 4X4 RÉELLE" image={form.realPhoto} isSquare={true} onImagePicked={(uri) => setForm({...form, realPhoto: uri})} />
              </View>
              <InputField placeholder="Nom Réel (Certifié)" value={form.realName} onChangeText={(t) => setForm({...form, realName: t})} maxLength={FIELD_LIMITS.REAL_NAME} />
              <InputField placeholder="Compétence (ex: Menuisier)" value={form.mainSkill} onChangeText={(t) => setForm({...form, mainSkill: t})} maxLength={FIELD_LIMITS.SKILL} />
              <InputField placeholder="Quartier (Dschang)" value={form.neighborhood} onChangeText={(t) => setForm({...form, neighborhood: t})} maxLength={FIELD_LIMITS.NEIGHBORHOOD} />
              <Button title={loading ? "CRÉATION EN COURS..." : "CRÉER MON COMPTE"} onPress={handleFinalRegister} loading={loading} />
              <TouchableOpacity onPress={() => setStep(1)} style={styles.backBtn}><Text style={styles.backText}>Retour</Text></TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.indigoDark },
  scrollContent: { flexGrow: 1 },
  header: { height: 200, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.indigoDark, overflow: 'hidden' },
  circleLarge: { position: 'absolute', top: -50, right: -30, width: 180, height: 180, borderRadius: 90, backgroundColor: COLORS.indigoPrimary, opacity: 0.2 },
  brandName: { color: COLORS.white, fontSize: 36, fontWeight: '900', letterSpacing: 6 },
  stepIndicator: { color: COLORS.accentNeon, fontSize: 12, fontWeight: '700', marginTop: 8 },
  formCard: { flex: 1, backgroundColor: COLORS.background, borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: SPACING.l, paddingTop: 30, marginTop: -20 },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.indigoDark, marginBottom: 20, textAlign: 'center' },
  labelSection: { color: COLORS.indigoDark, fontSize: 12, fontWeight: '700', marginBottom: 10, marginTop: 5, letterSpacing: 1 },
  mainTypeContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  typeBtn: { flex: 0.48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.indigoPrimary, backgroundColor: COLORS.white },
  typeBtnActive: { backgroundColor: COLORS.indigoPrimary },
  typeBtnText: { marginLeft: 8, fontWeight: '700', color: COLORS.indigoPrimary, fontSize: 13 },
  typeBtnTextActive: { color: COLORS.white },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: COLORS.indigoLight, marginRight: 8, marginBottom: 8 },
  chipActive: { backgroundColor: COLORS.accentNeon },
  chipText: { fontSize: 11, fontWeight: '600', color: COLORS.indigoDark },
  chipTextActive: { fontWeight: '800' },
  photoRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  backBtn: { marginTop: 15, alignItems: 'center' },
  backText: { color: COLORS.textSecondary, textDecorationLine: 'underline' },
  backLink: { marginTop: 20, alignItems: 'center',paddingVertical: 10 },
  backLinkText: { color: COLORS.textSecondary, fontSize: 14 },
  boldText: { color: COLORS.indigoPrimary, fontWeight: '900', },
});
