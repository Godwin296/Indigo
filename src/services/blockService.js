import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db, auth } from "../firebase/config";

export const blockUser = async (targetUserId) => {
  await updateDoc(doc(db, "users", auth.currentUser.uid), {
    blockedUsers: arrayUnion(targetUserId)
  });
};