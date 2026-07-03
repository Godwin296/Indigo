import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/colors';

export default function ComposerCards() {
  return (
    <View style={styles.card}>
      <View style={styles.topSection}>
        <View style={styles.inputArea}>
          <Image source={{ uri: 'https://i.pravatar.cc/300' }} style={styles.avatar} />
          <Text style={styles.placeholder}>Quoi de neuf aujourd’hui ?</Text>
        </View>
        <TouchableOpacity activeOpacity={0.8}>
          <LinearGradient colors={[COLORS.primary, COLORS.primaryBright]} style={styles.publishBtn}>
            <Ionicons name="create-outline" size={18} color="white" />
            <Text style={styles.publishText}>Publier</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
      <View style={styles.bottomActions}>
        <ActionItem icon="image-outline" color={COLORS.danger} label="Photo" />
        <ActionItem icon="videocam-outline" color={COLORS.primary} label="Vidéo" />
        <ActionItem icon="briefcase-outline" color={COLORS.gold} label="Offre" isMCI />
        <ActionItem icon="calendar-outline" color={COLORS.green} label="Event" />
      </View>
    </View>
  );
}

const ActionItem = ({ icon, color, label, isMCI }) => (
  <TouchableOpacity style={styles.actionItem}>
    {isMCI ? <MaterialCommunityIcons name={icon} size={20} color={color} /> : <Ionicons name={icon} size={20} color={color} />}
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: { marginHorizontal: 18, backgroundColor: 'rgba(16,16,90,0.6)', borderRadius: 24, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border },
  topSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  inputArea: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 38, height: 38, borderRadius: 19, marginRight: 12 },
  placeholder: { color: COLORS.textMuted, fontSize: 14 },
  publishBtn: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, alignItems: 'center', gap: 6 },
  publishText: { color: 'white', fontWeight: 'bold', fontSize: 13 },
  bottomActions: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 14 },
  actionItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionLabel: { color: 'white', fontSize: 11, fontWeight: '500' },
});