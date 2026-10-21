/**
 * Chat Conversation — Real-time messaging between parent & teacher
 * Supports text messages with flag tags (general, homework, complaint, urgent)
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, StyleSheet,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Header from '../../components/Header';
import { useSideNav } from '../../utils/SideNavContext';
import { useAuth } from '../../utils/AuthContext';
import { getMessages, sendMessage, markMessagesRead, deleteMessage } from '../../services/messagingService';

const C = { bg: "#f5f8ff", surface: "#ffffff", border: "#d9e3f3", accent: "#4f46e5", green: '#22c55e', amber: '#f59e0b', red: '#ef4444', purple: '#a855f7', text: "#12305c", muted: "#476b9c", dim: "#476b9c" };

const FLAGS = [
  { key: 'general', label: 'General', icon: 'chat', color: C.accent },
  { key: 'homework', label: 'Homework', icon: 'assignment', color: C.amber },
  { key: 'complaint', label: 'Complaint', icon: 'report-problem', color: C.red },
  { key: 'urgent', label: 'Urgent', icon: 'priority-high', color: C.red },
];

const FLAG_LABELS = { general: null, homework: 'HW', complaint: 'COMPLAINT', urgent: 'URGENT' };

function formatTime(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDateDivider(date) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ChatConversationPage() {
  const { openSideNav } = useSideNav();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const { conversationId, name, studentName, className } = params;
  const role = user?.role;
  const senderRole = role === 'parent' ? 'parent' : 'faculty';

  const flatListRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [flag, setFlag] = useState('general');
  const [showFlags, setShowFlags] = useState(false);
  const [sending, setSending] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [sendError, setSendError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    if (!user?.id) {
      setLoadError('Please sign in to view messages.');
      setLoading(false);
      return;
    }
    try {
      const msgs = await getMessages(conversationId, user.id);
      setMessages((msgs || []).reverse()); // oldest first
      await markMessagesRead(conversationId, user.id, senderRole);
    } catch (e) {
      console.error(e);
      setLoadError(e.message || 'Could not load messages. Check your connection and try again.');
    }
    finally { setLoading(false); }
  }, [conversationId, user?.id, senderRole]);

  useEffect(() => { load(); }, [load]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setSendError('');
    try {
      const msg = await sendMessage({
        conversationId,
        schoolId: user.school_id,
        senderId: user.id,
        senderRole,
        messageText: trimmed,
        flag,
        flagLabel: FLAG_LABELS[flag],
      });
      setMessages(prev => [...prev, msg]);
      setText('');
      setFlag('general');
      setShowFlags(false);
      setTimeout(() => flatListRef.current?.scrollToEnd?.({ animated: true }), 150);
    } catch (e) {
      console.error('Error sending message:', e);
      setSendError(e.message || 'Message not sent. Try again.');
    }
    finally { setSending(false); }
  };

  const handleDelete = (msgId) => {
    Alert.alert('Delete Message', 'Remove this message?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await deleteMessage(msgId, user.id);
          setMessages(prev => prev.filter(m => m.id !== msgId));
        } catch (e) { Alert.alert('Error', e.message); }
      }},
    ]);
  };

  // Build data with date dividers for FlatList
  const listData = React.useMemo(() => {
    const items = [];
    let lastDate = '';
    messages.forEach(msg => {
      const d = new Date(msg.created_at).toDateString();
      if (d !== lastDate) {
        items.push({ _type: 'divider', _key: `div-${d}`, date: msg.created_at });
        lastDate = d;
      }
      items.push({ _type: 'msg', _key: msg.id, ...msg });
    });
    return items;
  }, [messages]);

  const currentFlag = FLAGS.find(f => f.key === flag) || FLAGS[0];

  const renderItem = ({ item }) => {
    if (item._type === 'divider') {
      return (
        <View style={s.divider}>
          <View style={s.dividerLine} />
          <Text style={s.dividerText}>{formatDateDivider(item.date)}</Text>
          <View style={s.dividerLine} />
        </View>
      );
    }
    const isMine = item.sender_id === user.id;
    const flagObj = FLAGS.find(f => f.key === item.flag);
    return (
      <TouchableOpacity
        style={[s.bubble, isMine ? s.bubbleMine : s.bubbleTheirs]}
        activeOpacity={0.8}
        onLongPress={isMine ? () => handleDelete(item.id) : undefined}
        accessibilityRole={isMine ? 'button' : undefined}
        accessibilityLabel={`${isMine ? 'Your message' : 'Their message'}: ${item.message_text}`}
        accessibilityHint={isMine ? 'Long-press to delete' : undefined}
      >
        {item.flag && item.flag !== 'general' && flagObj && (
          <View style={[s.flagTag, { backgroundColor: isMine ? 'rgba(255,255,255,0.22)' : flagObj.color + '22' }]}>
            <MaterialIcons name={flagObj.icon} size={10} color={isMine ? '#fff' : flagObj.color} />
            <Text style={[s.flagTagText, { color: isMine ? '#fff' : flagObj.color }]}>{item.flag_label || item.flag}</Text>
          </View>
        )}
        <Text style={[s.msgText, isMine ? s.msgTextMine : s.msgTextTheirs]}>{item.message_text}</Text>
        <View style={s.msgMeta}>
          <Text style={[s.msgTime, !isMine && { color: C.dim }]}>{formatTime(item.created_at)}</Text>
          {isMine && <MaterialIcons name={item.is_read ? 'done-all' : 'done'} size={13} color={item.is_read ? C.accent : C.dim} />}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={s.root}>
        <Header title={name || 'Chat'} onMenuPress={openSideNav} />
        <View style={s.center}><ActivityIndicator size="large" color={C.accent} /></View>
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={s.root}>
        <Header title={name || 'Chat'} onMenuPress={openSideNav} />
        <View style={s.center}>
          <MaterialIcons name="cloud-off" size={48} color={C.dim} />
          <Text style={{ fontSize: 15, fontWeight: '600', color: C.text, marginTop: 10 }}>Could not load messages</Text>
          <Text style={{ fontSize: 13, color: C.muted, textAlign: 'center', marginTop: 4, paddingHorizontal: 32 }}>{loadError}</Text>
          <TouchableOpacity
            onPress={load}
            style={{ marginTop: 14, backgroundColor: C.accent, paddingHorizontal: 20, minHeight: 44, justifyContent: 'center', borderRadius: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Try loading messages again"
          >
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Try again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <Header title={name || 'Chat'} onMenuPress={openSideNav} />

      {/* Info bar */}
      {(studentName || className) ? (
        <View style={s.infoBar}>
          <MaterialIcons name="person" size={13} color={C.dim} />
          <Text style={s.infoText}>{studentName}{className ? ` · ${className}` : ''}</Text>
        </View>
      ) : null}

      {/* Main chat area — KeyboardAvoidingView wraps messages + input */}
      <KeyboardAvoidingView
        style={s.chatArea}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages list */}
        <FlatList
          ref={flatListRef}
          data={listData}
          keyExtractor={item => item._key}
          renderItem={renderItem}
          style={s.messagesList}
          contentContainerStyle={[s.messagesContent, listData.length === 0 && s.emptyContent]}
          onContentSizeChange={() => {
            if (listData.length > 0) flatListRef.current?.scrollToEnd?.({ animated: false });
          }}
          ListEmptyComponent={
            <View style={s.emptyChat}>
              <MaterialIcons name="chat-bubble-outline" size={40} color={C.dim} />
              <Text style={{ fontSize: 15, fontWeight: '600', color: C.text, marginTop: 10 }}>No messages yet</Text>
              <Text style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>Say hello to start the conversation.</Text>
            </View>
          }
        />

        {/* Flag selector */}
        {showFlags && (
          <View style={s.flagBar}>
            {FLAGS.map(f => (
              <TouchableOpacity
                key={f.key}
                style={[s.flagChip, flag === f.key && { backgroundColor: f.color + '22', borderColor: f.color }]}
                onPress={() => { setFlag(f.key); setShowFlags(false); }}
                accessibilityRole="radio"
                accessibilityState={{ checked: flag === f.key }}
                accessibilityLabel={`${f.label} message tag`}
              >
                <MaterialIcons name={f.icon} size={14} color={flag === f.key ? f.color : C.muted} />
                <Text style={[s.flagChipText, flag === f.key && { color: f.color }]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {sendError ? (
          <View style={s.sendErrorBox}>
            <Text accessibilityLiveRegion="polite" style={s.sendErrorText}>{sendError}</Text>
            <TouchableOpacity
              style={s.sendRetryBtn}
              onPress={handleSend}
              disabled={sending || !text.trim()}
              accessibilityRole="button"
              accessibilityLabel="Try sending the message again"
            >
              <Text style={s.sendRetryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Input bar — always pinned at bottom */}
        <View style={s.inputBar}>
          <TouchableOpacity
            style={[s.flagBtn, { borderColor: currentFlag.color + '44' }]}
            onPress={() => setShowFlags(v => !v)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={`Message tag: ${currentFlag.label}. Activate to change.`}
            accessibilityState={{ expanded: showFlags }}
          >
            <MaterialIcons name={currentFlag.icon} size={18} color={currentFlag.color} />
          </TouchableOpacity>
          <TextInput
            style={s.input}
            value={text}
            onChangeText={value => { setText(value); if (sendError) setSendError(''); }}
            placeholder="Type a message…"
            placeholderTextColor={C.dim}
            multiline
            maxLength={2000}
            accessibilityLabel="Type a message"
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[s.sendBtn, !text.trim() && { opacity: 0.4 }]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
            accessibilityRole="button"
            accessibilityLabel="Send message"
            accessibilityState={{ disabled: !text.trim() || sending, busy: sending }}
          >
            {sending ? <ActivityIndicator size="small" color="#fff" /> : <MaterialIcons name="send" size={18} color="#fff" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  infoBar: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border, backgroundColor: C.surface },
  infoText: { fontSize: 12, color: C.muted },

  /* Chat area = messages + input, fills remaining space */
  chatArea: { flex: 1 },
  messagesList: { flex: 1 },
  messagesContent: { paddingHorizontal: 12, paddingVertical: 8, paddingBottom: 4 },
  emptyContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  emptyChat: { alignItems: 'center', justifyContent: 'center' },

  // Date divider
  divider: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 12 },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: C.border },
  dividerText: { fontSize: 11, color: C.dim, fontWeight: '500' },

  // Bubbles
  bubble: { maxWidth: '78%', borderRadius: 14, padding: 10, marginVertical: 2 },
  bubbleMine: { alignSelf: 'flex-end', backgroundColor: C.accent, borderBottomRightRadius: 4 },
  bubbleTheirs: { alignSelf: 'flex-start', backgroundColor: C.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: C.border },
  msgText: { fontSize: 14, lineHeight: 20 },
  msgTextMine: { color: '#fff' },
  msgTextTheirs: { color: C.text },
  msgMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 4 },
  msgTime: { fontSize: 10, color: 'rgba(255,255,255,0.5)' },

  // Flag tags
  flagTag: { flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginBottom: 4 },
  flagTagText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },

  // Flag bar
  flagBar: { flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border, backgroundColor: C.surface },
  flagChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, minHeight: 44, borderRadius: 6, borderWidth: 1, borderColor: C.border },
  flagChipText: { fontSize: 12, fontWeight: '500', color: C.muted },

  // Send error
  sendErrorBox: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 12, marginTop: 8, backgroundColor: '#fdecea', borderWidth: 1, borderColor: '#b3261e', borderRadius: 10, padding: 10 },
  sendErrorText: { flex: 1, fontSize: 13, lineHeight: 18, color: C.text },
  sendRetryBtn: { backgroundColor: C.accent, borderRadius: 8, paddingHorizontal: 14, minHeight: 40, justifyContent: 'center' },
  sendRetryText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  // Input bar
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 10, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border, backgroundColor: C.surface },
  flagBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },
  input: { flex: 1, fontSize: 14, color: C.text, backgroundColor: C.bg, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8, maxHeight: 100, borderWidth: 1, borderColor: C.border },
  sendBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
});
