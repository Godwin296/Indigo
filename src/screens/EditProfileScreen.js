import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { auth, db } from '../firebase/config';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import ProfileImagePicker from '../components/ProfileImagePicker';

export default function EditProfileScreen({ navigation }) {

  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [bio, setBio] = useState('');
  const [image, setImage] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setCity(data.city);
        setCountry(data.country);
        setBio(data.bio);
        setImage(data.photoURL);
      }
    };
    fetchUser();
  }, []);

  const handleSave = async () => {
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        city,
        country,
        bio,
        photoURL: image,
        profileCompleted: true,
        lastActive: new Date()
      });
      Alert.alert("Profil mis à jour !");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Erreur", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <ProfileImagePicker image={image} setImage={setImage} />
      <TextInput placeholder="Ville" value={city} onChangeText={setCity} style={styles.input} />
      <TextInput placeholder="Pays" value={country} onChangeText={setCountry} style={styles.input} />
      <TextInput placeholder="Bio" value={bio} onChangeText={setBio} style={styles.input} />
      <Button title="Enregistrer" onPress={handleSave} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, padding:20 },
  input: { borderWidth:1, marginBottom:10, padding:8, borderRadius:5 }
});