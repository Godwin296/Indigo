import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, KeyboardAvoidingView, Platform, 
  TouchableOpacity, Image, Dimensions 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../theme/theme';
import { authService } from '../services/AuthService';
import InputField from '../components/InputField';

const { width } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
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

  return (
    <View style={styles.container}>
      {/* Fond dégradé sombre identique à la maquette */}
      <LinearGradient colors={['#050530', '#02021A']} style={styles.background}>
        
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={{ flex: 1 }}
        >
          <View style={styles.innerContent}>
            
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
                <Text style={styles.label}>Numéro de téléphone</Text>
                <View style={styles.phoneInputRow}>
                  <View style={styles.countryPicker}>
                    <Image source={{ uri: 'https://flagcdn.com/w40/cm.png' }} style={styles.flag} />
                    <Text style={styles.countryCode}>+237</Text>
                    <Ionicons name="chevron-down" size={14} color="#FFF" />
                  </View>
                  <InputField 
                    placeholder="6 75 12 34 56"
                    value={email} // Ou téléphone selon ta logique Firebase
                    onChangeText={setEmail}
                    keyboardType="phone-pad"
                    containerStyle={styles.flexInput}
                  />
                </View>
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

              {/* Checkbox "Se souvenir de moi" */}
              <TouchableOpacity 
                style={styles.rememberRow} 
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                  {rememberMe && <Ionicons name="checkmark" size={12} color="#FFF" />}
                </View>
                <Text style={styles.rememberText}>Se souvenir de moi</Text>
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
              <SocialBtn icon="google" color="#DB4437" />
              <SocialBtn icon="facebook" color="#4267B2" />
              <SocialBtn icon="apple" color="#FFF" />
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

          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

// Petit composant interne pour les boutons sociaux
const SocialBtn = ({ icon, color }) => (
  <TouchableOpacity style={styles.socialIconBox}>
    <MaterialCommunityIcons name={icon} size={24} color={color} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1 },
  innerContent: { flex: 1, paddingHorizontal: 30, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  logoWrapper: { width: 80, height: 80, marginBottom: 10 },
  logo: { width: '100%', height: '100%' },
  brandTitle: { color: '#FFF', fontSize: 48, fontWeight: 'bold' },
  brandSubtitle: { color: '#E4B04E', fontSize: 14, letterSpacing: 5, marginTop: -10, marginBottom: 20 },
  welcomeText: { color: '#AAA', fontSize: 16 },
  formContainer: { width: '100%' },
  inputWrapper: { marginBottom: 15 },
  label: { color: '#FFF', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  phoneInputRow: { flexDirection: 'row', alignItems: 'center' },
  countryPicker: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', 
    height: 55, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' 
  },
  flag: { width: 24, height: 16, marginRight: 8, borderRadius: 2 },
  countryCode: { color: '#FFF', marginRight: 5, fontSize: 14 },
  flexInput: { flex: 1, marginLeft: 10 },
  forgotPass: { alignSelf: 'flex-end', marginTop: 5 },
  forgotText: { color: '#E4B04E', fontSize: 13 },
  rememberRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20 },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1, borderColor: '#FFF', marginRight: 10, justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: '#3F37C9', borderColor: '#3F37C9' },
  rememberText: { color: '#AAA', fontSize: 13 },
  loginButton: { height: 60, borderRadius: 30, overflow: 'hidden', marginTop: 30 },
  buttonGradient: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#000', fontSize: 18, fontWeight: 'bold', marginRight: 10 },
  separatorRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 30 },
  line: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  separatorText: { color: '#666', marginHorizontal: 15, fontSize: 12 },
  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 20 },
  socialIconBox: { 
    width: 65, height: 55, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, 
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' 
  },
  secureBanner: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', 
    padding: 15, borderRadius: 15, marginTop: 40, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' 
  },
  secureTextContent: { flex: 1, marginLeft: 15 },
  secureTitle: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  secureSub: { color: '#666', fontSize: 11 },
  signupLink: { marginTop: 30, alignItems: 'center' },
  footerText: { color: '#AAA', fontSize: 14 },
  footerTextBold: { color: '#E4B04E', fontWeight: 'bold' }
});