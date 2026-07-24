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

/**
 * Filtre automatique niveau 1 des publications (Module 2 §1). Bloque les
 * liens externes évidents et quelques mots-clés associés à la fraude/violence.
 * Ce contrôle donne un retour immédiat à l'utilisateur ; la contrainte SQL
 * (voir migration 0003) rejette aussi les URLs en dernier rempart côté base.
 */
const URL_PATTERN = /https?:\/\/|www\./i;
const BLOCKED_KEYWORDS = [
  'whatsapp moi au', // contournement classique de la messagerie interne
  'paiement direct hors app',
  'virement avant travaux',
];

export const validatePostContent = (text) => {
  if (!text || !text.trim()) {
    return { valid: false, error: 'Ce champ ne peut pas être vide.' };
  }
  if (URL_PATTERN.test(text)) {
    return { valid: false, error: 'Les liens externes ne sont pas autorisés dans les publications.' };
  }
  const lower = text.toLowerCase();
  const hit = BLOCKED_KEYWORDS.find((kw) => lower.includes(kw));
  if (hit) {
    return { valid: false, error: 'Ce contenu ressemble à une tentative de contournement — reformule.' };
  }
  return { valid: true, error: null };
};