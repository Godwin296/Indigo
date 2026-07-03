// MyApp/firebase/config.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Tes vraies clés Firebase (une seule fois !)
const firebaseConfig = {
  apiKey: "AIzaSyCA6Lww6zL4MnYGffEwGOExjEcAazU6wRM",
  authDomain: "indigo-2f0e3.firebaseapp.com",
  projectId: "indigo-2f0e3",
  storageBucket: "indigo-2f0e3.firebasestorage.app",
  messagingSenderId: "182387911533",
  appId: "1:182387911533:web:f88498c6c965866e238864"
};

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);

// Exportation des services pour les utiliser dans LoginScreen.js ou ProfileScreen.js
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// 3. Initialisation des autres services
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;