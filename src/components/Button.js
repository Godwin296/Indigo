// src/components/Button.js
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme/theme';

const Button = ({ title, onPress, loading, type = 'primary', disabled }) => {
  const isSecondary = type === 'secondary';

  return (
    <TouchableOpacity 
      style={[
        styles.button, 
        isSecondary ? styles.buttonSecondary : styles.buttonPrimary,
        (disabled || loading) && styles.disabled
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={isSecondary ? COLORS.indigoPrimary : COLORS.white} />
      ) : (
        <Text style={[styles.text, isSecondary ? styles.textSecondary : styles.textPrimary]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: BORDER_RADIUS.medium,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: SPACING.s,
    // Ombre futuriste
    elevation: 4,
    shadowColor: COLORS.indigoPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
  },
  buttonPrimary: { backgroundColor: COLORS.indigoPrimary },
  buttonSecondary: { 
    backgroundColor: 'transparent', 
    borderWidth: 2, 
    borderColor: COLORS.indigoPrimary,
    elevation: 0 
  },
  disabled: { opacity: 0.6, backgroundColor: COLORS.textSecondary },
  text: { fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
  textPrimary: { color: COLORS.white },
  textSecondary: { color: COLORS.indigoPrimary }
});

export default Button;
