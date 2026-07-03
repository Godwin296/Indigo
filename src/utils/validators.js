// src/utils/validators.js

/**
 * Nettoie les entrées pour éviter les injections
 */
export const sanitizeInput = (text) => {
  if (!text) return '';
  // Supprime les balises HTML et les caractères spéciaux de script
  return text.trim().replace(/[/`~'"\\|?<>,{}[\]&^%$#]/g, '');
};

/**
 * Limites de caractères par type de champ
 */
export const FIELD_LIMITS = {
  PSEUDO: 20,
  BIO: 150,
  REAL_NAME: 50,
  PHONE: 15,
  SKILL: 30,
  NEIGHBORHOOD: 40
};

export const SECURITY_INFO = "Sécurité : Max 20-50 caractères. Symboles de codage (/ ` ~ ' \" | \\ ? < > { } [ ] & ^ % $ #) interdits.";