// src/screens/ChatScreen.js
// Module 4 : conversation à 3 niveaux. Voir la maquette (image 8) et
// docs/ARCHITECTURE.md. L'identité affichée (pseudo vs nom réel) est résolue
// côté serveur via chatService.getParticipantIdentity — jamais côté client,
// cf ADR-003.
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { chatService } from '../services/chatService';
import { blockService } from '../services/blockService';
import { reportService } from '../services/reportService';
import { formatTimeAgo } from '../utils/formatTimeAgo';
import { validatePostContent } from '../utils/validators';

const TYPE_BANNER = {
  social: { label: 'Discussion sociale', desc: 'Échanges personnels et amicaux.', color: COLORS.gold, icon: 'people' },
  professional: { label: 'Discussion professionnelle', desc: 'Échanges liés à un projet ou une collaboration.', color: COLORS.green, icon: 'briefcase' },
  contract: { label: 'Discussion contrat', desc: 'Échanges sécurisés liés à un contrat.', color: COLORS.blue, icon: 'shield-checkmark' },
};

const REPORT_REASONS = [
  { label: 'Harcèlement', value: 'harcelement' },
  { label: 'Arnaque', value: 'arnaque' },
  { label: 'Langage inapproprié', value: 'langage' },
  { label: 'Usurpation d’identité', value: 'usurpation' },
];

export default function ChatScreen({ route, navigation }) {
  const { conversationId, conversationType, otherParticipant } = route.params;
  const { user } = useAuth();

  const [identity, setIdentity] = useState({
    display_name: otherParticipant?.pseudo,
    display_photo: otherParticipant?.avatar_url,
    is_real_identity: false,
  });
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  const banner = TYPE_BANNER[conversationType] || TYPE_BANNER.social;

  useEffect(() => {
    chatService
      .getParticipantIdentity(conversationId, otherParticipant.id)
      .then(setIdentity)
      .catch((e) => console.error('Erreur identité:', e.message));
  }, [conversationId, otherParticipant.id]);

  useEffect(() => {
    chatService
      .fetchMessages(conversationId)
      .then(setMessages)
      .catch((e) => console.error('Erreur chargement messages:', e.message));

    const unsubscribe = chatService.subscribeToMessages(conversationId, (newMessage) => {
      setMessages((prev) => (prev.some((m) => m.id === newMessage.id) ? prev : [...prev, newMessage]));
    });

    return unsubscribe;
  }, [conversationId]);

  const handleSend = async () => {
    const check = validatePostContent(input);
    if (!check.valid) return Alert.alert('Message', check.error);

    setSending(true);
    const content = input.trim();
    setInput('');
    try {
      await chatService.sendMessage(conversationId, user.id, content);
      // Le message arrivera aussi via l'abonnement temps réel (dédoublonné par id).
    } catch (e) {
      Alert.alert('Erreur', e.message);
      setInput(content); // on remet le texte si l'envoi échoue
    } finally {
      setSending(false);
    }
  };

  const handleCall = () => {
    if (identity.phone) {
      Linking.openURL(`tel:${identity.phone}`);
    } else {
      Alert.alert(
        'Appel indisponible',
        'Le numéro n’est révélé qu’en Mode Contrat, une fois la collaboration formalisée.'
      );
    }
  };

  const handleMenu = () => {
    Alert.alert('Options', null, [
      {
        text: 'Signaler',
        onPress: () =>
          Alert.alert('Signaler cette personne', 'Pourquoi ?', [
            ...REPORT_REASONS.map((r) => ({
              text: r.label,
              onPress: () =>
                reportService
                  .reportUser(user.id, otherParticipant.id, r.value, conversationId)
                  .catch((e) => Alert.alert('Erreur', e.message)),
            })),
            { text: 'Annuler', style: 'cancel' },
          ]),
      },
      {
        text: 'Bloquer',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Bloquer cet utilisateur ?', 'Vous ne recevrez plus de messages de sa part.', [
            { text: 'Annuler', style: 'cancel' },
            {
              text: 'Bloquer',
              style: 'destructive',
              onPress: () =>
                blockService
                  .blockUser(user.id, otherParticipant.id)
                  .then(() => navigation.goBack())
                  .catch((e) => Alert.alert('Erreur', e.message)),
            },
          ]),
      },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={26} color={COLORS.text} />
        </TouchableOpacity>
        <Image source={{ uri: identity.display_photo || 'https://i.pravatar.cc/150' }} style={styles.avatar} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.name}>{identity.display_name}</Text>
          <Text style={styles.status}>{identity.is_real_identity ? 'Identité vérifiée' : 'En ligne'}</Text>
        </View>
        <TouchableOpacity onPress={handleCall} style={{ marginRight: 18 }}>
          <Ionicons name="call" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleMenu}>
          <Ionicons name="ellipsis-vertical" size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <View style={[styles.banner, { backgroundColor: `${banner.color}18`, borderColor: `${banner.color}55` }]}>
        <Ionicons name={banner.icon} size={16} color={banner.color} />
        <View style={{ marginLeft: 8, flex: 1 }}>
          <Text style={[styles.bannerTitle, { color: banner.color }]}>{banner.label}</Text>
          <Text style={styles.bannerDesc}>{banner.desc}</Text>
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => {
          const mine = item.sender_id === user.id;
          return (
            <View style={[styles.messageRow, mine ? styles.messageRowMine : styles.messageRowTheirs]}>
              <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                <Text style={styles.bubbleText}>{item.content}</Text>
              </View>
              <Text style={styles.messageTime}>{formatTimeAgo(item.created_at)}</Text>
            </View>
          );
        }}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Écrire un message..."
          placeholderTextColor={COLORS.textMuted}
          value={input}
          onChangeText={setInput}
          multiline
        />
        <TouchableOpacity onPress={handleSend} disabled={sending || !input.trim()} style={styles.sendBtn}>
          <Ionicons name="send" size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  avatar: { width: 38, height: 38, borderRadius: 19, marginLeft: 10 },
  name: { color: COLORS.text, fontWeight: '700', fontSize: 15 },
  status: { color: COLORS.textMuted, fontSize: 11 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 12,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  bannerTitle: { fontWeight: '700', fontSize: 12 },
  bannerDesc: { color: COLORS.textMuted, fontSize: 11, marginTop: 1 },
  messagesList: { padding: 16, gap: 10 },
  messageRow: { maxWidth: '78%' },
  messageRowMine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  messageRowTheirs: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubble: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMine: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: COLORS.card, borderBottomLeftRadius: 4 },
  bubbleText: { color: COLORS.text, fontSize: 14 },
  messageTime: { color: COLORS.textMuted, fontSize: 10, marginTop: 3 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: COLORS.text,
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: COLORS.primary,
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
