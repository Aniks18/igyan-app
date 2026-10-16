/**
 * Chat List — Shows all parent-teacher conversations
 * Parents see their teachers, Faculty see their parents
 * Includes "New Chat" button + contact picker modal
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, Alert, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Header from '../../components/Header';
import { useSideNav } from '../../utils/SideNavContext';
import { useAuth } from '../../utils/AuthContext';
import { getConversations, getOrCreateConversation, getAvailableContacts } from '../../services/messagingService';

const C = { bg: "#f5f8ff", surface: "#ffffff", border: "#d9e3f3", accent: "#4f46e5", green: '#22c55e', amber: '#f59e0b', red: '#ef4444', text: "#12305c", muted: "#476b9c", dim: "#476b9c" };

function timeAgo(date) {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : parts[0][0].toUpperCase();
}

const AVATAR_COLORS = ["#4f46e5", '#8b5cf6', '#ec4899', '#f59e0b', '#22c55e', '#06b6d4', '#6366f1'];
function pickColor(str) { let h = 0; for (let i = 0; i < (str || '').length; i++) h = str.charCodeAt(i) + ((h << 5) - h); return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]; }

export default function ChatListPage() {
  const { openSideNav } = useSideNav();
  const { user } = useAuth();
  const role = user?.role;
  const isParent = role === 'parent';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [conversations, setConversations] = useState([]);

  // New Chat modal state
  const [showNewChat, setShowNewChat] = useState(false);
  const [contacts, setContacts] = useState(null);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [selectedChild, setSelectedChild] = useState(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getConversations(user.id, role);
      setConversations(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, []);

  const openChat = (conv) => {
    router.push({
      pathname: '/chat-conversation',
      params: {
        conversationId: conv.id,
        name: isParent ? conv.teacher?.full_name : conv.parent?.full_name,
        studentName: conv.student?.full_name,
        className: '',
      },
    });
  };

  /* ─── New Chat flow ─── */
  const openNewChat = async () => {
    setShowNewChat(true);
    setContactsLoading(true);
    setSelectedChild(null);
    try {
      const data = await getAvailableContacts(user.id, role, user.school_id);
      setContacts(data);
      // Auto-select first child for parents
      if (isParent && data?.children?.length > 0) {
        setSelectedChild(data.children[0]);
      }
    } catch (e) {
      console.error('Error loading contacts:', e);
      Alert.alert('Error', 'Could not load contacts');
    } finally {
      setContactsLoading(false);
    }
  };

  const startConversation = async (contactUserId, contactName, studentId, studentName) => {
    if (creating) return;
    setCreating(true);
    try {
      const parentId = isParent ? user.id : contactUserId;
      const teacherId = isParent ? contactUserId : user.id;
      const conv = await getOrCreateConversation({
        schoolId: user.school_id,
        parentId,
        teacherId,
        studentId,
        classId: null,
      });
      setShowNewChat(false);
      await load(); // refresh list
      router.push({
        pathname: '/chat-conversation',
        params: {
          conversationId: conv.id,
          name: contactName,
          studentName: studentName || '',
          className: '',
        },
      });
    } catch (e) {
      console.error('Error creating conversation:', e);
      Alert.alert('Error', e.message || 'Could not start conversation');
    } finally {
      setCreating(false);
    }
  };

  const unreadKey = isParent ? 'unread_parent' : 'unread_teacher';
  const totalUnread = conversations.reduce((sum, c) => sum + (c[unreadKey] || 0), 0);

  /* ─── Parent: pick child first, then show teachers ─── */
  const renderParentContacts = () => {
    if (!contacts) return null;
    const { children = [], teachers = [] } = contacts;

    return (
      <>
        {/* Step 1: Select child */}
        {children.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <Text style={ms.sectionTitle}>Select Child</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {children.map(c => {
                const active = selectedChild?.student_id === c.student_id;
                return (
                  <TouchableOpacity key={c.id} onPress={() => setSelectedChild(c)}
                    style={[ms.chip, active && { backgroundColor: C.accent, borderColor: C.accent }]} activeOpacity={0.7}>
                    <Text style={[ms.chipText, active && { color: '#fff' }]}>{c.student?.full_name || 'Child'}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Step 2: Pick a teacher */}
        <Text style={ms.sectionTitle}>Class Teachers</Text>
        {teachers.length === 0 ?
          <Text style={{ color: C.muted, fontSize: 13, textAlign: 'center', marginTop: 16 }}>No class teachers found in your school</Text>
        : teachers.map(t => (
          <TouchableOpacity key={t.id} style={ms.contactRow} activeOpacity={0.6}
            onPress={() => startConversation(t.id, t.full_name, selectedChild?.student_id, selectedChild?.student?.full_name)}>
            <View style={[ms.avatar, { backgroundColor: pickColor(t.full_name) }]}>
              <Text style={ms.avatarText}>{getInitials(t.full_name)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={ms.contactName}>{t.full_name}</Text>
              <Text style={ms.contactSub}>{[t.className, t.section].filter(Boolean).join(' - ') || t.department || 'Teacher'}</Text>
            </View>
            <MaterialIcons name="chat" size={18} color={C.accent} />
          </TouchableOpacity>
        ))}
      </>
    );
  };

  /* ─── Faculty: show parent-student pairs ─── */
  const renderFacultyContacts = () => {
    if (!contacts) return null;
    const { parents = [] } = contacts;
    if (parents.length === 0) {
      return <Text style={{ color: C.muted, fontSize: 13, textAlign: 'center', marginTop: 16 }}>No parents found in your school</Text>;
    }
    return (
      <>
        <Text style={ms.sectionTitle}>Parents</Text>
        {parents.map(p => (
          <TouchableOpacity key={p.id} style={ms.contactRow} activeOpacity={0.6}
            onPress={() => startConversation(p.parent_id, p.parent?.full_name, p.student_id, p.student?.full_name)}>
            <View style={[ms.avatar, { backgroundColor: pickColor(p.parent?.full_name) }]}>
              <Text style={ms.avatarText}>{getInitials(p.parent?.full_name)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={ms.contactName}>{p.parent?.full_name || 'Parent'}</Text>
              <Text style={ms.contactSub}>Child: {p.student?.full_name || '—'} · {p.relationship || 'Parent'}</Text>
            </View>
            <MaterialIcons name="chat" size={18} color={C.accent} />
          </TouchableOpacity>
        ))}
      </>
    );
  };

  /* ─── Loading state ─── */
  if (loading) {
    return (
      <View style={s.root}>
        <Header title="Messages" onMenuPress={openSideNav} showBack onBackPress={() => router.back()} />
        <View style={s.center}><ActivityIndicator size="large" color={C.accent} /><Text style={s.muted}>Loading conversations…</Text></View>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <Header title="Messages" onMenuPress={openSideNav} showBack onBackPress={() => router.back()} />

      {/* Summary bar */}
      <View style={s.summary}>
        <MaterialIcons name="chat" size={16} color={C.accent} />
        <Text style={s.summaryText}>{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</Text>
        {totalUnread > 0 && (
          <View style={s.unreadBadge}><Text style={s.unreadBadgeText}>{totalUnread} unread</Text></View>
        )}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 80 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}>
        {conversations.length === 0 ? (
          <View style={s.empty}>
            <MaterialIcons name="chat-bubble-outline" size={48} color={C.dim} />
            <Text style={{ fontSize: 15, fontWeight: '600', color: C.text, marginTop: 10 }}>No conversations yet</Text>
            <Text style={s.muted}>{isParent ? 'Tap + below to message your child\'s teacher' : 'Tap + below to message a parent'}</Text>
            <TouchableOpacity onPress={openNewChat} style={{ marginTop: 14, backgroundColor: C.accent, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }} activeOpacity={0.7}>
              <MaterialIcons name="add" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Start a Conversation</Text>
            </TouchableOpacity>
          </View>
        ) : (
          conversations.map(conv => {
            const other = isParent ? conv.teacher : conv.parent;
            const unread = conv[unreadKey] || 0;
            const name = other?.full_name || 'Unknown';
            const studentName = conv.student?.full_name || '';
            const time = timeAgo(conv.last_message_at);

            return (
              <TouchableOpacity key={conv.id} style={s.convRow} onPress={() => openChat(conv)} activeOpacity={0.6}>
                <View style={[s.avatar, { backgroundColor: pickColor(name) }]}>
                  <Text style={s.avatarText}>{getInitials(name)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={[s.convName, unread > 0 && { color: '#fff', fontWeight: '700' }]} numberOfLines={1}>{name}</Text>
                    {time ? <Text style={[s.time, unread > 0 && { color: C.accent }]}>{time}</Text> : null}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <MaterialIcons name="person" size={11} color={C.dim} />
                    <Text style={s.convSub} numberOfLines={1}>{studentName}</Text>
                  </View>
                </View>
                {unread > 0 && (
                  <View style={s.convBadge}><Text style={s.convBadgeText}>{unread}</Text></View>
                )}
                <MaterialIcons name="chevron-right" size={18} color={C.dim} />
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={s.fab} onPress={openNewChat} activeOpacity={0.8}>
        <MaterialIcons name="add" size={26} color="#fff" />
      </TouchableOpacity>

      {/* ─── New Chat Modal ─── */}
      <Modal visible={showNewChat} animationType="fade" transparent={false} onRequestClose={() => setShowNewChat(false)}>
        <View style={ms.fullScreen}>
          {/* Header */}
          <View style={ms.headerRow}>
            <TouchableOpacity onPress={() => setShowNewChat(false)} style={ms.backBtn} activeOpacity={0.7}>
              <MaterialIcons name="arrow-back" size={22} color={C.text} />
            </TouchableOpacity>
            <Text style={ms.headerTitle}>New Conversation</Text>
            <View style={{ width: 36 }} />
          </View>

          {contactsLoading ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="large" color={C.accent} />
              <Text style={{ color: C.muted, marginTop: 10, fontSize: 13 }}>Loading contacts…</Text>
            </View>
          ) : (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
              {isParent ? renderParentContacts() : renderFacultyContacts()}
            </ScrollView>
          )}

          {creating && (
            <View style={ms.creatingOverlay}>
              <ActivityIndicator size="large" color={C.accent} />
              <Text style={{ color: '#fff', marginTop: 10, fontSize: 13 }}>Starting chat…</Text>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

/* ─── Modal styles ─── */
const ms = StyleSheet.create({
  fullScreen: { flex: 1, backgroundColor: C.bg },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border, backgroundColor: C.surface },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: C.text },
  creatingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000c', alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: C.bg },
  chipText: { fontSize: 13, fontWeight: '500', color: C.text },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  contactName: { fontSize: 14, fontWeight: '600', color: C.text },
  contactSub: { fontSize: 12, color: C.muted, marginTop: 1 },
});

/* ─── Main styles ─── */
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  muted: { fontSize: 13, color: C.muted, textAlign: 'center', marginTop: 4, paddingHorizontal: 32 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border },
  summaryText: { fontSize: 13, color: C.muted, flex: 1 },
  unreadBadge: { backgroundColor: C.accent + '22', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  unreadBadgeText: { fontSize: 11, fontWeight: '600', color: C.accent },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 4 },
  convRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  convName: { fontSize: 14, fontWeight: '500', color: C.text, flex: 1 },
  convSub: { fontSize: 12, color: C.muted, flex: 1 },
  time: { fontSize: 11, color: C.dim, marginLeft: 8 },
  convBadge: { backgroundColor: C.accent, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  convBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  fab: { position: 'absolute', bottom: 24, right: 20, width: 52, height: 52, borderRadius: 26, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 4 },
});
