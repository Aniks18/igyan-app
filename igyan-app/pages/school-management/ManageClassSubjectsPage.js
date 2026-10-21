/**
 * Assign Subjects to Classes — Link subjects to classes in the current session
 * Clean UI with class chips, subject cards, and assignment picker
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Header from '../../components/Header';
import { useSideNav } from '../../utils/SideNavContext';
import { useAuth } from '../../utils/AuthContext';
import {
  getActiveSession, getClasses, getSubjects,
  getClassSubjects, assignSubjectToClass, removeSubjectFromClass,
} from '../../services/schoolManagementService';
import { C, ADMIN_ROLES, ms, PageBanner, SectionHeader, EmptyState, ListCard, ClassChips, PickerModal, SessionBanner, StatRow } from './shared';

export default function ManageClassSubjectsPage() {
  const { openSideNav } = useSideNav();
  const { user } = useAuth();
  const isAdmin = ADMIN_ROLES.includes(user?.role);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [session, setSession] = useState(null);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [classSubjects, setClassSubjects] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const [loadError, setLoadError] = useState('');

  const loadData = useCallback(async () => {
    if (selectedClassId) setClassSubjects(await getClassSubjects(selectedClassId));
  }, [selectedClassId]);

  const boot = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      if (!user?.school_id) return;
      const sess = await getActiveSession(user.school_id);
      setSession(sess);
      if (!sess) return;
      const [cls, subs] = await Promise.all([getClasses(user.school_id, sess.id), getSubjects(user.school_id)]);
      setClasses(cls);
      setSubjects(subs);
      if (cls.length > 0) setSelectedClassId(cls[0].id);
    } catch (e) {
      console.error(e);
      setLoadError('Could not load data. Check your connection and try again.');
    }
    finally { setLoading(false); }
  }, [user?.school_id]);

  useEffect(() => { boot(); }, [boot]);
  useEffect(() => { if (selectedClassId) loadData(); }, [selectedClassId, loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData();
    } catch (e) {
      console.error(e);
    } finally { setRefreshing(false); }
  }, [loadData]);

  const handleAssign = async (subject) => {
    if (!selectedClassId) return;
    try {
      await assignSubjectToClass({ schoolId: user.school_id, classId: selectedClassId, subjectId: subject.id });
      setShowPicker(false);
      await loadData();
    } catch (e) { Alert.alert('Error', e.message); }
  };

  const handleRemove = (id, name) => {
    Alert.alert('Remove Subject', `Remove "${name}" from this class?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => { try { await removeSubjectFromClass(id); await loadData(); } catch (e) { Alert.alert('Error', e.message); } } },
    ]);
  };

  const assignedIds = classSubjects.map(cs => cs.subject_id);
  const available = subjects.filter(s => !assignedIds.includes(s.id));
  const selectedClass = classes.find(c => c.id === selectedClassId);
  const className = selectedClass ? `${selectedClass.class_name} ${selectedClass.section || ''}`.trim() : '';

  if (!isAdmin) {
    return (
      <View style={ms.root}>
        <Header title="Assign Subjects" onMenuPress={openSideNav} />
        <View style={ms.center}>
          <MaterialIcons name="lock" size={48} color={C.dim} />
          <Text style={{ fontSize: 16, fontWeight: '600', color: C.text, marginTop: 8 }}>Access Restricted</Text>
          <Text style={ms.mutedText}>Only admins can assign subjects</Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={ms.root}>
        <Header title="Assign Subjects" onMenuPress={openSideNav} />
        <View style={ms.center}><ActivityIndicator size="large" color={C.accent} /><Text style={ms.mutedText}>Loading data…</Text></View>
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={ms.root}>
        <Header title="Assign Subjects" onMenuPress={openSideNav} />
        <View style={ms.scrollInner}>
          <EmptyState icon="cloud-off" title="Could not load data" text={loadError} onAction={boot} actionLabel="Try again" />
        </View>
      </View>
    );
  }

  if (!session) {
    return (
      <View style={ms.root}>
        <Header title="Assign Subjects" onMenuPress={openSideNav} />
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
      <Header title="Assign Subjects" onMenuPress={openSideNav} />
      <SessionBanner session={session} />

      <ScrollView style={ms.scroll} contentContainerStyle={ms.scrollInner} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}>
        <PageBanner icon="link" title="Class Subjects" subtitle="Link subjects to classes for this session" count={classSubjects.length} accentColor={C.purple} />

        <ClassChips classes={classes} selected={selectedClassId} onSelect={setSelectedClassId} />

        <StatRow stats={[
          { label: 'Assigned', value: classSubjects.length, color: C.accent },
          { label: 'Available', value: available.length, color: C.green },
          { label: 'Total Subjects', value: subjects.length, color: C.purple },
        ]} />

        <SectionHeader title={`Subjects in ${className}`} count={classSubjects.length} onAdd={() => setShowPicker(true)} addLabel="Assign" addIcon="add-link" />

        {classSubjects.length === 0 ? (
          <EmptyState icon="library-books" title="No subjects assigned" text={`Assign subjects from your school catalog to ${className}`} onAction={() => setShowPicker(true)} actionLabel="Assign Subject" />
        ) : (
          classSubjects.map(cs => (
            <ListCard
              key={cs.id}
              icon="menu-book"
              iconColor={C.cyan}
              title={cs.subjects?.subject_name || 'Unknown'}
              subtitle={cs.subjects?.subject_code ? `Code: ${cs.subjects.subject_code}` : null}
              extra={cs.subjects?.description}
              onDelete={() => handleRemove(cs.id, cs.subjects?.subject_name)}
            />
          ))
        )}
      </ScrollView>

      <PickerModal
        visible={showPicker}
        title={`Assign Subject → ${className}`}
        data={available}
        renderLabel={item => item.subject_name}
        renderSub={item => item.subject_code || item.description || ''}
        onSelect={handleAssign}
        onClose={() => setShowPicker(false)}
      />
    </View>
  );
}
