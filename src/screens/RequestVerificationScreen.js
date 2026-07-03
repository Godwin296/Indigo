import React from "react";
import { View, Text, Button, Alert } from "react-native";
import { doc, updateDoc } from "firebase/firestore";
import { db, auth } from "../firebase/config";

export default function RequestVerificationScreen() {

  const requestVerification = async () => {
    await updateDoc(doc(db, "users", auth.currentUser.uid), {
      verificationRequested: true,
      verificationStatus: "pending"
    });

    Alert.alert("Demande envoyée !");
  };

  return (
    <View style={{ padding:20 }}>
      <Text>Demander vérification entreprise</Text>
      <Button title="Envoyer la demande" onPress={requestVerification} />
    </View>
  );
}