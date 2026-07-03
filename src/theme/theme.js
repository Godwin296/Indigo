// src/theme/theme.js

export const COLORS = {
  background: '#0A0C23', 
  cardBackground: '#1A1D3D',
  indigoPrimary: '#7B61FF',
  indigoDark: '#050614',
  indigoLight: '#4DA6FF',
  accentNeon: '#7B61FF', 
  white: '#FFFFFF',
  textMain: '#FFFFFF',
  textSecondary: '#AAAAB4',
  error: '#FF4D4D',
  success: '#00E676',
};

export const SPACING = {
  s: 8,
  m: 16,
  l: 24,
  // Ajoute ces lignes pour la compatibilité avec tes nouveaux composants
  small: 8,
  medium: 16,
  large: 24,
};
export const BORDER_RADIUS = {
  small: 8,
  medium: 16,
  large: 24,
};

// Exporte également un objet par défaut pour éviter les erreurs d'import
export default { colors: COLORS, spacing: SPACING, borderRadius: BORDER_RADIUS };
