import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, KeyboardAvoidingView, Platform, 
  TouchableOpacity, Image, ScrollView 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../theme/theme';
import { authService } from '../services/AuthService';
import InputField from '../components/InputField';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return alert("Veuillez remplir tous les champs.");
    setLoading(true);
    try {
      await authService.login(email, password);
    } catch (error) {
      alert("Erreur de connexion : " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGooglePress = () => {
    // La connexion Google nécessite de configurer le provider OAuth côté
    // Supabase (Google Cloud Console : Client ID/Secret) — pas encore fait.
    // On informe plutôt que d'avoir un bouton silencieusement inactif.
    alert(
      'Connexion Google bientôt disponible — la configuration côté Supabase reste à faire. Utilise ton email pour l’instant.'
    );
  };

  return (
    <View style={styles.container}>
      {/* Fond dégradé sombre identique à la maquette */}
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
            
            {/* 1. Header & Logo */}
            <View style={styles.header}>
              <View style={styles.logoWrapper}>
                 <Image 
                  source={require('../assets/logo_indigo.png')} // Assure-toi d'avoir le logo IN
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.brandTitle}>Indigo</Text>
              <Text style={styles.brandSubtitle}>T O U C O</Text>
              <Text style={styles.welcomeText}>Connectez-vous pour continuer</Text>
            </View>

            {/* 2. Formulaire */}
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

              {/* Bouton de Connexion Doré */}
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

            {/* 3. Séparateur Social */}
            <View style={styles.separatorRow}>
              <View style={styles.line} />
              <Text style={styles.separatorText}>ou continuer avec</Text>
              <View style={styles.line} />
            </View>

            <View style={styles.socialRow}>
              <SocialBtn icon="google" color="#DB4437" onPress={handleGooglePress} />
            </View>

            {/* 4. Pied de page sécurisé */}
            <View style={styles.secureBanner}>
               <Ionicons name="shield-checkmark-outline" size={24} color="#5C5CFF" />
               <View style={styles.secureTextContent}>
                  <Text style={styles.secureTitle}>Connexion sécurisée</Text>
                  <Text style={styles.secureSub}>Vos données sont protégées et chiffrées.</Text>
               </View>
               <Ionicons name="lock-closed" size={16} color="#444" />
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

// Petit composant interne pour les boutons sociaux
const SocialBtn = ({ icon, color, onPress }) => (
  <TouchableOpacity style={styles.socialIconBox} onPress={onPress}>
    <MaterialCommunityIcons name={icon} size={24} color={color} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1 },
  innerContent: { flexGrow: 1, paddingHorizontal: 30, paddingVertical: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 24 },
  logoWrapper: { width: 60, height: 60, marginBottom: 6 },
  logo: { width: '100%', height: '100%' },
  brandTitle: { color: '#FFF', fontSize: 36, fontWeight: 'bold' },
  brandSubtitle: { color: '#E4B04E', fontSize: 12, letterSpacing: 4, marginTop: -6, marginBottom: 12 },
  welcomeText: { color: '#AAA', fontSize: 14 },
  formContainer: { width: '100%' },
  inputWrapper: { marginBottom: 15 },
  label: { color: '#FFF', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  forgotPass: { alignSelf: 'flex-end', marginTop: 5 },
  forgotText: { color: '#E4B04E', fontSize: 13 },
  loginButton: { height: 56, borderRadius: 28, overflow: 'hidden', marginTop: 18 },
  buttonGradient: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#000', fontSize: 18, fontWeight: 'bold', marginRight: 10 },
  separatorRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  line: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  separatorText: { color: '#666', marginHorizontal: 15, fontSize: 12 },
  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 20 },
  socialIconBox: { 
    width: 65, height: 55, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, 
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' 
  },
  secureBanner: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', 
    padding: 15, borderRadius: 15, marginTop: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' 
  },
  secureTextContent: { flex: 1, marginLeft: 15 },
  secureTitle: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  secureSub: { color: '#666', fontSize: 11 },
  signupLink: { marginTop: 20, marginBottom: 10, alignItems: 'center' },
  footerText: { color: '#AAA', fontSize: 14 },
  footerTextBold: { color: '#E4B04E', fontWeight: 'bold' }
});