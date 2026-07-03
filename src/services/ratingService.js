import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";

export const rateUser = async (targetUserId, rating) => {

  const userRef = doc(db, "users", targetUserId);
  const snap = await getDoc(userRef);

  if (!snap.exists()) return;

  const user = snap.data();

  const newCount = user.ratingCount + 1;
  const newAverage =
    ((user.ratingAverage * user.ratingCount) + rating) / newCount;

  await updateDoc(userRef, {
    ratingAverage: parseFloat(newAverage.toFixed(2)),
    ratingCount: newCount
  });
};