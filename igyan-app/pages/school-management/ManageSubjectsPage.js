/**
 * Manage Subjects — Add / View / Delete school subjects
 * Clean UI with subject cards, icons, and modal form
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Header from '../../components/Header';
import { useSideNav } from '../../utils/SideNavContext';
import { useAuth } from '../../utils/AuthContext';
import { getActiveSession, getSubjects, addSubject, deleteSubject } from '../../services/schoolManagementService';
import { C, ADMIN_ROLES, ms, PageBanner, SectionHeader, EmptyState, ListCard, FormModal, Input, SessionBanner } from './shared';

export default function ManageSubjectsPage() {
  const { openSideNav } = useSideNav();
  const { user } = useAuth();
  const isAdmin = ADMIN_ROLES.includes(user?.role);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [session, setSession] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [adding, setAdding] = useState(false);
  const [loadError, setLoadError] = useState('');

  const reload = useCallback(async () => {
    setSubjects(await getSubjects(user.school_id));
  }, [user?.school_id]);

  const boot = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      if (!user?.school_id) return;
      const sess = await getActiveSession(user.school_id);
      setSession(sess);
      await reload();
    } catch (e) {
      console.error(e);
      setLoadError('Could not load subjects. Check your connection and try again.');
    }
    finally { setLoading(false); }
  }, [user?.school_id, reload]);

  useEffect(() => { boot(); }, [boot]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await reload();
    } catch (e) {
      console.error(e);
    } finally { setRefreshing(false); }
  }, [reload]);

  const updateForm = (patch) => {
    setForm(p => ({ ...p, ...patch }));
    setFieldErrors({});
  };

  const handleAdd = async () => {
    if (adding) return;
    if (!form.subjectName?.trim()) {
      setFieldErrors({ subjectName: 'Enter the subject name.' });
      return;
    }
    setAdding(true);
    try {
      await addSubject({ schoolId: user.school_id, subjectName: form.subjectName.trim(), subjectCode: form.subjectCode?.trim(), description: form.description?.trim() });
      setShowModal(false); setForm({}); setFieldErrors({});
      await reload();
    } catch (e) { Alert.alert('Error', e.message); }
    finally { setAdding(false); }
  };

  const handleDelete = (id, name) => {
    Alert.alert('Delete Subject', `Remove "${name}"?\nThis will unlink it from all classes.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { try { await deleteSubject(id); await reload(); } catch (e) { Alert.alert('Error', e.message); } } },
    ]);
  };

  if (!isAdmin) {
    return (
      <View style={ms.root}>
        <Header title="Manage Subjects" onMenuPress={openSideNav} />
        <View style={ms.center}>
          <MaterialIcons name="lock" size={48} color={C.dim} />
          <Text style={{ fontSize: 16, fontWeight: '600', color: C.text, marginTop: 8 }}>Access Restricted</Text>
          <Text style={ms.mutedText}>Only admins can manage subjects</Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={ms.root}>
        <Header title="Manage Subjects" onMenuPress={openSideNav} />
        <View style={ms.center}><ActivityIndicator size="large" color={C.accent} /><Text style={ms.mutedText}>Loading subjects…</Text></View>
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={ms.root}>
        <Header title="Manage Subjects" onMenuPress={openSideNav} />
        <View style={ms.scrollInner}>
          <EmptyState icon="cloud-off" title="Could not load subjects" text={loadError} onAction={boot} actionLabel="Try again" />
        </View>
      </View>
    );
  }

  return (
    <View style={ms.root}>
      <Header title="Manage Subjects" onMenuPress={openSideNav} />
      {session && <SessionBanner session={session} />}

      <PageBanner icon="library-books" title="School Subjects" subtitle="Add and manage subjects taught at your school" count={subjects.length} accentColor={C.cyan} />

      <ScrollView style={ms.scroll} contentContainerStyle={ms.scrollInner} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}>
        <SectionHeader title="All Subjects" count={subjects.length} onAdd={() => { setForm({}); setShowModal(true); }} addLabel="Add Subject" addIcon="add" />

        {subjects.length === 0 ? (
          <EmptyState icon="library-books" title="No subjects added" text="Add subjects like Mathematics, Science, English etc." onAction={() => { setForm({}); setShowModal(true); }} actionLabel="Add Subject" />
        ) : (
          subjects.map(sub => (
            <ListCard
              key={sub.id}
              icon="menu-book"
              iconColor={C.cyan}
              title={sub.subject_name}
              subtitle={sub.subject_code ? `Code: ${sub.subject_code}` : null}
              extra={sub.description || null}
              onDelete={() => handleDelete(sub.id, sub.subject_name)}
            />
          ))
        )}
      </ScrollView>

      <FormModal visible={showModal} title="Add Subject" subtitle="Create a new subject for your school" onClose={() => { setShowModal(false); setFieldErrors({}); }} onSubmit={handleAdd} submitLabel="Add Subject" busy={adding}>
        <Input label="Subject Name" placeholder="e.g. Mathematics, Science" value={form.subjectName} onChangeText={v => updateForm({ subjectName: v })} icon="menu-book" error={fieldErrors.subjectName} editable={!adding} />
        <Input label="Subject Code (optional)" placeholder="e.g. MATH101" value={form.subjectCode} onChangeText={v => updateForm({ subjectCode: v })} icon="tag" autoCapitalize="none" editable={!adding} />
        <Input label="Description (optional)" placeholder="Brief description of the subject" value={form.description} onChangeText={v => updateForm({ description: v })} multiline icon="description" editable={!adding} />
      </FormModal>
    </View>
  );
}
