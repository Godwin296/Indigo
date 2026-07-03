import { doc, updateDoc } from "firebase/firestore";
import { db, auth } from "../firebase/config";

export const upgradeAccount = async (newRole) => {
  const uid = auth.currentUser.uid;

  let subscriptionStatus = "active";
  let subscriptionEnd = new Date();
  subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);

  await updateDoc(doc(db, "users", uid), {
    role: newRole,
    subscriptionStatus,
    subscriptionStart: new Date(),
    subscriptionEnd
  });
};