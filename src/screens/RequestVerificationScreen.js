// src/screens/RequestVerificationScreen.js
// Module 1 §2B (statut "Déclaré - à vérifier") + Module 6 (validation admin).
// Le badge lui-même n'est accordé que par l'admin (Supabase Studio en MVP,
// voir ADR-004 dans docs/ARCHITECTURE.md) — cet écran ne fait que déposer
// la demande et en suivre le statut.
import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Button from '../components/Button';

const STATUS_CONFIG = {
  none: { label: 'Aucune demande en cours', color: COLORS.textSecondary, icon: 'information-circle' },
  pending: { label: 'Demande en cours d’examen', color: '#F5B53D', icon: 'time' },
  approved: { label: 'Profil vérifié ✅', color: COLORS.success, icon: 'checkmark-circle' },
  rejected: { label: 'Demande refusée — tu peux en refaire une', color: COLORS.error, icon: 'close-circle' },
};

export default function RequestVerificationScreen() {
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  const verificationStatus = profile?.profiles_private?.verification_status || 'none';
  const config = STATUS_CONFIG[verificationStatus] || STATUS_CONFIG.none;
  const canRequest = verificationStatus === 'none' || verificationStatus === 'rejected';

  const requestVerification = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles_private')
        .update({
          verification_requested: true,
          verification_status: 'pending',
          verification_requested_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      refreshProfile();
      Alert.alert('Demande envoyée !', 'L’équipe Indigo va examiner ton profil.');
    } catch (error) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconWrapper}>
        <Ionicons name="shield-checkmark" size={40} color={COLORS.indigoPrimary} />
      </View>

      <Text style={styles.title}>Demander la vérification</Text>
      <Text style={styles.description}>
        Un profil vérifié inspire davantage confiance et remonte mieux dans les
        recherches. L’équipe Indigo vérifie tes réalisations, tes diplômes
        déclarés et ton activité avant d’accorder le badge "Expert Vérifié".
      </Text>

      <View style={[styles.statusBadge, { borderColor: config.color }]}>
        <Ionicons name={config.icon} size={18} color={config.color} />
        <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.indigoPrimary} style={{ marginTop: SPACING.l }} />
      ) : (
        canRequest && (
          <Button title="Envoyer la demande" onPress={requestVerification} loading={loading} />
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SPACING.l, alignItems: 'center' },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.l,
    marginBottom: SPACING.m,
  },
  title: { color: COLORS.white, fontSize: 20, fontWeight: '800', marginBottom: SPACING.s },
  description: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.l,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.large,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    marginBottom: SPACING.l,
  },
  statusText: { fontWeight: '700', fontSize: 13 },
});
