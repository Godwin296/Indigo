import { collection, addDoc } from "firebase/firestore";
import { db, auth } from "../firebase/config";

export const logActivity = async (type) => {
  await addDoc(collection(db, "activities"), {
    userId: auth.currentUser.uid,
    type, // login | update_profile | upgrade | etc
    createdAt: new Date()
  });
};