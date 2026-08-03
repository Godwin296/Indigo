import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, KeyboardAvoidingView, Platform, 
  TouchableOpacity, Image, ScrollView, Alert 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../theme/theme';
import { authService } from '../services/AuthService';
import InputField from '../components/InputField';

// Providers OAuth prévus. GitHub et LinkedIn sont branchés dès maintenant
// (code réel, pas décoratif) mais échoueront proprement tant que Godwin n'a
// pas activé ces providers côté Supabase — voir ADR-007.
const SOCIAL_PROVIDERS = [
  { key: 'google', icon: 'google', color: '#DB4437', label: 'Google' },
  { key: 'github', icon: 'github', color: '#FFFFFF', label: 'GitHub' },
  { key: 'linkedin', icon: 'linkedin', color: '#0A66C2', label: 'LinkedIn' },
];

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Champs requis', 'Veuillez remplir tous les champs.');
    setLoading(true);
    try {
      await authService.login(email, password);
    } catch (error) {
      Alert.alert('Erreur de connexion', error.message);
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
      // La navigation suit automatiquement : AuthContext détecte la nouvelle
      // session via onAuthStateChange (voir src/context/AuthContext.js).
    } catch (error) {
      Alert.alert('Connexion', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#050530', '#02021A']} style={styles.background}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.innerContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header & Logo — compact pour tenir sur un petit écran */}
            <View style={styles.header}>
              <View style={styles.logoWrapper}>
                 <Image 
                  source={require('../assets/logo_indigo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.brandTitle}>Indigo</Text>
              <Text style={styles.brandSubtitle}>T O U C O</Text>
              <Text style={styles.welcomeText}>Connectez-vous pour continuer</Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Email</Text>
                <InputField
                  placeholder="ton@email.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Mot de passe</Text>
                <InputField 
                  placeholder="Entrez votre mot de passe"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  icon="lock-closed-outline"
                />
              </View>

              <TouchableOpacity style={styles.forgotPass}>
                <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.loginButton} 
                onPress={handleLogin} 
                disabled={loading}
              >
                <LinearGradient 
                  colors={['#F2C94C', '#D4AF37']} 
                  start={{x: 0, y: 0}} end={{x: 1, y: 0}}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>{loading ? "Connexion..." : "Se connecter"}</Text>
                  <Ionicons name="chevron-forward" size={20} color="#000" />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.separatorRow}>
              <View style={styles.line} />
              <Text style={styles.separatorText}>ou continuer avec</Text>
              <View style={styles.line} />
            </View>

            <View style={styles.socialRow}>
              {SOCIAL_PROVIDERS.map((p) => (
                <SocialBtn key={p.key} icon={p.icon} color={p.color} onPress={() => handleSocialPress(p.key)} />
              ))}
            </View>

            <TouchableOpacity 
              onPress={() => navigation.navigate('Signup')} 
              style={styles.signupLink}
            >
              <Text style={styles.footerText}>
                Pas encore de compte ? <Text style={styles.footerTextBold}>Créer un compte</Text>
              </Text>
            </TouchableOpacity>

          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

const SocialBtn = ({ icon, color, onPress }) => (
  <TouchableOpacity style={styles.socialIconBox} onPress={onPress}>
    <MaterialCommunityIcons name={icon} size={22} color={color} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1 },
  innerContent: { flexGrow: 1, paddingHorizontal: 30, paddingTop: 30, paddingBottom: 16, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 22 },
  logoWrapper: { width: 60, height: 60, marginBottom: 6 },
  logo: { width: '100%', height: '100%' },
  brandTitle: { color: '#FFF', fontSize: 28, fontWeight: 'bold' },
  brandSubtitle: { color: '#E4B04E', fontSize: 11, letterSpacing: 4, marginTop: -4, marginBottom: 8 },
  welcomeText: { color: '#AAA', fontSize: 13 },
  formContainer: { width: '100%' },
  inputWrapper: { marginBottom: 12 },
  label: { color: '#FFF', fontSize: 13, fontWeight: '600', marginBottom: 6 },
  forgotPass: { alignSelf: 'flex-end', marginTop: 4 },
  forgotText: { color: '#E4B04E', fontSize: 12 },
  loginButton: { height: 50, borderRadius: 25, overflow: 'hidden', marginTop: 14 },
  buttonGradient: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#000', fontSize: 16, fontWeight: 'bold', marginRight: 10 },
  separatorRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  line: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  separatorText: { color: '#666', marginHorizontal: 12, fontSize: 11 },
  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 14 },
  socialIconBox: { 
    width: 56, height: 48, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, 
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' 
  },
  signupLink: { marginTop: 18, alignItems: 'center' },
  footerText: { color: '#AAA', fontSize: 13 },
  footerTextBold: { color: '#E4B04E', fontWeight: 'bold' }
});
