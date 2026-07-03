import React from 'react';
import { View, Image, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, SPACING } from '../theme/theme';

const ProfileImagePicker = ({ image, onImagePicked, label, isSquare = false }) => {
  
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permissions", "Nous avons besoin d'accéder à vos photos.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true, // ON GARDE L'ÉDITION
        // Rigueur : On retire 'aspect' pour laisser le téléphone gérer 
        // ou on met un aspect libre pour éviter le blocage système sur TECNO
        quality: 0.7, 
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        onImagePicked(result.assets[0].uri);
      }
    } catch (error) {
      console.log("Erreur Picker:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity 
        onPress={pickImage} 
        style={[styles.picker, isSquare && styles.squareFrame]}
        activeOpacity={0.7}
      >
        {image ? (
          <Image source={{ uri: image }} style={[styles.image, isSquare && styles.squareFrame]} />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="camera-outline" size={30} color={COLORS.indigoPrimary} />
            <Text style={styles.placeholderText}>CHOISIR</Text>
          </View>
        )}
        <View style={styles.editBadge}>
          <Ionicons name={image ? "sync" : "add"} size={16} color={COLORS.white} />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', marginVertical: SPACING.m },
  label: { color: COLORS.indigoDark, fontWeight: '800', marginBottom: SPACING.s, fontSize: 11, letterSpacing: 1 },
  picker: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: COLORS.white,
    elevation: 8,
    shadowColor: COLORS.indigoPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.indigoLight
  },
  squareFrame: { borderRadius: BORDER_RADIUS.medium },
  image: { width: '100%', height: '100%', borderRadius: 55 },
  placeholder: { alignItems: 'center' },
  placeholderText: { color: COLORS.indigoPrimary, fontSize: 10, fontWeight: '900', marginTop: 4 },
  editBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: COLORS.accentNeon,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
    elevation: 4
  }
});

export default ProfileImagePicker;
