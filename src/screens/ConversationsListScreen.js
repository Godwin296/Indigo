// src/screens/ConversationsListScreen.js
// Module 4 : Messagerie. Voir la maquette "Messages" (image 7 fournie par
// Godwin) et docs/ARCHITECTURE.md.
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { useResponsive } from '../hooks/useResponsive';
import { chatService } from '../services/chatService';
import { formatTimeAgo } from '../utils/formatTimeAgo';

const TYPE_LABELS = {
  social: { label: 'Social', color: COLORS.gold },
  professional: { label: 'Professionnel', color: COLORS.green },
  contract: { label: 'Contrat', color: COLORS.blue },
};

const FILTERS = [
  { key: 'all', label: 'Toutes' },
  { key: 'social', label: 'Social' },
  { key: 'professional', label: 'Professionnel' },
  { key: 'contract', label: 'Contrats' },
];

export default function ConversationsListScreen({ navigation }) {
  const { user } = useAuth();
  const { contentMaxWidth } = useResponsive();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await chatService.fetchConversations(user.id);
      setConversations(data);
    } catch (e) {
      console.error('Erreur chargement conversations:', e.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = conversations.filter((c) => {
    if (filter !== 'all' && c.type !== filter) return false;
    if (search && !c.otherParticipant?.pseudo?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }]}>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.subtitle}>Connectez-vous, échangez, réalisez.</Text>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher une conversation, un nom..."
            placeholderTextColor={COLORS.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTERS}
          keyExtractor={(f) => f.key}
          style={styles.filtersRow}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setFilter(item.key)}
              style={[styles.filterChip, filter === item.key && styles.filterChipActive]}
            >
              <Text style={[styles.filterLabel, filter === item.key && styles.filterLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 30 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }]}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={36} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>Aucune conversation pour l'instant.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const typeConfig = TYPE_LABELS[item.type] || TYPE_LABELS.social;
            return (
              <TouchableOpacity
                style={styles.row}
                onPress={() =>
                  navigation.navigate('Chat', {
                    conversationId: item.id,
                    conversationType: item.type,
                    otherParticipant: item.otherParticipant,
                  })
                }
              >
                <Image
                  source={{ uri: item.otherParticipant?.avatar_url || 'https://i.pravatar.cc/150' }}
                  style={styles.avatar}
                />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={styles.rowTop}>
                    <Text style={styles.name}>{item.otherParticipant?.pseudo || 'Utilisateur'}</Text>
                    <Text style={styles.time}>{formatTimeAgo(item.last_message_at || item.created_at)}</Text>
                  </View>
                  <Text style={styles.meta}>{item.otherParticipant?.main_skill || ''}</Text>
                  <View style={styles.rowBottom}>
                    <View style={[styles.typeBadge, { backgroundColor: `${typeConfig.color}22` }]}>
                      <Text style={[styles.typeBadgeText, { color: typeConfig.color }]}>{typeConfig.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.preview} numberOfLines={1}>
                    {item.last_message_preview || 'Nouvelle conversation'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 20, paddingTop: 10 },
  title: { color: COLORS.text, fontSize: 24, fontWeight: '800' },
  subtitle: { color: COLORS.textMuted, fontSize: 13, marginTop: 2, marginBottom: 14 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 14 },
  filtersRow: { marginTop: 14, marginBottom: 4 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    marginRight: 8,
  },
  filterChipActive: { backgroundColor: COLORS.primary },
  filterLabel: { color: COLORS.textMuted, fontSize: 12, fontWeight: '600' },
  filterLabelActive: { color: COLORS.text },
  list: { padding: 16, paddingBottom: 100 },
  row: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  avatar: { width: 54, height: 54, borderRadius: 27 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { color: COLORS.text, fontWeight: '700', fontSize: 15 },
  time: { color: COLORS.textMuted, fontSize: 11 },
  meta: { color: COLORS.textMuted, fontSize: 11, marginTop: 1 },
  rowBottom: { flexDirection: 'row', marginTop: 4 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  typeBadgeText: { fontSize: 10, fontWeight: '700' },
  preview: { color: COLORS.textSoft, fontSize: 13, marginTop: 4 },
  emptyState: { alignItems: 'center', padding: 40, gap: 10 },
  emptyText: { color: COLORS.textMuted, textAlign: 'center', fontSize: 13 },
});
