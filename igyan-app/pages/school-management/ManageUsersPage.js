/**
 * Manage Users — Add / view / delete all school users
 * Premium dark UI with role filters, user cards, and role picker
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Header from '../../components/Header';
import { useSideNav } from '../../utils/SideNavContext';
import { useAuth } from '../../utils/AuthContext';
import { hashPassword } from '../../utils/crypto';
import { getSchoolUsers, addUser, deleteUser } from '../../services/schoolManagementService';
import { C, ADMIN_ROLES, ms, PageBanner, SectionHeader, EmptyState, UserCard, FormModal, Input, StatRow } from './shared';

const ROLE_LABELS = {
  super_admin: 'Super Admin', co_admin: 'Co-Admin', student: 'Student',
  faculty: 'Faculty', parent: 'Parent', b2c_student: 'Learner', b2c_mentor: 'Mentor',
};

const FILTER_TABS = [
  { key: 'all', label: 'All', icon: 'people' },
  { key: 'student', label: 'Students', icon: 'school' },
  { key: 'faculty', label: 'Faculty', icon: 'badge' },
  { key: 'parent', label: 'Parents', icon: 'people' },
  { key: 'co_admin', label: 'Admins', icon: 'admin-panel-settings' },
];

const ROLE_OPTIONS = [
  { key: 'student', label: 'Student', icon: 'school', color: "#4f46e5" },
  { key: 'faculty', label: 'Faculty', icon: 'badge', color: '#a855f7' },
  { key: 'parent', label: 'Parent', icon: 'people', color: '#22c55e' },
  { key: 'co_admin', label: 'Co-Admin', icon: 'admin-panel-settings', color: '#f59e0b' },
];

export default function ManageUsersPage() {
  const { openSideNav } = useSideNav();
  const { user } = useAuth();
  const isAdmin = ADMIN_ROLES.includes(user?.role);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ role: 'student' });

  useEffect(() => { boot(); }, []);

  const boot = async () => {
    setLoading(true);
    try {
      if (!user?.school_id) return;
      setUsers(await getSchoolUsers(user.school_id));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const reload = async () => setUsers(await getSchoolUsers(user.school_id));
  const onRefresh = useCallback(async () => { setRefreshing(true); await reload(); setRefreshing(false); }, []);

  const filtered = filter === 'all' ? users : users.filter(u => u.role === filter);
  const studentCount = users.filter(u => u.role === 'student').length;
  const facultyCount = users.filter(u => u.role === 'faculty').length;

  const handleAdd = async () => {
    const { fullName, email, password, phone, role } = form;
    if (!fullName?.trim() || !email?.trim() || !password?.trim()) return Alert.alert('Required', 'Please fill in name, email and password');
    try {
      const passwordHash = await hashPassword(password.trim());
      await addUser({ schoolId: user.school_id, fullName: fullName.trim(), email: email.trim().toLowerCase(), passwordHash, role: role || 'student', phone: phone?.trim() });
      setShowAdd(false); setForm({ role: 'student' });
      Alert.alert('Success', `${ROLE_LABELS[role] || 'User'} added successfully`);
      await reload();
    } catch (e) { Alert.alert('Error', e.message); }
  };

  const handleDelete = (id, name) => {
    if (id === user?.id) return Alert.alert('Error', 'You cannot delete your own account');
    Alert.alert('Delete User', `Permanently remove "${name}"?\nThis action cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { try { await deleteUser(id); await reload(); } catch (e) { Alert.alert('Error', e.message); } } },
    ]);
  };

  if (!isAdmin) {
    return (
      <View style={ms.root}>
        <Header title="Manage Users" onMenuPress={openSideNav} showBack onBackPress={() => router.back()} />
        <View style={ms.center}>
          <MaterialIcons name="lock" size={48} color={C.dim} />
          <Text style={{ fontSize: 16, fontWeight: '600', color: C.text, marginTop: 8 }}>Access Restricted</Text>
          <Text style={ms.mutedText}>Only admins can manage users</Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={ms.root}>
        <Header title="Manage Users" onMenuPress={openSideNav} showBack onBackPress={() => router.back()} />
        <View style={ms.center}><ActivityIndicator size="large" color={C.accent} /><Text style={ms.mutedText}>Loading users…</Text></View>
      </View>
    );
  }

  return (
    <View style={ms.root}>
      <Header title="Manage Users" onMenuPress={openSideNav} showBack onBackPress={() => router.back()} />

      {/* Stats */}
      <StatRow stats={[
        { label: 'Total Users', value: users.length, color: C.accent },
        { label: 'Students', value: studentCount, color: C.green },
        { label: 'Faculty', value: facultyCount, color: C.purple },
      ]} />

      {/* Filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 6, gap: 4 }}>
        {FILTER_TABS.map(t => {
          const active = filter === t.key;
          const count = t.key === 'all' ? users.length : users.filter(u => u.role === t.key).length;
          return (
            <TouchableOpacity key={t.key} style={[ls.tab, active && ls.tabActive]} onPress={() => setFilter(t.key)} activeOpacity={0.7}>
              <Text style={[ls.tabText, active && ls.tabTextActive]}>{t.label}</Text>
              <Text style={[ls.tabCount, active && ls.tabCountActive]}>{count}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* User list */}
      <ScrollView style={ms.scroll} contentContainerStyle={ms.scrollInner} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}>
        <SectionHeader title="Users" count={filtered.length} onAdd={() => { setForm({ role: 'student' }); setShowAdd(true); }} addLabel="Add User" addIcon="person-add" />
        {filtered.length === 0 ? (
          <EmptyState icon="person-search" title="No users found" text="Try a different filter or add a new user" onAction={() => { setForm({ role: 'student' }); setShowAdd(true); }} actionLabel="Add User" />
        ) : (
          filtered.map(u => (
            <UserCard key={u.id} name={u.full_name} email={u.email} phone={u.phone} role={u.role} roleBadge={ROLE_LABELS[u.role] || u.role} onDelete={u.id !== user?.id ? () => handleDelete(u.id, u.full_name) : null} />
          ))
        )}
      </ScrollView>

      {/* Add user modal */}
      <FormModal visible={showAdd} title="Add New User" subtitle="Create a user account for your school" onClose={() => setShowAdd(false)} onSubmit={handleAdd} submitLabel="Create User">
        <Input label="Full Name" placeholder="Enter full name" value={form.fullName} onChangeText={v => setForm(p => ({ ...p, fullName: v }))} icon="person" />
        <Input label="Email Address" placeholder="user@example.com" value={form.email} onChangeText={v => setForm(p => ({ ...p, email: v }))} keyboardType="email-address" icon="email" />
        <Input label="Password" placeholder="Create a password" value={form.password} onChangeText={v => setForm(p => ({ ...p, password: v }))} secureTextEntry icon="lock" />
        <Input label="Phone (optional)" placeholder="Phone number" value={form.phone} onChangeText={v => setForm(p => ({ ...p, phone: v }))} keyboardType="phone-pad" icon="phone" />
        <Text style={{ fontSize: 12, fontWeight: '600', color: C.muted, marginTop: 8, marginBottom: 6, marginLeft: 2 }}>Select Role</Text>
        <View style={ls.roleGrid}>
          {ROLE_OPTIONS.map(r => {
            const active = form.role === r.key;
            return (
              <TouchableOpacity key={r.key} style={[ls.roleCard, active && { borderColor: r.color, backgroundColor: r.color + '12' }]} onPress={() => setForm(p => ({ ...p, role: r.key }))} activeOpacity={0.7}>
                <MaterialIcons name={r.icon} size={20} color={active ? r.color : C.dim} />
                <Text style={[ls.roleLabel, active && { color: r.color }]}>{r.label}</Text>
                {active && <MaterialIcons name="check-circle" size={16} color={r.color} style={{ position: 'absolute', top: 6, right: 6 }} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </FormModal>
    </View>
  );
}

const ls = StyleSheet.create({
  tab: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: 'transparent' },
  tabActive: { backgroundColor: C.accent },
  tabText: { fontSize: 13, fontWeight: '500', color: C.muted },
  tabTextActive: { color: '#fff', fontWeight: '600' },
  tabCount: { fontSize: 11, fontWeight: '700', color: C.dim, minWidth: 18, textAlign: 'center' },
  tabCountActive: { color: 'rgba(255,255,255,0.8)' },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  roleCard: { width: '47%', paddingVertical: 14, paddingHorizontal: 12, borderRadius: 12, backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', gap: 6, position: 'relative' },
  roleLabel: { fontSize: 12, fontWeight: '600', color: C.muted },
});
