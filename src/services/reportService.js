import { collection, addDoc } from "firebase/firestore";
import { db, auth } from "../firebase/config";

export const reportUser = async (targetUserId, reason) => {
  await addDoc(collection(db, "reports"), {
    reportedUserId: targetUserId,
    reportedBy: auth.currentUser.uid,
    reason,
    status: "pending",
    createdAt: new Date()
  });
};