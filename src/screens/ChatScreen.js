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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { chatService } from '../services/chatService';
import { blockService } from '../services/blockService';
import { reportService } from '../services/reportService';
import { disputeService } from '../services/disputeService';
import { ratingService } from '../services/ratingService';
import RatingModal from '../components/RatingModal';
import { formatTimeAgo } from '../utils/formatTimeAgo';
import { validatePostContent } from '../utils/validators';
import * as ImagePicker from 'expo-image-picker';

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

  const [conversation, setConversation] = useState({
    type: conversationType,
    contract_status: 'none',
    proposed_by: null,
  });
  const [identity, setIdentity] = useState({
    display_name: otherParticipant?.pseudo,
    display_photo: otherParticipant?.avatar_url,
    is_real_identity: false,
  });
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [alreadyRated, setAlreadyRated] = useState(true);
  const [ratingVisible, setRatingVisible] = useState(false);
  const [dispute, setDispute] = useState(null);
  const listRef = useRef(null);

  const banner = TYPE_BANNER[conversation.type] || TYPE_BANNER.social;

  const refreshConversationState = () => {
    chatService.fetchConversation(conversationId).then(setConversation).catch((e) => console.error(e.message));
    disputeService.fetchDisputeForConversation(conversationId).then(setDispute).catch((e) => console.error(e.message));
  };

  useEffect(() => {
    refreshConversationState();
    ratingService
      .hasRated(conversationId, user.id)
      .then((r) => setAlreadyRated(r))
      .catch((e) => console.error(e.message));
  }, [conversationId, user.id]);

  useEffect(() => {
    chatService
      .getParticipantIdentity(conversationId, otherParticipant.id)
      .then(setIdentity)
      .catch((e) => console.error('Erreur identité:', e.message));
  }, [conversationId, otherParticipant.id, conversation.type]);

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

  const handleProposeContract = async () => {
    try {
      await chatService.proposeContractMode(conversationId);
      refreshConversationState();
    } catch (e) {
      Alert.alert('Erreur', e.message);
    }
  };

  const handleConfirmContract = async () => {
    try {
      await chatService.confirmContractMode(conversationId);
      refreshConversationState();
    } catch (e) {
      Alert.alert('Erreur', e.message);
    }
  };

  const handleCompleteContract = () => {
    Alert.alert('Marquer ce contrat comme terminé ?', 'Les deux parties pourront ensuite se noter.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Confirmer',
        onPress: async () => {
          try {
            await chatService.completeContract(conversationId);
            refreshConversationState();
          } catch (e) {
            Alert.alert('Erreur', e.message);
          }
        },
      },
    ]);
  };

  const [disputeModalVisible, setDisputeModalVisible] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');

  const submitDispute = async () => {
    if (!disputeReason.trim()) return Alert.alert('Litige', 'Décris le problème rencontré.');
    try {
      await disputeService.fileDispute(conversationId, user.id, otherParticipant.id, disputeReason.trim());
      setDisputeModalVisible(false);
      setDisputeReason('');
      refreshConversationState();
    } catch (e) {
      Alert.alert('Erreur', e.message);
    }
  };

  const handleSubmitProof = async () => {
    if (!dispute) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permissions', 'Accès aux photos requis.');

    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (result.canceled || !result.assets?.length) return;

    try {
      await disputeService.submitProof(dispute.id, result.assets[0].uri);
      Alert.alert('Preuve envoyée', 'L’équipe Indigo va examiner ton dossier.');
      refreshConversationState();
    } catch (e) {
      Alert.alert('Erreur', e.message);
    }
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

      {conversation.contract_status === 'disputed' && (
        <View style={styles.disputeBanner}>
          <Ionicons name="warning" size={16} color={COLORS.danger} />
          <Text style={styles.disputeText}>
            {dispute?.reported_user_id === user.id
              ? "Litige en cours — ton compte est temporairement gelé pour les nouveaux clients, en attente d'arbitrage."
              : "Litige signalé — en attente d'arbitrage par l'équipe Indigo."}
          </Text>
          {dispute?.reported_user_id === user.id && !dispute?.proof_url && (
            <TouchableOpacity onPress={handleSubmitProof} style={styles.proofBtn}>
              <Text style={styles.proofBtnText}>Fournir une preuve</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => {
          if (item.is_system) {
            return <Text style={styles.systemMessage}>{item.content}</Text>;
          }
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

      {/* Actions contextuelles selon l'état du contrat (Module 4 §1, niveau 3) */}
      {conversation.type === 'professional' && conversation.contract_status === 'none' && (
        <TouchableOpacity style={styles.actionBar} onPress={handleProposeContract}>
          <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.blue} />
          <Text style={styles.actionBarText}>Passer en Mode Contrat</Text>
        </TouchableOpacity>
      )}
      {conversation.contract_status === 'pending' && conversation.proposed_by !== user.id && (
        <TouchableOpacity style={styles.actionBar} onPress={handleConfirmContract}>
          <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.green} />
          <Text style={styles.actionBarText}>Confirmer le Mode Contrat</Text>
        </TouchableOpacity>
      )}
      {conversation.contract_status === 'pending' && conversation.proposed_by === user.id && (
        <View style={styles.actionBarStatic}>
          <Text style={styles.actionBarTextMuted}>En attente de confirmation de l'autre partie...</Text>
        </View>
      )}
      {conversation.contract_status === 'active' && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBarSmall} onPress={handleCompleteContract}>
            <Text style={styles.actionBarTextSmall}>Marquer terminé</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.disputeBtnSmall} onPress={() => setDisputeModalVisible(true)}>
            <Text style={styles.disputeBtnSmallText}>Signaler un litige</Text>
          </TouchableOpacity>
        </View>
      )}
      {conversation.contract_status === 'completed' && !alreadyRated && (
        <TouchableOpacity style={styles.actionBar} onPress={() => setRatingVisible(true)}>
          <Ionicons name="star-outline" size={16} color={COLORS.gold} />
          <Text style={styles.actionBarText}>Noter cette collaboration</Text>
        </TouchableOpacity>
      )}

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

      <RatingModal
        visible={ratingVisible}
        conversationId={conversationId}
        raterId={user.id}
        ratedId={otherParticipant.id}
        onClose={() => setRatingVisible(false)}
        onRated={() => setAlreadyRated(true)}
      />

      <Modal visible={disputeModalVisible} transparent animationType="fade" onRequestClose={() => setDisputeModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Signaler un litige</Text>
            <Text style={styles.modalDesc}>
              Le compte de l'autre partie sera temporairement gelé le temps de l'arbitrage.
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Décris le problème rencontré..."
              placeholderTextColor={COLORS.textMuted}
              value={disputeReason}
              onChangeText={setDisputeReason}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setDisputeModalVisible(false)}>
                <Text style={styles.modalCancel}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={submitDispute} style={styles.modalSubmit}>
                <Text style={styles.modalSubmitText}>Signaler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  systemMessage: { color: COLORS.textMuted, fontSize: 11, textAlign: 'center', marginVertical: 4 },
  disputeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginHorizontal: 12,
    marginBottom: 8,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,77,109,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,77,109,0.35)',
  },
  disputeText: { color: COLORS.text, fontSize: 12, flex: 1 },
  proofBtn: { backgroundColor: COLORS.danger, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  proofBtnText: { color: COLORS.text, fontSize: 11, fontWeight: '700' },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 12,
    marginBottom: 8,
    padding: 12,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionBarText: { color: COLORS.text, fontWeight: '700', fontSize: 13 },
  actionBarStatic: { alignItems: 'center', marginBottom: 8 },
  actionBarTextMuted: { color: COLORS.textMuted, fontSize: 12, fontStyle: 'italic' },
  actionRow: { flexDirection: 'row', gap: 10, marginHorizontal: 12, marginBottom: 8 },
  actionBarSmall: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    backgroundColor: COLORS.green,
  },
  actionBarTextSmall: { color: COLORS.text, fontWeight: '700', fontSize: 12 },
  disputeBtnSmall: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,77,109,0.15)',
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  disputeBtnSmallText: { color: COLORS.danger, fontWeight: '700', fontSize: 12 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalSheet: { backgroundColor: COLORS.card, borderRadius: 20, padding: 20 },
  modalTitle: { color: COLORS.text, fontSize: 17, fontWeight: '800', marginBottom: 6 },
  modalDesc: { color: COLORS.textMuted, fontSize: 12, marginBottom: 14 },
  modalInput: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: 12,
    color: COLORS.text,
    minHeight: 80,
    marginBottom: 16,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16 },
  modalCancel: { color: COLORS.textMuted, paddingVertical: 10 },
  modalSubmit: { backgroundColor: COLORS.danger, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12 },
  modalSubmitText: { color: COLORS.text, fontWeight: '700' },
});
