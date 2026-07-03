// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Écoute de l'état d'authentification
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);

        // 2. Écoute du profil Firestore uniquement si on a un UID
        const userDocRef = doc(db, "users", firebaseUser.uid);
        
        const unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data());
          } else {
            console.log("Profil non trouvé dans Firestore");
            setProfile(null);
          }
          setLoading(false); // Fin du chargement dès qu'on a une réponse (positive ou vide)
        }, (error) => {
          // Si l'erreur est "Missing or insufficient permissions"
          console.error("Erreur Permission Firestore:", error.message);
          setLoading(false);
        });

        // Nettoyage de l'écouteur de profil
        return () => unsubscribeProfile();
      } else {
        // 3. Reset complet si déconnecté
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, authenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
