/**
 * iGyan — Manage School Page
 *
 * Tabs: Subjects | Classes | Students | Class Subjects | Faculty
 * Admin-only. Full CRUD for school management tables.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, RefreshControl, Alert, TextInput, Modal, FlatList,
} from 'react-native';
import Header from '../../components/Header';
import { IconSymbol } from '../../components/IconSymbol';
import { useSideNav } from '../../utils/SideNavContext';
import { useAuth } from '../../utils/AuthContext';
import {
  getActiveSession,
  getSubjects, addSubject, deleteSubject,
  getClasses, addClass, deleteClass,
  getSchoolStudents, getClassStudents, enrollStudent, removeStudentFromClass,
  getClassSubjects, assignSubjectToClass, removeSubjectFromClass,
  getSchoolFaculty, getFacultyAssignments, assignFaculty, removeFacultyAssignment,
} from '../../services/schoolManagementService';

const ADMIN_ROLES = ['super_admin', 'co_admin'];
const TABS = [
  { key: 'subjects',      label: 'Subjects',   icon: 'book.fill' },
  { key: 'classes',        label: 'Classes',    icon: 'building.2' },
  { key: 'students',       label: 'Students',   icon: 'person.2.fill' },
  { key: 'classSubjects',  label: 'Assign Subj', icon: 'link' },
  { key: 'faculty',        label: 'Faculty',    icon: 'person.fill' },
];

const C = {
  bg: "#f5f8ff", surface: "#ffffff", surfaceAlt: "#f0f5ff",
  accent: "#4f46e5", accentDim: 'rgba(59,130,246,0.10)',
  text: "#12305c", muted: "#476b9c", dim: "#476b9c", border: "#d9e3f3",
  green: '#22c55e', greenDim: 'rgba(34,197,94,0.10)',
  red: '#ef4444', redDim: 'rgba(239,68,68,0.10)',
  amber: '#f59e0b', amberDim: 'rgba(245,158,11,0.10)',
};

// ═══════════════════════════════════════════════════════════
export default function SchoolManagementPage() {
  const { openSideNav } = useSideNav();
  const { user } = useAuth();
  const isAdmin = ADMIN_ROLES.includes(user?.role);

  const [tab, setTab] = useState('subjects');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [session, setSession] = useState(null);

  // Data
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);       // all school students
  const [faculty, setFaculty] = useState([]);          // all school faculty
  const [classStudents, setClassStudents] = useState([]);
  const [classSubjects, setClassSubjects] = useState([]);
  const [facultyAssignments, setFacultyAssignments] = useState([]);

  // Selections
  const [selectedClassId, setSelectedClassId] = useState(null);

  // Modals
  const [modalType, setModalType] = useState(null);
  const [form, setForm] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [modalBusy, setModalBusy] = useState(false);
  const [loadError, setLoadError] = useState('');

  const closeModal = () => { setModalType(null); setFieldErrors({}); };
  const updateForm = (patch) => {
    setForm(p => ({ ...p, ...(typeof patch === 'function' ? patch(p) : patch) }));
    setFieldErrors({});
  };

  // ─── Boot ─────────────────────────────────
  const boot = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      if (!user?.school_id) return;
      const sess = await getActiveSession(user.school_id);
      setSession(sess);
      if (!sess) return;
      await loadAll(sess);
    } catch (e) {
      console.error('Manage School boot:', e);
      setLoadError('Could not load school data. Check your connection and try again.');
    }
    finally { setLoading(false); }
  }, [user?.school_id]);

  useEffect(() => { boot(); }, [boot]);

  const loadAll = async (sess) => {
    const s = sess || session;
    if (!s) return;
    const [subj, cls, studs, fac] = await Promise.all([
      getSubjects(user.school_id),
      getClasses(user.school_id, s.id),
      getSchoolStudents(user.school_id),
      getSchoolFaculty(user.school_id),
    ]);
    setSubjects(subj);
    setClasses(cls);
    setStudents(studs);
    setFaculty(fac);
    if (cls.length > 0 && !selectedClassId) setSelectedClassId(cls[0].id);
  };

  // Load class-specific data when class changes
  useEffect(() => {
    if (selectedClassId && session) loadClassData();
  }, [selectedClassId, session]);

  const loadClassData = async () => {
    if (!selectedClassId) return;
    const [cs, csub] = await Promise.all([
      getClassStudents(selectedClassId),
      getClassSubjects(selectedClassId),
    ]);
    setClassStudents(cs);
    setClassSubjects(csub);
    if (session) {
      const fa = await getFacultyAssignments(user.school_id, session.id);
      setFacultyAssignments(fa);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAll(session);
    if (selectedClassId) await loadClassData();
    setRefreshing(false);
  }, [session, selectedClassId]);

  // ─── CRUD Handlers ────────────────────────
  const handleAddSubject = async () => {
    if (modalBusy) return;
    if (!form.subjectName?.trim()) {
      setFieldErrors({ subjectName: 'Enter the subject name.' });
      return;
    }
    setModalBusy(true);
    try {
      await addSubject({ schoolId: user.school_id, subjectName: form.subjectName.trim(), subjectCode: form.subjectCode?.trim(), description: form.description?.trim() });
      setModalType(null); setForm({}); setFieldErrors({});
      setSubjects(await getSubjects(user.school_id));
    } catch (e) { Alert.alert('Error', e.message); }
    finally { setModalBusy(false); }
  };

  const handleDeleteSubject = (id, name) => {
    Alert.alert('Delete Subject', `Remove "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await deleteSubject(id); setSubjects(await getSubjects(user.school_id)); }
        catch (e) { Alert.alert('Error', e.message); }
      }},
    ]);
  };

  const handleAddClass = async () => {
    if (modalBusy) return;
    if (!form.className?.trim()) {
      setFieldErrors({ className: 'Enter the class name.' });
      return;
    }
    if (!session) {
      setFieldErrors({ className: 'No active academic session found.' });
      return;
    }
    setModalBusy(true);
    try {
      await addClass({ schoolId: user.school_id, sessionId: session.id, className: form.className.trim(), section: form.section?.trim() || 'A', roomNumber: form.roomNumber?.trim(), capacity: form.capacity?.trim() });
      setModalType(null); setForm({}); setFieldErrors({});
      setClasses(await getClasses(user.school_id, session.id));
    } catch (e) { Alert.alert('Error', e.message); }
    finally { setModalBusy(false); }
  };

  const handleDeleteClass = (id, name) => {
    Alert.alert('Delete Class', `Remove "${name}"? This removes all linked data.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await deleteClass(id); setClasses(await getClasses(user.school_id, session.id)); if (selectedClassId === id && classes.length > 1) setSelectedClassId(classes.find(c => c.id !== id)?.id); }
        catch (e) { Alert.alert('Error', e.message); }
      }},
    ]);
  };

  const handleEnrollStudent = async (studentId) => {
    if (!selectedClassId || !session) return;
    try {
      await enrollStudent({ schoolId: user.school_id, classId: selectedClassId, studentId, sessionId: session.id, rollNumber: form.rollNumber?.trim() });
      setModalType(null); setForm({});
      setClassStudents(await getClassStudents(selectedClassId));
    } catch (e) { Alert.alert('Error', e.message); }
  };

  const handleRemoveStudent = (id, name) => {
    Alert.alert('Remove Student', `Remove "${name}" from this class?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try { await removeStudentFromClass(id); setClassStudents(await getClassStudents(selectedClassId)); }
        catch (e) { Alert.alert('Error', e.message); }
      }},
    ]);
  };

  const handleAssignSubject = async (subjectId) => {
    if (!selectedClassId) return;
    try {
      await assignSubjectToClass({ schoolId: user.school_id, classId: selectedClassId, subjectId });
      setModalType(null);
      setClassSubjects(await getClassSubjects(selectedClassId));
    } catch (e) { Alert.alert('Error', e.message); }
  };

  const handleRemoveClassSubject = (id, name) => {
    Alert.alert('Remove Subject', `Remove "${name}" from this class?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try { await removeSubjectFromClass(id); setClassSubjects(await getClassSubjects(selectedClassId)); }
        catch (e) { Alert.alert('Error', e.message); }
      }},
    ]);
  };

  const handleAssignFaculty = async () => {
    if (modalBusy) return;
    if (!form.facultyId || !form.assignClassId) {
      setFieldErrors({ assign: 'Select a faculty member and a class to continue.' });
      return;
    }
    if (!session) return;
    setModalBusy(true);
    try {
      await assignFaculty({
        schoolId: user.school_id, facultyId: form.facultyId, classId: form.assignClassId,
        subjectId: form.assignSubjectId || null, sessionId: session.id,
        assignmentType: form.assignSubjectId ? 'subject_teacher' : 'class_teacher',
      });
      setModalType(null); setForm({}); setFieldErrors({});
      setFacultyAssignments(await getFacultyAssignments(user.school_id, session.id));
    } catch (e) { Alert.alert('Error', e.message); }
    finally { setModalBusy(false); }
  };

  const handleRemoveAssignment = (id) => {
    Alert.alert('Remove Assignment', 'Deactivate this assignment?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try { await removeFacultyAssignment(id); setFacultyAssignments(await getFacultyAssignments(user.school_id, session.id)); }
        catch (e) { Alert.alert('Error', e.message); }
      }},
    ]);
  };

  // ─── Access guard ─────────────────────────
  if (!isAdmin) {
    return (
      <View style={s.root}>
        <Header title="Manage School" onMenuPress={openSideNav} />
        <View style={s.center}><Text style={s.mutedText}>Admin access required</Text></View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={s.root}>
        <Header title="Manage School" onMenuPress={openSideNav} />
        <View style={s.center}><ActivityIndicator size="large" color={C.accent} /><Text style={s.mutedText}>Loading…</Text></View>
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={s.root}>
        <Header title="Manage School" onMenuPress={openSideNav} />
        <View style={s.scrollInner}>
          <View style={s.center}>
            <IconSymbol name="cloud.fill" size={48} color={C.dim} />
            <Text style={s.emptyTitle}>Could not load school data</Text>
            <Text style={s.mutedText}>{loadError}</Text>
            <TouchableOpacity style={s.submitBtn} onPress={boot} accessibilityRole="button" accessibilityLabel="Try loading again">
              <Text style={s.submitBtnText}>Try again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (!session) {
    return (
      <View style={s.root}>
        <Header title="Manage School" onMenuPress={openSideNav} />
        <View style={s.center}><IconSymbol name="calendar" size={40} color={C.dim} /><Text style={s.emptyTitle}>No Active Session</Text><Text style={s.mutedText}>Create an academic session first.</Text></View>
      </View>
    );
  }

  // Helper to get selected class name
  const selectedClass = classes.find(c => c.id === selectedClassId);
  const selectedClassName = selectedClass ? `${selectedClass.class_name} ${selectedClass.section || ''}`.trim() : '';

  // Already-assigned subject IDs for the selected class
  const assignedSubjectIds = classSubjects.map(cs => cs.subject_id);
  // Already-enrolled student IDs for the selected class
  const enrolledStudentIds = classStudents.map(cs => cs.student_id);

  // ═══════════════════════════════════════════
  return (
    <View style={s.root}>
      <Header title="Manage School" onMenuPress={openSideNav} />

      {/* Session banner */}
      <View style={s.sessionBanner}>
        <IconSymbol name="calendar" size={13} color={C.accent} />
        <Text style={s.sessionText}>{session.session_name}</Text>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabBar}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[s.tab, tab === t.key && s.tabActive]}
            onPress={() => setTab(t.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t.key }}
            accessibilityLabel={`${t.label} tab`}
          >
            <IconSymbol name={t.icon} size={14} color={tab === t.key ? '#fff' : C.muted} />
            <Text style={[s.tabText, tab === t.key && s.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollInner}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
      >
        {/* ─── SUBJECTS TAB ─── */}
        {tab === 'subjects' && (
          <>
            <SectionHeader title={`Subjects (${subjects.length})`} onAdd={() => { setForm({}); setModalType('addSubject'); }} />
            {subjects.length === 0 ? <EmptyState text="No subjects yet" /> : subjects.map(sub => (
              <ListCard key={sub.id}
                title={sub.subject_name}
                subtitle={sub.subject_code ? `Code: ${sub.subject_code}` : null}
                onDelete={() => handleDeleteSubject(sub.id, sub.subject_name)}
              />
            ))}
          </>
        )}

        {/* ─── CLASSES TAB ─── */}
        {tab === 'classes' && (
          <>
            <SectionHeader title={`Classes (${classes.length})`} onAdd={() => { setForm({}); setModalType('addClass'); }} />
            {classes.length === 0 ? <EmptyState text="No classes yet" /> : classes.map(cls => (
              <ListCard key={cls.id}
                title={`${cls.class_name} ${cls.section || ''}`}
                subtitle={cls.room_number ? `Room: ${cls.room_number}` : null}
                extra={cls.capacity ? `Capacity: ${cls.capacity}` : null}
                onDelete={() => handleDeleteClass(cls.id, `${cls.class_name} ${cls.section || ''}`)}
              />
            ))}
          </>
        )}

        {/* ─── STUDENTS TAB ─── */}
        {tab === 'students' && (
          <>
            <ClassChips classes={classes} selected={selectedClassId} onSelect={setSelectedClassId} />
            <SectionHeader title={`Students in ${selectedClassName} (${classStudents.length})`} onAdd={() => { setForm({}); setModalType('enrollStudent'); }} />
            {classStudents.length === 0 ? <EmptyState text="No students enrolled" /> : classStudents.map(cs => (
              <ListCard key={cs.id}
                title={cs.users?.full_name || 'Unknown'}
                subtitle={cs.roll_number ? `Roll: ${cs.roll_number}` : cs.users?.email}
                onDelete={() => handleRemoveStudent(cs.id, cs.users?.full_name)}
              />
            ))}
          </>
        )}

        {/* ─── CLASS SUBJECTS TAB ─── */}
        {tab === 'classSubjects' && (
          <>
            <ClassChips classes={classes} selected={selectedClassId} onSelect={setSelectedClassId} />
            <SectionHeader title={`Subjects in ${selectedClassName} (${classSubjects.length})`} onAdd={() => setModalType('assignSubject')} />
            {classSubjects.length === 0 ? <EmptyState text="No subjects assigned" /> : classSubjects.map(cs => (
              <ListCard key={cs.id}
                title={cs.subjects?.subject_name || 'Unknown'}
                subtitle={cs.subjects?.subject_code ? `Code: ${cs.subjects.subject_code}` : null}
                onDelete={() => handleRemoveClassSubject(cs.id, cs.subjects?.subject_name)}
              />
            ))}
          </>
        )}

        {/* ─── FACULTY TAB ─── */}
        {tab === 'faculty' && (
          <>
            <SectionHeader title={`Faculty Assignments (${facultyAssignments.length})`} onAdd={() => { setForm({}); setModalType('assignFaculty'); }} />
            {facultyAssignments.length === 0 ? <EmptyState text="No assignments yet" /> : facultyAssignments.map(fa => (
              <ListCard key={fa.id}
                title={fa.users?.full_name || 'Unknown'}
                subtitle={`${fa.classes?.class_name || ''} ${fa.classes?.section || ''} → ${fa.subjects?.subject_name || 'Class Teacher'}`}
                badge={fa.assignment_type === 'class_teacher' ? 'CT' : null}
                onDelete={() => handleRemoveAssignment(fa.id)}
              />
            ))}
            {/* Also list all faculty */}
            <Text style={s.subHeading}>All Faculty ({faculty.length})</Text>
            {faculty.map(f => (
              <View key={f.id} style={s.listCard}>
                <View style={s.listCardBody}>
                  <Text style={s.listCardTitle}>{f.full_name}</Text>
                  <Text style={s.listCardSub}>{f.email}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ═════════════ MODALS ═════════════ */}

      {/* Add Subject */}
      <FormModal visible={modalType === 'addSubject'} title="Add Subject" onClose={closeModal} onSubmit={handleAddSubject} busy={modalBusy}>
        <Input placeholder="Subject Name *" value={form.subjectName} onChangeText={v => updateForm({ subjectName: v })} error={fieldErrors.subjectName} editable={!modalBusy} />
        <Input placeholder="Subject Code (optional)" value={form.subjectCode} onChangeText={v => updateForm({ subjectCode: v })} autoCapitalize="none" editable={!modalBusy} />
        <Input placeholder="Description (optional)" value={form.description} onChangeText={v => updateForm({ description: v })} multiline editable={!modalBusy} />
      </FormModal>

      {/* Add Class */}
      <FormModal visible={modalType === 'addClass'} title="Add Class" onClose={closeModal} onSubmit={handleAddClass} busy={modalBusy}>
        <Input placeholder="Class Name * (e.g. 10, XII)" value={form.className} onChangeText={v => updateForm({ className: v })} error={fieldErrors.className} editable={!modalBusy} />
        <Input placeholder="Section (default A)" value={form.section} onChangeText={v => updateForm({ section: v })} autoCapitalize="none" editable={!modalBusy} />
        <Input placeholder="Room Number (optional)" value={form.roomNumber} onChangeText={v => updateForm({ roomNumber: v })} autoCapitalize="none" editable={!modalBusy} />
        <Input placeholder="Capacity (optional)" value={form.capacity} onChangeText={v => updateForm({ capacity: v })} keyboardType="numeric" editable={!modalBusy} />
      </FormModal>

      {/* Enroll Student — picker */}
      <PickerModal
        visible={modalType === 'enrollStudent'}
        title="Enroll Student"
        data={students.filter(st => !enrolledStudentIds.includes(st.id))}
        renderLabel={item => item.full_name}
        renderSub={item => item.email}
        onSelect={item => handleEnrollStudent(item.id)}
        onClose={() => setModalType(null)}
      />

      {/* Assign Subject to Class — picker */}
      <PickerModal
        visible={modalType === 'assignSubject'}
        title={`Assign Subject → ${selectedClassName}`}
        data={subjects.filter(sub => !assignedSubjectIds.includes(sub.id))}
        renderLabel={item => item.subject_name}
        renderSub={item => item.subject_code || ''}
        onSelect={item => handleAssignSubject(item.id)}
        onClose={() => setModalType(null)}
      />

      {/* Assign Faculty */}
      <FacultyAssignModal
        visible={modalType === 'assignFaculty'}
        faculty={faculty}
        classes={classes}
        subjects={subjects}
        form={form}
        setForm={updateForm}
        assignError={fieldErrors.assign}
        busy={modalBusy}
        onSubmit={handleAssignFaculty}
        onClose={closeModal}
      />
    </View>
  );
}

// ═══════════════════════════════════════════════════════════
//  SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════

function SectionHeader({ title, onAdd }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{title}</Text>
      {onAdd && (
        <TouchableOpacity style={s.addBtn} onPress={onAdd} accessibilityRole="button" accessibilityLabel={`Add ${title}`} hitSlop={8}><IconSymbol name="plus" size={14} color="#fff" /><Text style={s.addBtnText}>Add</Text></TouchableOpacity>
      )}
    </View>
  );
}

function EmptyState({ text }) {
  return <View style={s.emptyBox}><IconSymbol name="tray" size={28} color={C.dim} /><Text style={s.mutedText}>{text}</Text></View>;
}

function ClassChips({ classes, selected, onSelect }) {
  return (
    <View style={s.chipRow}>
      <Text style={s.chipLabel}>Select class</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {classes.map(cls => (
          <TouchableOpacity
            key={cls.id}
            style={[s.chip, selected === cls.id && s.chipActive]}
            onPress={() => onSelect(cls.id)}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected === cls.id }}
            accessibilityLabel={`Class ${cls.class_name} ${cls.section || ''}`}
          >
            <Text style={[s.chipText, selected === cls.id && s.chipTextActive]}>{cls.class_name} {cls.section || ''}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

function ListCard({ title, subtitle, extra, badge, onDelete }) {
  return (
    <View style={s.listCard}>
      <View style={s.listCardBody}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={s.listCardTitle}>{title}</Text>
          {badge && <View style={s.badge}><Text style={s.badgeText}>{badge}</Text></View>}
        </View>
        {subtitle ? <Text style={s.listCardSub}>{subtitle}</Text> : null}
        {extra ? <Text style={s.listCardExtra}>{extra}</Text> : null}
      </View>
      {onDelete && (
        <TouchableOpacity onPress={onDelete} style={s.deleteBtn} accessibilityRole="button" accessibilityLabel={title ? `Delete ${title}` : 'Delete item'} hitSlop={8}><IconSymbol name="trash" size={15} color={C.red} /></TouchableOpacity>
      )}
    </View>
  );
}

function Input({ placeholder, value, onChangeText, multiline, keyboardType, error, editable = true, autoCapitalize }) {
  return (
    <View>
      <TextInput
        style={[s.input, multiline && { height: 70, textAlignVertical: 'top' }, error && s.inputInvalid]}
        placeholder={placeholder}
        placeholderTextColor={C.dim}
        value={value || ''}
        onChangeText={onChangeText}
        multiline={multiline}
        keyboardType={keyboardType}
        editable={editable}
        autoCapitalize={autoCapitalize}
        accessibilityLabel={placeholder}
      />
      {error ? <Text accessibilityLiveRegion="polite" style={s.inlineError}>{error}</Text> : null}
    </View>
  );
}

function FormModal({ visible, title, onClose, onSubmit, children, busy = false }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.modalOverlay}>
        <View style={s.modalBox}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Close dialog" hitSlop={8}><IconSymbol name="xmark" size={18} color={C.muted} /></TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 320 }} contentContainerStyle={{ gap: 10, paddingHorizontal: 16, paddingBottom: 16 }}>
            {children}
          </ScrollView>
          <TouchableOpacity
            style={[s.submitBtn, busy && s.submitBtnDisabled]}
            onPress={onSubmit}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={title}
            accessibilityState={{ disabled: busy, busy }}
          >
            {busy ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.submitBtnText}>Save</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function PickerModal({ visible, title, data, renderLabel, renderSub, onSelect, onClose }) {
  const [search, setSearch] = useState('');
  const filtered = data.filter(item => {
    const txt = `${renderLabel(item)} ${renderSub(item)}`.toLowerCase();
    return txt.includes(search.toLowerCase());
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.modalOverlay}>
        <View style={s.modalBox}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Close dialog" hitSlop={8}><IconSymbol name="xmark" size={18} color={C.muted} /></TouchableOpacity>
          </View>
          <TextInput style={[s.input, { marginHorizontal: 16, marginBottom: 8 }]} placeholder="Search…" placeholderTextColor={C.dim} value={search} onChangeText={setSearch} accessibilityLabel={`Search ${title}`} />
          <FlatList
            data={filtered}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={s.pickerRow} onPress={() => { onSelect(item); setSearch(''); }} accessibilityRole="button" accessibilityLabel={`Select ${renderLabel(item)}`}>
                <View style={s.pickerAvatar}><Text style={s.pickerAvatarText}>{renderLabel(item)?.[0] || '?'}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.pickerName}>{renderLabel(item)}</Text>
                  {renderSub(item) ? <Text style={s.pickerSub}>{renderSub(item)}</Text> : null}
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={[s.mutedText, { paddingVertical: 20 }]}>No items available</Text>}
            contentContainerStyle={{ paddingBottom: 20 }}
            style={{ maxHeight: 320 }}
          />
        </View>
      </View>
    </Modal>
  );
}

function FacultyAssignModal({ visible, faculty, classes, subjects, form, setForm, assignError, busy = false, onSubmit, onClose }) {
  const [step, setStep] = useState(1); // 1=faculty, 2=class, 3=subject(optional), 4=confirm

  useEffect(() => { if (visible) setStep(1); }, [visible]);

  const selectedFac = faculty.find(f => f.id === form.facultyId);
  const selectedCls = classes.find(c => c.id === form.assignClassId);
  const selectedSub = subjects.find(s => s.id === form.assignSubjectId);

  const handleClose = () => { setStep(1); onClose(); };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={s.modalOverlay}>
        <View style={s.modalBox}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>
              {step === 1 ? 'Select Faculty' : step === 2 ? 'Select Class' : step === 3 ? 'Select Subject (Optional)' : 'Confirm Assignment'}
            </Text>
            <TouchableOpacity onPress={handleClose} accessibilityRole="button" accessibilityLabel="Close assignment dialog" hitSlop={8}><IconSymbol name="xmark" size={18} color={C.muted} /></TouchableOpacity>
          </View>

          {step === 1 && (
            <FlatList
              data={faculty}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={s.pickerRow} onPress={() => { setForm(p => ({ ...p, facultyId: item.id })); setStep(2); }} accessibilityRole="button" accessibilityLabel={`Select faculty ${item.full_name}`}>
                  <View style={s.pickerAvatar}><Text style={s.pickerAvatarText}>{item.full_name?.[0]}</Text></View>
                  <View style={{ flex: 1 }}><Text style={s.pickerName}>{item.full_name}</Text><Text style={s.pickerSub}>{item.email}</Text></View>
                </TouchableOpacity>
              )}
              style={{ maxHeight: 320 }}
              contentContainerStyle={{ paddingBottom: 16 }}
            />
          )}

          {step === 2 && (
            <FlatList
              data={classes}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={s.pickerRow} onPress={() => { setForm(p => ({ ...p, assignClassId: item.id })); setStep(3); }} accessibilityRole="button" accessibilityLabel={`Select class ${item.class_name} ${item.section || ''}`}>
                  <View style={[s.pickerAvatar, { backgroundColor: C.green }]}><Text style={s.pickerAvatarText}>{item.class_name?.[0]}</Text></View>
                  <View style={{ flex: 1 }}><Text style={s.pickerName}>{item.class_name} {item.section || ''}</Text></View>
                </TouchableOpacity>
              )}
              style={{ maxHeight: 320 }}
              contentContainerStyle={{ paddingBottom: 16 }}
            />
          )}

          {step === 3 && (
            <>
              <TouchableOpacity style={[s.pickerRow, { backgroundColor: C.accentDim }]} onPress={() => { setForm(p => ({ ...p, assignSubjectId: null })); setStep(4); }} accessibilityRole="button" accessibilityLabel="Assign as class teacher, no specific subject">
                <View style={[s.pickerAvatar, { backgroundColor: C.amber }]}><Text style={s.pickerAvatarText}>CT</Text></View>
                <View style={{ flex: 1 }}><Text style={s.pickerName}>Class Teacher (no subject)</Text></View>
              </TouchableOpacity>
              <FlatList
                data={subjects}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity style={s.pickerRow} onPress={() => { setForm(p => ({ ...p, assignSubjectId: item.id })); setStep(4); }} accessibilityRole="button" accessibilityLabel={`Assign subject ${item.subject_name}`}>
                    <View style={s.pickerAvatar}><Text style={s.pickerAvatarText}>{item.subject_name?.[0]}</Text></View>
                    <View style={{ flex: 1 }}><Text style={s.pickerName}>{item.subject_name}</Text></View>
                  </TouchableOpacity>
                )}
                style={{ maxHeight: 280 }}
                contentContainerStyle={{ paddingBottom: 16 }}
              />
            </>
          )}

          {step === 4 && (
            <View style={{ padding: 16, gap: 10 }}>
              <ConfirmRow label="Faculty" value={selectedFac?.full_name} />
              <ConfirmRow label="Class" value={selectedCls ? `${selectedCls.class_name} ${selectedCls.section || ''}` : ''} />
              <ConfirmRow label="Subject" value={selectedSub?.subject_name || 'Class Teacher'} />
              {assignError ? <Text accessibilityLiveRegion="polite" style={s.inlineError}>{assignError}</Text> : null}
              <TouchableOpacity
                style={[s.submitBtn, busy && s.submitBtnDisabled]}
                onPress={onSubmit}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel="Assign faculty"
                accessibilityState={{ disabled: busy, busy }}
              >
                {busy ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.submitBtnText}>Assign Faculty</Text>}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

function ConfirmRow({ label, value }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border }}>
      <Text style={{ fontSize: 13, color: C.muted }}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: '600', color: C.text }}>{value}</Text>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════
