// src/components/RatingModal.js
import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { ratingService } from '../services/ratingService';

const CRITERIA = [
  { key: 'seriousness', label: 'Sérieux' },
  { key: 'quality', label: 'Qualité' },
  { key: 'timeliness', label: 'Délais' },
];

function StarRow({ label, value, onChange }) {
  return (
    <View style={styles.starRow}>
      <Text style={styles.starLabel}>{label}</Text>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity key={n} onPress={() => onChange(n)}>
            <Ionicons name={n <= value ? 'star' : 'star-outline'} size={24} color={COLORS.gold} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function RatingModal({ visible, conversationId, raterId, ratedId, onClose, onRated }) {
  const [values, setValues] = useState({ seriousness: 0, quality: 0, timeliness: 0 });
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!values.seriousness || !values.quality || !values.timeliness) {
      Alert.alert('Notation incomplète', 'Merci de noter les 3 critères.');
      return;
    }
    setSending(true);
    try {
      await ratingService.rateContract(conversationId, raterId, ratedId, { ...values, comment });
      onRated?.();
      onClose();
    } catch (e) {
      Alert.alert('Erreur', e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Noter cette collaboration</Text>
          {CRITERIA.map((c) => (
            <StarRow
              key={c.key}
              label={c.label}
              value={values[c.key]}
              onChange={(v) => setValues((prev) => ({ ...prev, [c.key]: v }))}
            />
          ))}
          <TextInput
            style={styles.comment}
            placeholder="Un commentaire (optionnel)"
            placeholderTextColor={COLORS.textMuted}
            value={comment}
            onChangeText={setComment}
            multiline
          />
          <View style={styles.actions}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSubmit} disabled={sending} style={styles.submitBtn}>
              <Text style={styles.submitText}>Envoyer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  sheet: { backgroundColor: COLORS.card, borderRadius: 20, padding: 20 },
  title: { color: COLORS.text, fontSize: 17, fontWeight: '800', marginBottom: 16 },
  starRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  starLabel: { color: COLORS.textSoft, fontSize: 14 },
  comment: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: 12,
    color: COLORS.text,
    minHeight: 60,
    marginTop: 6,
    marginBottom: 16,
  },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  cancelText: { color: COLORS.textMuted },
  submitBtn: { backgroundColor: COLORS.primary, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12 },
  submitText: { color: COLORS.text, fontWeight: '700' },
});
