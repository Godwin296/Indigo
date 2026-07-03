import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons'; 
import { SECURITY_INFO } from '../utils/validators';
import Toast from 'react-native-root-toast';


const InputField = ({ error, secureTextEntry, onChangeText, maxLength = 50, ...props }) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // LA FONCTION MANQUANTE
  const showInfo = () => {
    Alert.alert(
      "Règles de sécurité", 
      `${SECURITY_INFO}\n\nLimite pour ce champ : ${maxLength} caractères.`
    );
  };

   const handleChangeText = (text) => {
    // 1. Détection de caractère interdit
    const forbiddenPattern = /[/`~'"\\|?<>,{}[\]&^%$#]/g;
    if (forbiddenPattern.test(text)) {
      const char = text.match(forbiddenPattern)[0];
      Toast.show(`Le caractère "${char}" est interdit par sécurité.`, {
        duration: Toast.durations.SHORT,
        position: Toast.positions.TOP,
        backgroundColor: COLORS.error,
      });
      return; // On stoppe l'entrée
    }

    // 2. Alerte de limite atteinte
    if (maxLength && text.length >= maxLength) {
      Toast.show(`Limite de ${maxLength} caractères atteinte.`, {
        duration: Toast.durations.SHORT,
        position: Toast.positions.BOTTOM,
        backgroundColor: COLORS.indigoPrimary,
      });
    }

    if (onChangeText) onChangeText(text);
  };

  

  return (
    <View style={styles.container}>
      <View style={[styles.inputWrapper, error && styles.inputError]}>
        <TextInput 
          style={styles.input} 
          placeholderTextColor={COLORS.textSecondary}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          onChangeText={handleChangeText}
          maxLength={maxLength}
          {...props} 
        />

        {/* Icône d'information sur la sécurité */}
        <TouchableOpacity onPress={showInfo} style={styles.iconPadding}>
          <Ionicons name="information-circle-outline" size={20} color={COLORS.indigoLight} />
        </TouchableOpacity>
        
        {secureTextEntry && (
          <TouchableOpacity 
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.iconContainer}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} 
              size={22} 
              color={COLORS.indigoPrimary} 
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: SPACING.m },
  inputWrapper: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: BORDER_RADIUS.medium,
    paddingHorizontal: SPACING.l,
    height: 60,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(63, 81, 181, 0.1)',
    elevation: 4,
    shadowColor: COLORS.indigoPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
  },
  input: { 
    flex: 1,
    color: COLORS.indigoDark, 
    fontSize: 16, 
    fontWeight: '500' 
  },
  iconPadding: { // AJOUTÉ POUR LE SYMBOLE INFO
    padding: 5,
    marginLeft: 5,
  },
  iconContainer: {
    padding: 5,
    marginLeft: 5,
  },
  inputError: { borderColor: COLORS.error, borderWidth: 1.5 },
  errorText: { color: COLORS.error, fontSize: 12, marginTop: 5, marginLeft: 10 }
});

export default InputField;
