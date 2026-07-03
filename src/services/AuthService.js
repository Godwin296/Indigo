// src/services/AuthService.js
import { auth, db } from '../firebase/config'; 
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

// CONFIGURATION CLOUDINARY
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dt3u4rorg/image/upload";
const UPLOAD_PRESET = "Godwin296";

/**
 * Fonction pour envoyer une image vers Cloudinary
 * Remplace l'ancienne fonction uploadImageAsync de Firebase
 */
const uploadToCloudinary = async (uri) => {
  if (!uri) return null;
  
  try {
    const formData = new FormData();
    formData.append('file', {
      uri: uri,
      type: 'image/jpeg', // Cloudinary gérera l'extension automatiquement
      name: 'upload.jpg',
    });
    formData.append('upload_preset', UPLOAD_PRESET);

    const response = await fetch(CLOUDINARY_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = await response.json();
    
    if (data.secure_url) {
      console.log("✅ Upload Cloudinary réussi:", data.secure_url);
      return data.secure_url;
    } else {
      console.error("❌ Erreur Cloudinary:", data.error?.message);
      return null;
    }
  } catch (error) {
    console.error("❌ Erreur Réseau Cloudinary:", error);
    return null;
  }
};

export const authService = {
  register: async (email, password, userData) => {
    try {
      // 1. Création du compte dans Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Upload des images vers Cloudinary (Zéro carte bancaire requise !)
      const avatarUrl = await uploadToCloudinary(userData.avatar);
      const realPhotoUrl = await uploadToCloudinary(userData.realPhoto);

      // 3. Construction du profil final pour Firestore
      const fullUserData = {
        uid: user.uid,
        auth: {
          email: email,
          phone: userData.phone || '',
          whatsapp: userData.whatsapp || '',
          createdAt: serverTimestamp(),
        },
        identity: {
          public: {
            pseudo: userData.pseudo,
            avatar: avatarUrl || '', 
            isVerified: false,
          },
          private: {
            realName: userData.realName,
            realPhoto: realPhotoUrl || '',
          }
        },
        status: {
          accountType: userData.accountType, 
          level: userData.level || 'ETUDIANT',
          subscription: {
            current: 'STANDARD',
            expiresAt: null,
          }
        },
        professional: {
          mainSkill: userData.mainSkill,
          city: 'Dschang',
          neighborhood: userData.neighborhood || '',
          rating: 0.0,
          reviewCount: 0,
        },
        metadata: {
          dataSaverEnabled: true,
          lastSeen: serverTimestamp(),
        }
      };

      // 4. Sauvegarde des données textuelles dans Firestore
      await setDoc(doc(db, "users", user.uid), fullUserData);
      
      return user;
    } catch (error) {
      console.error("Erreur lors de l'inscription:", error);
      throw error;
    }
  },

  login: async (email, password) => {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      throw error;
    }
  },

  logout: async () => {
    return await signOut(auth);
  }
};