//  STYLES
// ═══════════════════════════════════════════════════════════
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  scrollInner: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  mutedText: { fontSize: 13, color: C.muted, textAlign: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: C.text, marginTop: 8 },

  sessionBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: C.accentDim },
  sessionText: { fontSize: 12, fontWeight: '600', color: C.accent },

  // Tabs
  tabBar: { gap: 6, paddingHorizontal: 12, paddingVertical: 10 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, minHeight: 44, borderRadius: 10, backgroundColor: C.surface },
  tabActive: { backgroundColor: C.accent },
  tabText: { fontSize: 12, fontWeight: '500', color: C.muted },
  tabTextActive: { color: '#fff' },

  // Section header
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: C.text },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.accent, paddingHorizontal: 12, paddingVertical: 6, minHeight: 44, borderRadius: 8 },
  addBtnText: { fontSize: 12, fontWeight: '600', color: '#fff' },

  subHeading: { fontSize: 13, fontWeight: '600', color: C.muted, marginTop: 16, marginBottom: 8 },

  // Chips
  chipRow: { marginBottom: 12, gap: 6 },
  chipLabel: { fontSize: 12, fontWeight: '600', color: C.dim },
  chip: { paddingHorizontal: 14, paddingVertical: 6, minHeight: 44, justifyContent: 'center', borderRadius: 14, backgroundColor: C.surface, marginRight: 6 },
  chipActive: { backgroundColor: C.accent },
  chipText: { fontSize: 12, fontWeight: '500', color: C.muted },
  chipTextActive: { color: '#fff' },

  // List card
  listCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 10, padding: 12, marginBottom: 6 },
  listCardBody: { flex: 1, gap: 2 },
  listCardTitle: { fontSize: 14, fontWeight: '600', color: C.text },
  listCardSub: { fontSize: 12, color: C.muted },
  listCardExtra: { fontSize: 11, color: C.dim },
  deleteBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.redDim, alignItems: 'center', justifyContent: 'center' },

  badge: { backgroundColor: C.amberDim, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: '700', color: C.amber },

  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 8 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: C.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '70%', paddingBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  modalTitle: { fontSize: 15, fontWeight: '600', color: C.text },

  input: { backgroundColor: C.surfaceAlt, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: C.text, borderWidth: 1, borderColor: C.border },
  inputInvalid: { borderColor: '#ef4444' },
  inlineError: { fontSize: 12, fontWeight: '500', color: '#ef4444', marginTop: 6, marginHorizontal: 16 },

  submitBtn: { backgroundColor: C.accent, marginHorizontal: 16, paddingVertical: 12, minHeight: 48, justifyContent: 'center', borderRadius: 10, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.45 },
  submitBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },

  // Picker rows
  pickerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border },
  pickerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  pickerAvatarText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  pickerName: { fontSize: 14, fontWeight: '500', color: C.text },
  pickerSub: { fontSize: 11, color: C.muted },
});
