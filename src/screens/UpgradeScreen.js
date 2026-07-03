import React from "react";
import { View, Text, Button, Alert } from "react-native";
import { upgradeAccount } from "../services/subscriptionService";

export default function UpgradeScreen({ navigation }) {

  const handleUpgrade = async (role) => {
    try {
      await upgradeAccount(role);
      Alert.alert("Compte mis à jour !");
      navigation.goBack();
    } catch (err) {
      Alert.alert("Erreur", err.message);
    }
  };

  return (
    <View style={{ padding:20 }}>
      <Text>Choisir un abonnement :</Text>

      <Button title="Premium - 3000 FCFA" 
              onPress={() => handleUpgrade("premium")} />

      <Button title="Monétisé - 6000 FCFA" 
              onPress={() => handleUpgrade("monetise")} />

      <Button title="Entreprise -15000 FCFA "
              onPress={() => handleUpgrade("entreprise")} />
    </View>
  );
}