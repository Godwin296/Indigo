import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase/config";

export const calculateCredibilityScore = async () => {

  const uid = auth.currentUser.uid;
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) return;

  const user = snap.data();

  let score = 0;

  // 1️⃣ Ancienneté (max 30 pts)
  const createdAt = user.createdAt.toDate();
  const now = new Date();
  const months = (now - createdAt) / (1000 * 60 * 60 * 24 * 30);
  score += Math.min(months * 2, 30);

  // 2️⃣ Régularité (connexion récente = 20 pts)
  const lastActive = user.lastActive.toDate();
  const diffDays = (now - lastActive) / (1000 * 60 * 60 * 24);

  if (diffDays < 2) score += 20;
  else if (diffDays < 7) score += 10;

  // 3️⃣ Type de compte (max 25 pts)
  if (user.role === "premium") score += 10;
  if (user.role === "entreprise") score += 20;
  if (user.role === "monetise") score += 25;

  // 4️⃣ Profil complété (15 pts)
  if (user.profileCompleted) score += 15;

  await updateDoc(userRef, {
    credibilityScore: Math.floor(score)
  });
};