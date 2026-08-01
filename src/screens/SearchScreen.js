// src/screens/SearchScreen.js
// Module 3 : Moteur de recherche. Voir docs/ARCHITECTURE.md et la maquette
// "Recherche" (image 5 fournie par Godwin). Tous les onglets sont
// fonctionnels depuis la fusion des Chantiers A/B/C dans main.
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useResponsive } from '../hooks/useResponsive';
import { useAuth } from '../context/AuthContext';
import { searchService } from '../services/searchService';
import { chatService } from '../services/chatService';

const TABS = [
  { key: 'particulier', label: 'Talents', icon: 'person', kind: 'profile' },
  { key: 'entreprise', label: 'Entreprises', icon: 'business', kind: 'profile' },
  { key: 'service', label: 'Services', icon: 'briefcase', kind: 'post', postType: 'service' },
  { key: 'offre', label: 'Offres', icon: 'bag-handle', kind: 'post', postType: 'offre_emploi' },
  { key: 'publication', label: 'Publications', icon: 'chatbubbles', kind: 'post', postType: null },
];

const MIN_RATING = 3.5;

export default function SearchScreen({ navigation }) {
  const { contentMaxWidth } = useResponsive();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('particulier');
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [qualityOnly, setQualityOnly] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const currentTab = TABS.find((t) => t.key === activeTab);

  const runSearch = useCallback(async () => {
    setLoading(true);
    try {
      let data;
      if (currentTab.kind === 'profile') {
        data = await searchService.searchProfiles({
          query,
          accountType: activeTab,
          city: city.trim() || undefined,
          minRating: qualityOnly ? MIN_RATING : undefined,
        });
      } else {
        data = await searchService.searchPosts({
          query,
          postType: currentTab.postType || undefined,
          city: city.trim() || undefined,
        });
      }
      setResults(data);
    } catch (e) {
      console.error('Erreur recherche:', e.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query, city, qualityOnly, activeTab, currentTab]);

  useEffect(() => {
    const timeout = setTimeout(runSearch, 350); // debounce : évite une requête par frappe
    return () => clearTimeout(timeout);
  }, [runSearch]);

  const handleContact = async (targetUserId) => {
    if (!user?.id || !targetUserId) return;
    if (targetUserId === user.id) return; // pas de conversation avec soi-même
    try {
      const conversation = await chatService.getOrCreateConversation(user.id, targetUserId, {
        type: 'professional',
      });
      const otherId =
        conversation.participant_a === user.id ? conversation.participant_b : conversation.participant_a;
      navigation.navigate('Chat', {
        conversationId: conversation.id,
        conversationType: conversation.type,
        otherParticipant: { id: otherId },
      });
    } catch (e) {
      Alert.alert('Erreur', e.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }]}>
        <Text style={styles.title}>Recherche</Text>
        <Text style={styles.subtitle}>Trouvez le talent qu'il vous faut</Text>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Nom, compétence, mot-clé..."
            placeholderTextColor={COLORS.textMuted}
            value={query}
            onChangeText={setQuery}
          />
          {!!query && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={TABS}
          keyExtractor={(t) => t.key}
          style={styles.tabsRow}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setActiveTab(item.key)}
              style={[styles.tab, activeTab === item.key && styles.tabActive]}
            >
              <Ionicons
                name={item.icon}
                size={16}
                color={activeTab === item.key ? COLORS.text : COLORS.textMuted}
              />
              <Text style={[styles.tabLabel, activeTab === item.key && styles.tabLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />

        <View style={styles.filtersRow}>
          <TextInput
            style={styles.cityInput}
            placeholder="Ville (ex: Dschang)"
            placeholderTextColor={COLORS.textMuted}
            value={city}
            onChangeText={setCity}
          />
          {currentTab.kind === 'profile' && (
            <TouchableOpacity
              style={[styles.qualityChip, qualityOnly && styles.qualityChipActive]}
              onPress={() => setQualityOnly((v) => !v)}
            >
              <Ionicons name="star" size={14} color={qualityOnly ? COLORS.text : COLORS.gold} />
              <Text style={[styles.qualityChipText, qualityOnly && { color: COLORS.text }]}>
                Note {MIN_RATING}+
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading && <ActivityIndicator color={COLORS.primary} style={{ marginTop: 30 }} />}

      {!loading && (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.resultsList, { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }]}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={36} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>Aucun résultat pour cette recherche.</Text>
            </View>
          }
          renderItem={({ item }) =>
            currentTab.kind === 'profile' ? (
              <View style={styles.resultCard}>
                <Image
                  source={{ uri: item.avatar_url || 'https://i.pravatar.cc/150' }}
                  style={styles.resultAvatar}
                />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={styles.resultNameRow}>
                    <Text style={styles.resultName}>{item.pseudo}</Text>
                    {item.verified_badge && (
                      <MaterialCommunityIcons name="check-decagram" size={14} color={COLORS.primary} style={{ marginLeft: 4 }} />
                    )}
                  </View>
                  <Text style={styles.resultMeta}>
                    {item.main_skill || 'Talent'} {item.experience_years ? `• ${item.experience_years} ans` : ''}
                  </Text>
                  <View style={styles.resultMetaRow}>
                    <Ionicons name="location" size={12} color={COLORS.primary} />
                    <Text style={styles.resultLocation}>{item.neighborhood || item.city}</Text>
                  </View>
                  <View style={styles.resultMetaRow}>
                    <Ionicons name="star" size={12} color={COLORS.gold} />
                    <Text style={styles.resultLocation}>
                      {item.rating_average ? item.rating_average.toFixed(1) : '—'} ({item.rating_count || 0} avis)
                      {'  '}• {item.contracts_completed || 0} contrats
                    </Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.callBtn} onPress={() => handleContact(item.id)}>
                  <Ionicons name="chatbubble" size={18} color={COLORS.text} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.resultCard}>
                <Image
                  source={{ uri: item.media?.[0]?.url || item.author?.avatar_url || 'https://i.pravatar.cc/150' }}
                  style={styles.resultAvatar}
                />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={styles.resultNameRow}>
                    <Text style={styles.resultName} numberOfLines={1}>{item.title}</Text>
                  </View>
                  <Text style={styles.resultMeta} numberOfLines={2}>{item.description}</Text>
                  <View style={styles.resultMetaRow}>
                    <Ionicons name="person" size={12} color={COLORS.primary} />
                    <Text style={styles.resultLocation}>
                      {item.author?.pseudo || 'Utilisateur'} • {item.city}
                    </Text>
                  </View>
                  {!!item.price && (
                    <Text style={[styles.resultLocation, { color: COLORS.gold, marginTop: 3 }]}>
                      Dès {item.price} FCFA
                    </Text>
                  )}
                </View>
                <TouchableOpacity style={styles.callBtn} onPress={() => handleContact(item.user_id)}>
                  <Ionicons name="chatbubble" size={18} color={COLORS.text} />
                </TouchableOpacity>
              </View>
            )
          }
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
  tabsRow: { marginTop: 14 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    marginRight: 8,
  },
  tabActive: { backgroundColor: COLORS.primary },
  tabLabel: { color: COLORS.textMuted, fontSize: 12, fontWeight: '600' },
  tabLabelActive: { color: COLORS.text },
  filtersRow: { flexDirection: 'row', gap: 10, marginTop: 14, marginBottom: 8, alignItems: 'center' },
  cityInput: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 38,
    color: COLORS.text,
    fontSize: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  qualityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 38,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  qualityChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  qualityChipText: { color: COLORS.gold, fontSize: 12, fontWeight: '700' },
  resultsList: { padding: 16, paddingBottom: 100 },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  resultAvatar: { width: 56, height: 56, borderRadius: 28 },
  resultNameRow: { flexDirection: 'row', alignItems: 'center' },
  resultName: { color: COLORS.text, fontWeight: '700', fontSize: 15 },
  resultMeta: { color: COLORS.textSoft, fontSize: 12, marginTop: 2 },
  resultMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  resultLocation: { color: COLORS.textMuted, fontSize: 11 },
  callBtn: {
    backgroundColor: COLORS.green,
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: { alignItems: 'center', padding: 40, gap: 10 },
  emptyText: { color: COLORS.textMuted, textAlign: 'center', fontSize: 13, lineHeight: 19 },
});
