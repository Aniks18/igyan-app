/**
 * Manage Faculty — Add faculty users + 4-step assignment wizard
 * Clean tabbed UI with assignments view and faculty directory
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, StyleSheet, Modal, FlatList } from 'react-native';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Header from '../../components/Header';
import { useSideNav } from '../../utils/SideNavContext';
import { useAuth } from '../../utils/AuthContext';
import { hashPassword } from '../../utils/crypto';
import {
  getActiveSession, getClasses, getSubjects, getSchoolFaculty,
  getFacultyAssignments, assignFaculty, removeFacultyAssignment, addUser,
} from '../../services/schoolManagementService';
import { C, ADMIN_ROLES, ms, PageBanner, SectionHeader, EmptyState, ListCard, UserCard, FormModal, Input, SessionBanner, TabBar, StatRow } from './shared';

const STEP_LABELS = ['Select Faculty', 'Select Class', 'Select Subject', 'Confirm'];

export default function ManageFacultyPage() {
  const { openSideNav } = useSideNav();
  const { user } = useAuth();
  const isAdmin = ADMIN_ROLES.includes(user?.role);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [session, setSession] = useState(null);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [tab, setTab] = useState('assign');

  const [showAddUser, setShowAddUser] = useState(false);
  const [showAssignWizard, setShowAssignWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [form, setForm] = useState({});

  useEffect(() => { boot(); }, []);

  const boot = async () => {
    setLoading(true);
    try {
      if (!user?.school_id) return;
      const sess = await getActiveSession(user.school_id);
      setSession(sess);
      if (!sess) return;
      const [cls, subs, fac, fa] = await Promise.all([
        getClasses(user.school_id, sess.id), getSubjects(user.school_id),
        getSchoolFaculty(user.school_id), getFacultyAssignments(user.school_id, sess.id),
      ]);
      setClasses(cls); setSubjects(subs); setFaculty(fac); setAssignments(fa);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const reloadAll = async () => {
    if (!session) return;
    const [fac, fa] = await Promise.all([getSchoolFaculty(user.school_id), getFacultyAssignments(user.school_id, session.id)]);
    setFaculty(fac); setAssignments(fa);
  };
  const onRefresh = useCallback(async () => { setRefreshing(true); await reloadAll(); setRefreshing(false); }, [session]);

  const handleAddFaculty = async () => {
    const { fullName, email, password, phone } = form;
    if (!fullName?.trim() || !email?.trim() || !password?.trim()) return Alert.alert('Required', 'Please fill name, email and password');
    try {
      const passwordHash = await hashPassword(password.trim());
      await addUser({ schoolId: user.school_id, fullName: fullName.trim(), email: email.trim().toLowerCase(), passwordHash, role: 'faculty', phone: phone?.trim() });
      setShowAddUser(false); setForm({});
      Alert.alert('Success', 'Faculty account created successfully');
      await reloadAll();
    } catch (e) { Alert.alert('Error', e.message); }
  };

  const handleAssign = async () => {
    if (!form.facultyId || !form.classId) return Alert.alert('Error', 'Select faculty and class');
    try {
      await assignFaculty({
        schoolId: user.school_id, facultyId: form.facultyId, classId: form.classId,
        subjectId: form.subjectId || null, sessionId: session.id,
        assignmentType: form.subjectId ? 'subject_teacher' : 'class_teacher',
      });
      setShowAssignWizard(false); setWizardStep(1); setForm({});
      await reloadAll();
    } catch (e) { Alert.alert('Error', e.message); }
  };

  const handleRemoveAssignment = (id) => {
    Alert.alert('Remove Assignment', 'Deactivate this faculty assignment?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => { try { await removeFacultyAssignment(id); await reloadAll(); } catch (e) { Alert.alert('Error', e.message); } } },
    ]);
  };

  const closeWizard = () => { setShowAssignWizard(false); setWizardStep(1); setForm({}); };
  const selectedFac = faculty.find(f => f.id === form.facultyId);
  const selectedCls = classes.find(c => c.id === form.classId);
  const selectedSub = subjects.find(s => s.id === form.subjectId);
  const classTeacherCount = assignments.filter(a => a.assignment_type === 'class_teacher').length;

  if (!isAdmin) {
    return (
      <View style={ms.root}>
        <Header title="Manage Faculty" onMenuPress={openSideNav} showBack onBackPress={() => router.back()} />
        <View style={ms.center}>
          <MaterialIcons name="lock" size={48} color={C.dim} />
          <Text style={{ fontSize: 16, fontWeight: '600', color: C.text, marginTop: 8 }}>Access Restricted</Text>
          <Text style={ms.mutedText}>Only admins can manage faculty</Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={ms.root}>
        <Header title="Manage Faculty" onMenuPress={openSideNav} showBack onBackPress={() => router.back()} />
        <View style={ms.center}><ActivityIndicator size="large" color={C.accent} /><Text style={ms.mutedText}>Loading faculty…</Text></View>
      </View>
    );
  }

  if (!session) {
    return (
      <View style={ms.root}>
        <Header title="Manage Faculty" onMenuPress={openSideNav} showBack onBackPress={() => router.back()} />
        <View style={ms.center}>
          <MaterialIcons name="event-busy" size={48} color={C.dim} />
          <Text style={{ fontSize: 16, fontWeight: '600', color: C.text, marginTop: 8 }}>No Active Session</Text>
          <Text style={ms.mutedText}>Create an academic session first</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={ms.root}>
      <Header title="Manage Faculty" onMenuPress={openSideNav} showBack onBackPress={() => router.back()} />
      <SessionBanner session={session} />

      <TabBar
        tabs={[
          { key: 'assign', label: 'Assignments', icon: 'assignment-ind' },
          { key: 'all', label: 'All Faculty', icon: 'people' },
        ]}
        active={tab}
        onChange={setTab}
      />

      <ScrollView style={ms.scroll} contentContainerStyle={ms.scrollInner} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}>
        {tab === 'assign' && (
          <>
            <StatRow stats={[
              { label: 'Assignments', value: assignments.length, color: C.accent },
              { label: 'Class Teachers', value: classTeacherCount, color: C.amber },
              { label: 'Faculty', value: faculty.length, color: C.green },
            ]} />

            <SectionHeader title="Faculty Assignments" count={assignments.length} onAdd={() => { setForm({}); setWizardStep(1); setShowAssignWizard(true); }} addLabel="Assign" addIcon="person-add" />

            {assignments.length === 0 ? (
              <EmptyState icon="assignment-ind" title="No assignments yet" text="Assign faculty members to classes and subjects" onAction={() => { setForm({}); setWizardStep(1); setShowAssignWizard(true); }} actionLabel="Create Assignment" />
            ) : (
              assignments.map(fa => (
                <ListCard
                  key={fa.id}
                  icon={fa.assignment_type === 'class_teacher' ? 'school' : 'menu-book'}
                  iconColor={fa.assignment_type === 'class_teacher' ? C.amber : C.cyan}
                  title={fa.users?.full_name || 'Unknown'}
                  subtitle={`${fa.classes?.class_name || ''} ${fa.classes?.section || ''} → ${fa.subjects?.subject_name || 'Class Teacher'}`}
                  badge={fa.assignment_type === 'class_teacher' ? 'CT' : 'ST'}
                  badgeColor={fa.assignment_type === 'class_teacher' ? C.amber : C.accent}
                  onDelete={() => handleRemoveAssignment(fa.id)}
                />
              ))
            )}
          </>
        )}

        {tab === 'all' && (
          <>
            <PageBanner icon="people" title="Faculty Directory" subtitle="All registered faculty at your school" count={faculty.length} accentColor={C.green} />

            <SectionHeader title="All Faculty" count={faculty.length} onAdd={() => { setForm({}); setShowAddUser(true); }} addLabel="Add Faculty" addIcon="person-add" />

            {faculty.length === 0 ? (
              <EmptyState icon="people" title="No faculty yet" text="Add faculty accounts to get started" onAction={() => { setForm({}); setShowAddUser(true); }} actionLabel="Add Faculty" />
            ) : (
              faculty.map(f => (
                <UserCard key={f.id} name={f.full_name} email={f.email} phone={f.phone} role="faculty" />
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Add new faculty user */}
      <FormModal visible={showAddUser} title="Add New Faculty" subtitle="Create a faculty account" onClose={() => setShowAddUser(false)} onSubmit={handleAddFaculty} submitLabel="Create Faculty">
        <Input label="Full Name" placeholder="Faculty member's name" value={form.fullName} onChangeText={v => setForm(p => ({ ...p, fullName: v }))} icon="person" />
        <Input label="Email Address" placeholder="faculty@example.com" value={form.email} onChangeText={v => setForm(p => ({ ...p, email: v }))} keyboardType="email-address" icon="email" />
        <Input label="Password" placeholder="Create a password" value={form.password} onChangeText={v => setForm(p => ({ ...p, password: v }))} secureTextEntry icon="lock" />
        <Input label="Phone (optional)" placeholder="Phone number" value={form.phone} onChangeText={v => setForm(p => ({ ...p, phone: v }))} keyboardType="phone-pad" icon="phone" />
      </FormModal>

      {/* 4-Step Assignment Wizard */}
      <Modal visible={showAssignWizard} transparent animationType="slide" onRequestClose={closeWizard}>
        <View style={ms.modalOverlay}>
          <View style={[ms.modalBox, { maxHeight: '75%' }]}>
            {/* Wizard header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: '700', color: C.text }}>Assign Faculty</Text>
                <Text style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>Step {wizardStep} of 4 — {STEP_LABELS[wizardStep - 1]}</Text>
              </View>
              <TouchableOpacity onPress={closeWizard} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <MaterialIcons name="close" size={22} color={C.muted} />
              </TouchableOpacity>
            </View>

            {/* Step indicator bar */}
            <View style={wz.stepBar}>
              {[1, 2, 3, 4].map(n => (
                <View key={n} style={[wz.stepDot, wizardStep >= n && wz.stepDotActive, wizardStep === n && wz.stepDotCurrent]} />
              ))}
            </View>

            {/* Step 1: Select Faculty */}
            {wizardStep === 1 && (
              <FlatList
                data={faculty}
                keyExtractor={i => i.id}
                style={{ maxHeight: 340 }}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
                ListEmptyComponent={<Text style={{ color: C.muted, textAlign: 'center', padding: 20 }}>No faculty available</Text>}
                renderItem={({ item }) => (
                  <TouchableOpacity style={wz.row} onPress={() => { setForm(p => ({ ...p, facultyId: item.id })); setWizardStep(2); }}>
                    <View style={[wz.avatar, { backgroundColor: "#4f46e5" }]}>
                      <Text style={wz.avatarText}>{(item.full_name || '?')[0].toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={wz.name}>{item.full_name}</Text>
                      <Text style={wz.sub}>{item.email}</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={20} color={C.dim} />
                  </TouchableOpacity>
                )}
              />
            )}

            {/* Step 2: Select Class */}
            {wizardStep === 2 && (
              <>
                {wizardStep > 1 && (
                  <TouchableOpacity style={wz.backBtn} onPress={() => setWizardStep(1)}>
                    <MaterialIcons name="arrow-back" size={16} color={C.accent} />
                    <Text style={wz.backText}>Back</Text>
                  </TouchableOpacity>
                )}
                <FlatList
                  data={classes}
                  keyExtractor={i => i.id}
                  style={{ maxHeight: 340 }}
                  contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
                  ListEmptyComponent={<Text style={{ color: C.muted, textAlign: 'center', padding: 20 }}>No classes available</Text>}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={wz.row} onPress={() => { setForm(p => ({ ...p, classId: item.id })); setWizardStep(3); }}>
                      <View style={[wz.avatar, { backgroundColor: C.green }]}>
                        <MaterialIcons name="layers" size={18} color="#fff" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={wz.name}>{item.class_name} {item.section || ''}</Text>
                        {item.room_number ? <Text style={wz.sub}>Room {item.room_number}</Text> : null}
                      </View>
                      <MaterialIcons name="chevron-right" size={20} color={C.dim} />
                    </TouchableOpacity>
                  )}
                />
              </>
            )}

            {/* Step 3: Select Subject or Class Teacher */}
            {wizardStep === 3 && (
              <>
                <TouchableOpacity style={wz.backBtn} onPress={() => setWizardStep(2)}>
                  <MaterialIcons name="arrow-back" size={16} color={C.accent} />
                  <Text style={wz.backText}>Back</Text>
                </TouchableOpacity>
                <ScrollView style={{ maxHeight: 340 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                  <TouchableOpacity style={[wz.row, { borderColor: C.amber, borderWidth: 1 }]} onPress={() => { setForm(p => ({ ...p, subjectId: null })); setWizardStep(4); }}>
                    <View style={[wz.avatar, { backgroundColor: C.amber }]}>
                      <MaterialIcons name="school" size={18} color="#fff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={wz.name}>Class Teacher</Text>
                      <Text style={wz.sub}>No specific subject</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={20} color={C.dim} />
                  </TouchableOpacity>
                  {subjects.map(sub => (
                    <TouchableOpacity key={sub.id} style={wz.row} onPress={() => { setForm(p => ({ ...p, subjectId: sub.id })); setWizardStep(4); }}>
                      <View style={[wz.avatar, { backgroundColor: C.cyan }]}>
                        <MaterialIcons name="menu-book" size={18} color="#fff" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={wz.name}>{sub.subject_name}</Text>
                        {sub.subject_code ? <Text style={wz.sub}>{sub.subject_code}</Text> : null}
                      </View>
                      <MaterialIcons name="chevron-right" size={20} color={C.dim} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            {/* Step 4: Confirm */}
            {wizardStep === 4 && (
              <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
                <TouchableOpacity style={wz.backBtn} onPress={() => setWizardStep(3)}>
                  <MaterialIcons name="arrow-back" size={16} color={C.accent} />
                  <Text style={wz.backText}>Back</Text>
                </TouchableOpacity>

                <View style={wz.confirmBox}>
                  <ConfirmRow icon="person" label="Faculty" value={selectedFac?.full_name || '—'} />
                  <ConfirmRow icon="layers" label="Class" value={selectedCls ? `${selectedCls.class_name} ${selectedCls.section || ''}` : '—'} />
                  <ConfirmRow icon="badge" label="Role" value={form.subjectId ? 'Subject Teacher' : 'Class Teacher'} />
                  <ConfirmRow icon="menu-book" label="Subject" value={selectedSub?.subject_name || 'N/A'} last />
                </View>

                <TouchableOpacity style={wz.confirmBtn} onPress={handleAssign}>
                  <MaterialIcons name="check-circle" size={20} color="#fff" />
                  <Text style={wz.confirmBtnText}>Confirm Assignment</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ConfirmRow({ icon, label, value, last }) {
  return (
    <View style={[wz.confirmRow, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#d9e3f3" }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <MaterialIcons name={icon} size={16} color={C.muted} />
        <Text style={{ fontSize: 13, color: C.muted }}>{label}</Text>
      </View>
      <Text style={{ fontSize: 14, fontWeight: '600', color: C.text }}>{value}</Text>
    </View>
  );
}

const wz = StyleSheet.create({
  stepBar: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 8, paddingBottom: 12 },
  stepDot: { width: 24, height: 4, borderRadius: 2, backgroundColor: "#ffffff" },
  stepDotActive: { backgroundColor: C.accent },
  stepDotCurrent: { width: 32 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, marginTop: 8, backgroundColor: C.surface, borderRadius: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  name: { fontSize: 14, fontWeight: '600', color: C.text },
  sub: { fontSize: 12, color: C.muted, marginTop: 1 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, paddingBottom: 8 },
  backText: { fontSize: 13, color: C.accent, fontWeight: '500' },
  confirmBox: { backgroundColor: C.surface, borderRadius: 12, padding: 4, marginTop: 8 },
  confirmRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12 },
  confirmBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.green, paddingVertical: 14, borderRadius: 12, marginTop: 16 },
  confirmBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
