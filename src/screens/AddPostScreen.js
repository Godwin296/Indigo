import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { COLORS, SPACING } from '../theme/theme';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { postService } from '../services/PostService';
import { validatePostContent } from '../utils/validators';
import Button from '../components/Button';

export default function AddPostScreen({ navigation }) {
  const { profile, user } = useAuth();
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.6, // Compression auto pour zones à faible débit (Dschang)
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const handlePublish = async () => {
    const validation = validatePostContent(content);
    if (!validation.valid) return Alert.alert("Sécurité", validation.error);
    if (!image) return Alert.alert("Erreur", "Une preuve par l'image est requise !");

    setLoading(true);
    try {
      await postService.createPost(user.uid, profile, { content }, image);
      Alert.alert("Succès", "Publication en ligne !");
      navigation.goBack();
    } catch (e) {
      Alert.alert("Erreur", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nouvelle Réalisation 🛠️</Text>
      
      <TouchableOpacity onPress={pickImage} style={styles.imagePlaceholder}>
        {image ? <Image source={{ uri: image }} style={styles.fullImage} /> : 
        <Text style={styles.imageText}>+ Ajouter une preuve photo</Text>}
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Décrivez votre travail..."
        placeholderTextColor="#999"
        multiline
        value={content}
        onChangeText={setContent}
      />

      <Button 
        title={loading ? "PUBLICATION..." : "PUBLIER MAINTENANT"} 
        onPress={handlePublish} 
        disabled={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SPACING.l },
  title: { fontSize: 22, fontWeight: 'bold', color: COLORS.indigoDark, marginBottom: 20, marginTop: 40 },
  imagePlaceholder: { 
    width: '100%', 
    height: 250, 
    backgroundColor: '#E0E5F2', 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.indigoLight,
    borderStyle: 'dashed'
  },
  fullImage: { width: '100%', height: '100%' },
  imageText: { color: COLORS.indigoPrimary, fontWeight: '700' },
  input: { 
    backgroundColor: COLORS.white, 
    borderRadius: 15, 
    padding: 15, 
    height: 120, 
    textAlignVertical: 'top',
    marginBottom: 20,
    color: COLORS.indigoDark,
    fontSize: 16
  }
});