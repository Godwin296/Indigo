// src/components/CommentsModal.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme/theme';
import { postService } from '../services/PostService';
import { validatePostContent } from '../utils/validators';
import { formatTimeAgo } from '../utils/formatTimeAgo';
import InputField from './InputField';

export default function CommentsModal({ visible, postId, userId, onClose, onCommentAdded }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [sending, setSending] = useState(false);

  const loadComments = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    try {
      const data = await postService.fetchComments(postId);
      setComments(data);
    } catch (e) {
      console.error('Erreur chargement commentaires:', e.message);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    if (visible) loadComments();
  }, [visible, loadComments]);

  const handleSend = async () => {
    const check = validatePostContent(newComment);
    if (!check.valid) return Alert.alert('Commentaire', check.error);

    setSending(true);
    try {
      const comment = await postService.addComment(postId, userId, newComment.trim());
      setComments((c) => [...c, comment]);
      setNewComment('');
      onCommentAdded?.();
    } catch (e) {
      Alert.alert('Erreur', e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheet}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Commentaires</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color={COLORS.indigoPrimary} style={{ marginTop: 30 }} />
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Aucun commentaire — sois le premier !</Text>
              }
              renderItem={({ item }) => (
                <View style={styles.commentRow}>
                  <Image
                    source={{ uri: item.author?.avatar_url || 'https://i.pravatar.cc/100' }}
                    style={styles.avatar}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.commentAuthor}>
                      {item.author?.pseudo || 'Utilisateur'}{' '}
                      <Text style={styles.commentTime}>· {formatTimeAgo(item.created_at)}</Text>
                    </Text>
                    <Text style={styles.commentContent}>{item.content}</Text>
                  </View>
                </View>
              )}
            />
          )}

          <View style={styles.inputRow}>
            <View style={{ flex: 1 }}>
              <InputField
                placeholder="Écrire un commentaire..."
                value={newComment}
                onChangeText={setNewComment}
                maxLength={300}
              />
            </View>
            <TouchableOpacity onPress={handleSend} disabled={sending} style={styles.sendBtn}>
              <Ionicons name="send" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: BORDER_RADIUS.large,
    borderTopRightRadius: BORDER_RADIUS.large,
    maxHeight: '80%',
    padding: SPACING.l,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.m },
  title: { color: COLORS.white, fontSize: 18, fontWeight: '800' },
  list: { paddingBottom: SPACING.m },
  emptyText: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 20 },
  commentRow: { flexDirection: 'row', gap: SPACING.s, marginBottom: SPACING.m },
  avatar: { width: 34, height: 34, borderRadius: 17 },
  commentAuthor: { color: COLORS.white, fontWeight: '700', fontSize: 13 },
  commentTime: { color: COLORS.textSecondary, fontWeight: '400', fontSize: 11 },
  commentContent: { color: COLORS.textSecondary, fontSize: 13, marginTop: 2 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.s },
  sendBtn: {
    backgroundColor: COLORS.indigoPrimary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
