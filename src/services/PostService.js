import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dt3u4rorg/image/upload";
const UPLOAD_PRESET = "Godwin296";

export const postService = {
  createPost: async (userId, userProfile, postData, imageUri) => {
    try {
      // 1. Upload Cloudinary
      let imageUrl = "";
      if (imageUri) {
        const formData = new FormData();
        formData.append('file', { uri: imageUri, type: 'image/jpeg', name: 'post.jpg' });
        formData.append('upload_preset', UPLOAD_PRESET);
        const res = await fetch(CLOUDINARY_URL, { method: 'POST', body: formData });
        const data = await res.json();
        imageUrl = data.secure_url;
      }

      // 2. Enregistrement Firestore avec structure de sécurité
      await addDoc(collection(db, "posts"), {
        userId,
        authorName: userProfile.identity.public.pseudo,
        authorAvatar: userProfile.identity.public.avatar,
        content: postData.content,
        imageUrl,
        price: postData.price || null,
        category: userProfile.professional.mainSkill,
        location: userProfile.professional.neighborhood || "Dschang",
        status: "DISPONIBLE", // Auto-cleaning : passera à "ACHEMINÉ" plus tard
        isQuarantine: false, // Niveau 2 : Système d'alarme
        reportCount: 0,
        createdAt: serverTimestamp(),
      });

      return { success: true };
    } catch (error) {
      throw error;
    }
  }
};