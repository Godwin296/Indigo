import { auth, db } from './config';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

// Création d'un utilisateur
export const signup = async (email, password, fullName, accountType) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Enregistrer info supplémentaire dans Firestore
  await setDoc(doc(db, "users", user.uid), {
    fullName,
    email,
    role: "standard", // standard | premium | entreprise | monetise
    accountType, // standard par défaut
    city: "",
    country: "",
    bio: "",
    photoURL: "",
    isVerified: false,
    verificationRequested: false,
    verificationStatuts: "none",// none | pending | approved | rejected
    ratingAverage: 0,
    ratingCount: 0,
    blockedUsers: [],
    warnings: 0,
    isSuspended: false,
    credibilityScore: 0,
    subscriptionStatus: "inactive",
    createdAt: new Date(),
    lastActive: new Date(),
    profileCompleted: false
  });

  return user;
};

// Connexion
export const login = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};