// src/utils/cloudinary.js
// Upload d'images vers Cloudinary — indépendant du backend (Supabase), voir
// docs/ARCHITECTURE.md (ADR-002). Utilisé par AuthService (inscription) et
// EditProfileScreen (édition de profil) pour ne pas dupliquer cette logique.
const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dt3u4rorg/image/upload';
const UPLOAD_PRESET = 'Godwin296';

/**
 * Envoie une image locale (uri du picker) vers Cloudinary et renvoie son URL
 * publique, ou null en cas d'échec (ne lève jamais d'exception — un avatar
 * manquant ne doit jamais bloquer une inscription/édition de profil).
 */
export const uploadToCloudinary = async (uri) => {
  if (!uri) return null;

  try {
    const formData = new FormData();
    formData.append('file', { uri, type: 'image/jpeg', name: 'upload.jpg' });
    formData.append('upload_preset', UPLOAD_PRESET);

    const response = await fetch(CLOUDINARY_URL, {
      method: 'POST',
      body: formData,
      headers: { Accept: 'application/json', 'Content-Type': 'multipart/form-data' },
    });
    const data = await response.json();

    if (data.secure_url) return data.secure_url;
    console.error('❌ Erreur Cloudinary:', data.error?.message);
    return null;
  } catch (error) {
    console.error('❌ Erreur Réseau Cloudinary:', error);
    return null;
  }
};
