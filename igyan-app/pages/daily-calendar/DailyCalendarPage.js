/**
 * iGyan App — Manage Timetable (Admin)
 *
 * Create Snapshot (draft) → Cancel / Substitute periods → Publish
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import Header from '../../components/Header';
import { IconSymbol } from '../../components/IconSymbol';
import { useSideNav } from '../../utils/SideNavContext';
import { useAuth } from '../../utils/AuthContext';
import {
  getActiveSession,
  getActiveTemplate,
  getTemplateSlots,
  getTemplateDays,
  getDayEntries,
  getDailyRecord,
  getDailyEntries,
  getSchoolClasses,
  getStudentClass,
  getFacultyEntries,
  getSchoolFaculty,
  createDailyRecordDraft,
  snapshotAllClassesToDaily,
  publishDailyRecord,
  updateDailyEntry,
} from '../../services/timetableService';

const ADMIN_ROLES = ['super_admin', 'co_admin'];
const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAYS_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const C = {
  bg: "#f5f8ff", surface: "#ffffff", surfaceAlt: "#f0f5ff",
  accent: "#4f46e5", accentDim: 'rgba(59,130,246,0.10)',
  text: "#12305c", muted: "#476b9c", dim: "#476b9c", border: "#d9e3f3",
  green: '#22c55e', greenDim: 'rgba(34,197,94,0.10)',
  amber: '#f59e0b', amberDim: 'rgba(245,158,11,0.10)',
  red: '#ef4444', redDim: 'rgba(239,68,68,0.10)',
  purple: '#8b5cf6', purpleDim: 'rgba(139,92,246,0.08)',
  orange: '#f97316', orangeDim: 'rgba(249,115,22,0.08)',
};

const STATUS_MAP = {
  as_planned:  { label: 'As Planned',  color: C.green, bg: C.greenDim,  icon: 'checkmark.circle.fill' },
  substituted: { label: 'Substituted', color: C.amber, bg: C.amberDim,  icon: 'arrow.counterclockwise' },
  cancelled:   { label: 'Cancelled',   color: C.red,   bg: C.redDim,    icon: 'xmark.circle.fill' },
  free_period: { label: 'Free Period', color: C.muted, bg: 'rgba(100,116,139,0.10)', icon: 'clock.fill' },
};

const fmtDate = (d) => d.toISOString().split('T')[0];
const fmtDisplay = (d) => d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
const isSameDay = (a, b) => fmtDate(a) === fmtDate(b);

function getWeekDates(base) {
  const d = new Date(base);
  const mon = new Date(d);
  mon.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(mon);
    dt.setDate(mon.getDate() + i);
    return dt;
  });
}

// ═══════════════════════════════════════════
export default function DailyCalendarPage() {
  const { openSideNav } = useSideNav();
  const { user } = useAuth();
  const isAdmin = ADMIN_ROLES.includes(user?.role);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snapshotting, setSnapshotting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekDates, setWeekDates] = useState(getWeekDates(new Date()));

  const [session, setSession] = useState(null);
  const [template, setTemplate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [days, setDays] = useState([]);
  const [masterEntries, setMasterEntries] = useState([]);
  const [dailyRecord, setDailyRecord] = useState(null);
  const [dailyEntries, setDailyEntries] = useState([]);

  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [myClassId, setMyClassId] = useState(null);

  // Faculty list for substitute picker
  const [facultyList, setFacultyList] = useState([]);
  const [subModalVisible, setSubModalVisible] = useState(false);
  const [subTarget, setSubTarget] = useState(null); // entry being substituted

  // ─── Boot ─────────────────────────────────
  useEffect(() => { boot(); }, []);
  useEffect(() => { setWeekDates(getWeekDates(selectedDate)); }, [selectedDate]);
  useEffect(() => {
    if (template && days.length > 0) loadDay();
  }, [selectedDate, template, days, selectedClassId, myClassId]);

  const boot = async () => {
    setLoading(true);
    try {
      if (!user?.school_id) return;
      const sess = await getActiveSession(user.school_id);
      setSession(sess);
      if (!sess) return;

      const tmpl = await getActiveTemplate(user.school_id, sess.id);
      setTemplate(tmpl);
      if (!tmpl) return;

      const [sl, dy] = await Promise.all([getTemplateSlots(tmpl.id), getTemplateDays(tmpl.id)]);
      setSlots(sl);
      setDays(dy);

      if (isAdmin) {
        const [cls, fac] = await Promise.all([
          getSchoolClasses(user.school_id),
          getSchoolFaculty(user.school_id),
        ]);
        setClasses(cls);
        setFacultyList(fac);
        if (cls.length > 0) setSelectedClassId(cls[0].id);
      } else if (user.role === 'student') {
        const sc = await getStudentClass(user.id);
        if (sc) setMyClassId(sc.class_id);
      } else if (user.role === 'faculty') {
        setMyClassId('__faculty__');
      }
    } catch (e) {
      console.error('boot:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadDay = async () => {
    if (!template) return;
    const dayName = DAYS_FULL[(selectedDate.getDay() + 6) % 7];
    const dayObj = days.find((d) => d.day_name === dayName);
    if (!dayObj) { setMasterEntries([]); setDailyEntries([]); setDailyRecord(null); return; }

    const classId = isAdmin ? selectedClassId : myClassId;

    if (classId && classId !== '__faculty__') {
      setMasterEntries(await getDayEntries(template.id, dayObj.id, classId));
    } else if (classId === '__faculty__') {
      const all = await getFacultyEntries(template.id, user.id);
      setMasterEntries(all.filter((e) => e.timetable_days?.day_name === dayName));
    }

    const record = await getDailyRecord(user.school_id, fmtDate(selectedDate));
    setDailyRecord(record);
    if (record && classId && classId !== '__faculty__') {
      setDailyEntries(await getDailyEntries(record.id, classId));
    } else {
      setDailyEntries([]);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDay();
    setRefreshing(false);
  }, [selectedDate, template, days, selectedClassId, myClassId]);

  const shiftWeek = (dir) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + dir * 7);
    setSelectedDate(d);
  };

  // ─── Admin: Create Snapshot (draft) ───────
  const handleCreateSnapshot = async () => {
    if (!template || !session) return;
    const dayName = DAYS_FULL[(selectedDate.getDay() + 6) % 7];
    const dayObj = days.find((d) => d.day_name === dayName);
    if (!dayObj) return Alert.alert('Error', 'No timetable configured for this day.');

    setSnapshotting(true);
    try {
      const record = await createDailyRecordDraft({
        schoolId: user.school_id, sessionId: session.id,
        templateId: template.id, date: fmtDate(selectedDate),
        dayId: dayObj.id, createdBy: user.id,
      });
      if (!record) return Alert.alert('Error', 'Could not create. May already exist.');
      await snapshotAllClassesToDaily(record.id, template.id, dayObj.id, classes.map((c) => c.id));
      Alert.alert('Snapshot Created', 'Draft timetable ready. Review & publish.');
      await loadDay();
    } catch (err) { Alert.alert('Error', err.message); }
    finally { setSnapshotting(false); }
  };

  // ─── Admin: Publish ───────────────────────
  const handlePublish = () => {
    if (!dailyRecord) return;
    Alert.alert('Publish Timetable', 'Publish for all classes?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Publish', onPress: async () => {
        setPublishing(true);
        try {
          await publishDailyRecord(dailyRecord.id);
          Alert.alert('Published', 'Timetable is now live.');
          await loadDay();
        } catch (err) { Alert.alert('Error', err.message); }
        finally { setPublishing(false); }
      }},
    ]);
  };

  // ─── Cancel a period ──────────────────────
  const handleCancelPeriod = (entryId) => {
    Alert.alert('Cancel Period', 'Mark this period as cancelled?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes, Cancel', style: 'destructive', onPress: async () => {
        await updateDailyEntry(entryId, { status: 'cancelled' });
        await loadDay();
      }},
    ]);
  };

  // ─── Substitute: open picker ──────────────
  const handleOpenSubstitute = (entry) => {
    setSubTarget(entry);
    setSubModalVisible(true);
  };

  const handleSelectSubstitute = async (faculty) => {
    if (!subTarget) return;
    setSubModalVisible(false);
    await updateDailyEntry(subTarget.entryId, {
      actual_faculty_id: faculty.id,
      status: 'substituted',
    });
    setSubTarget(null);
    await loadDay();
  };

  // ─── Restore (undo cancel / substitute) ───
  const handleRestore = async (entry) => {
    if (!entry.entryId) return;
    // Find original from dailyEntries
    const de = dailyEntries.find((e) => e.id === entry.entryId);
    if (!de) return;
    await updateDailyEntry(entry.entryId, {
      actual_faculty_id: de.original_faculty_id,
      actual_subject_id: de.original_subject_id,
      status: 'as_planned',
    });
    await loadDay();
  };

  // ─── Build display slots ─────────────────
  const displaySlots = useMemo(() => {
    if (!slots.length) return [];
    const useDaily = dailyEntries.length > 0;
    const src = useDaily ? dailyEntries : masterEntries;

    return slots.map((slot) => {
      if (slot.slot_type === 'short_break' || slot.slot_type === 'lunch_break') {
        return { ...slot, type: slot.slot_type };
      }
      const entry = src.find((e) => (e.slot_id || e.timetable_slots?.id) === slot.id);
      return {
        ...slot,
        type: 'period',
        subject: useDaily
          ? (entry?.actual_subject_name || entry?.original_subject_name || '—')
          : (entry?.subject_name || '—'),
        teacher: useDaily
          ? (entry?.actual_faculty_name || entry?.original_faculty_name || '—')
          : (entry?.faculty_name || '—'),
        room: entry?.room || '',
        status: useDaily ? entry?.status : null,
        className: entry?.classes ? `${entry.classes.class_name} ${entry.classes.section || ''}`.trim() : '',
        entryId: entry?.id,
      };
    });
  }, [slots, masterEntries, dailyEntries]);

  // Can we edit periods? Only when a daily record exists (draft or published) and user is admin
  const canEdit = isAdmin && dailyRecord != null;

  // ═══════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════
  if (loading) {
    return (
      <View style={s.root}>
        <Header title="Manage Timetable" onMenuPress={openSideNav} showBack onBackPress={() => router.back()} />
        <View style={s.center}>
          <ActivityIndicator size="large" color={C.accent} />
          <Text style={s.mutedText}>Loading timetable…</Text>
        </View>
      </View>
    );
  }

  if (!template) {
    return (
      <View style={s.root}>
        <Header title="Manage Timetable" onMenuPress={openSideNav} showBack onBackPress={() => router.back()} />
        <View style={s.center}>
          <IconSymbol name="calendar" size={44} color={C.dim} />
          <Text style={s.emptyTitle}>No Timetable Found</Text>
          <Text style={s.mutedText}>No active template for this session.</Text>
        </View>
      </View>
    );
  }

  const isDraft = dailyRecord?.status === 'draft';
  const isPublished = dailyRecord?.status === 'published';
  const noRecord = !dailyRecord;

  return (
    <View style={s.root}>
      <Header title="Manage Timetable" onMenuPress={openSideNav} showBack onBackPress={() => router.back()} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollInner}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Week Nav */}
        <View style={s.weekRow}>
          <TouchableOpacity onPress={() => shiftWeek(-1)} style={s.arrowBtn}><IconSymbol name="chevron.left" size={16} color={C.text} /></TouchableOpacity>
          <TouchableOpacity onPress={() => setSelectedDate(new Date())} style={s.todayPill}><Text style={s.todayPillText}>Today</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => shiftWeek(1)} style={s.arrowBtn}><IconSymbol name="chevron.right" size={16} color={C.text} /></TouchableOpacity>
        </View>

        {/* Date Strip */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.dateStripContent}>
          {weekDates.map((dt, i) => {
            const sel = isSameDay(dt, selectedDate);
            const today = isSameDay(dt, new Date());
            return (
              <TouchableOpacity key={i} style={[s.dateChip, sel && s.dateChipActive]} onPress={() => setSelectedDate(new Date(dt))}>
                <Text style={[s.dateChipDay, sel && s.dateChipDayActive]}>{DAYS_SHORT[i]}</Text>
                <Text style={[s.dateChipNum, sel && s.dateChipNumActive]}>{dt.getDate()}</Text>
                {today && <View style={[s.todayDot, sel && { backgroundColor: '#fff' }]} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={s.dayLabel}>{fmtDisplay(selectedDate)}</Text>

        {/* Admin: Class Chips */}
        {isAdmin && classes.length > 0 && (
          <View style={s.chipRow}>
            <Text style={s.chipRowLabel}>CLASS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {classes.map((cls) => (
                <TouchableOpacity key={cls.id} style={[s.chip, selectedClassId === cls.id && s.chipActive]} onPress={() => setSelectedClassId(cls.id)}>
                  <Text style={[s.chipText, selectedClassId === cls.id && s.chipTextActive]}>{cls.class_name} {cls.section || ''}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Admin Action Bar */}
        {isAdmin && (
          <View style={s.adminBar}>
            {noRecord && (
              <TouchableOpacity style={s.actionBtn} onPress={handleCreateSnapshot} disabled={snapshotting}>
                {snapshotting
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <><IconSymbol name="calendar" size={15} color="#fff" /><Text style={s.actionBtnText}>Create Today's Snapshot</Text></>}
              </TouchableOpacity>
            )}
            {isDraft && (
              <View style={s.draftBar}>
                <View style={s.draftBadge}>
                  <View style={[s.statusDot, { backgroundColor: C.amber }]} />
                  <Text style={s.draftBadgeText}>Draft — Edit periods below, then publish</Text>
                </View>
                <TouchableOpacity style={[s.actionBtn, { backgroundColor: C.green }]} onPress={handlePublish} disabled={publishing}>
                  {publishing
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <><IconSymbol name="checkmark.circle.fill" size={15} color="#fff" /><Text style={s.actionBtnText}>Publish</Text></>}
                </TouchableOpacity>
              </View>
            )}
            {isPublished && (
              <View style={s.publishedBadge}>
                <IconSymbol name="checkmark.circle.fill" size={14} color={C.green} />
                <Text style={s.publishedText}>Published — You can still edit periods</Text>
              </View>
            )}
          </View>
        )}

        {/* Slots */}
        {displaySlots.length === 0 ? (
          <View style={s.emptyBox}>
            <IconSymbol name="calendar" size={32} color={C.dim} />
            <Text style={s.mutedText}>No periods scheduled</Text>
          </View>
        ) : (
          displaySlots.map((slot, idx) => (
            <SlotCard
              key={slot.id || idx}
              slot={slot}
              canEdit={canEdit}
              onCancel={() => handleCancelPeriod(slot.entryId)}
              onSubstitute={() => handleOpenSubstitute(slot)}
              onRestore={() => handleRestore(slot)}
            />
          ))
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ── Substitute Faculty Picker Modal ── */}
      <Modal visible={subModalVisible} transparent animationType="slide" onRequestClose={() => setSubModalVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Select Substitute Faculty</Text>
              <TouchableOpacity onPress={() => setSubModalVisible(false)}>
                <IconSymbol name="xmark" size={18} color={C.muted} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={facultyList}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={s.facultyRow} onPress={() => handleSelectSubstitute(item)} activeOpacity={0.6}>
                  <View style={s.facultyAvatar}>
                    <Text style={s.facultyAvatarText}>{item.full_name?.[0] || '?'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.facultyName}>{item.full_name}</Text>
                    <Text style={s.facultyEmail}>{item.email}</Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={s.mutedText}>No faculty found</Text>}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ═══════════════════════════════════════════
//  SLOT CARD (with actions)
// ═══════════════════════════════════════════
function SlotCard({ slot, canEdit, onCancel, onSubstitute, onRestore }) {
  if (slot.type === 'short_break') {
    return (
      <View style={s.breakRow}>
        <View style={[s.breakDot, { backgroundColor: C.purple }]} />
        <Text style={[s.breakText, { color: C.purple }]}>{slot.label}</Text>
        <Text style={s.breakTime}>{slot.start_time?.slice(0, 5)} – {slot.end_time?.slice(0, 5)}</Text>
      </View>
    );
  }
  if (slot.type === 'lunch_break') {
    return (
      <View style={[s.breakRow, { backgroundColor: C.orangeDim }]}>
        <View style={[s.breakDot, { backgroundColor: C.orange }]} />
        <Text style={[s.breakText, { color: C.orange }]}>{slot.label}</Text>
        <Text style={s.breakTime}>{slot.start_time?.slice(0, 5)} – {slot.end_time?.slice(0, 5)}</Text>
      </View>
    );
  }

  const st = slot.status ? STATUS_MAP[slot.status] : null;
  const isCancelled = slot.status === 'cancelled';
  const isSubstituted = slot.status === 'substituted';

  return (
    <View style={s.card}>
      <View style={s.timeCol}>
        <Text style={s.timeStart}>{slot.start_time?.slice(0, 5)}</Text>
        <View style={s.timeLine} />
        <Text style={s.timeEnd}>{slot.end_time?.slice(0, 5)}</Text>
      </View>

      <View style={s.cardBody}>
        <View style={s.cardHeaderRow}>
          <Text style={s.slotLabel}>{slot.label}</Text>
          <Text style={s.slotDuration}>{slot.duration_minutes}m</Text>
        </View>

        <Text style={[s.subjectText, isCancelled && { textDecorationLine: 'line-through', color: C.dim }]}>
          {slot.subject}
        </Text>

        <View style={s.metaRow}>
          {slot.teacher && slot.teacher !== '—' && (
            <View style={s.metaItem}>
              <IconSymbol name="person.fill" size={11} color={C.muted} />
              <Text style={s.metaText}>{slot.teacher}</Text>
            </View>
          )}
          {slot.room ? (
            <View style={s.metaItem}>
              <IconSymbol name="building.2" size={11} color={C.muted} />
              <Text style={s.metaText}>{slot.room}</Text>
            </View>
          ) : null}
          {slot.className ? (
            <View style={s.metaItem}>
              <IconSymbol name="graduationcap.fill" size={11} color={C.muted} />
              <Text style={s.metaText}>{slot.className}</Text>
            </View>
          ) : null}
        </View>

        {st && (
          <View style={[s.stBadge, { backgroundColor: st.bg }]}>
            <IconSymbol name={st.icon} size={11} color={st.color} />
            <Text style={[s.stBadgeText, { color: st.color }]}>{st.label}</Text>
          </View>
        )}

        {/* ── Action buttons ── */}
        {canEdit && slot.entryId && (
          <View style={s.actionsRow}>
            {(isCancelled || isSubstituted) ? (
              <TouchableOpacity style={[s.actionPill, { backgroundColor: C.accentDim }]} onPress={onRestore} activeOpacity={0.6}>
                <IconSymbol name="arrow.counterclockwise" size={12} color={C.accent} />
                <Text style={[s.actionPillText, { color: C.accent }]}>Restore</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity style={[s.actionPill, { backgroundColor: C.amberDim }]} onPress={onSubstitute} activeOpacity={0.6}>
                  <IconSymbol name="person.fill" size={12} color={C.amber} />
                  <Text style={[s.actionPillText, { color: C.amber }]}>Substitute</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.actionPill, { backgroundColor: C.redDim }]} onPress={onCancel} activeOpacity={0.6}>
                  <IconSymbol name="xmark.circle.fill" size={12} color={C.red} />
                  <Text style={[s.actionPillText, { color: C.red }]}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════
//  STYLES
// ═══════════════════════════════════════════
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  scrollInner: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  mutedText: { fontSize: 13, color: C.muted, textAlign: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: C.text, marginTop: 8 },

  weekRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 10 },
  arrowBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  todayPill: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 14, backgroundColor: C.accentDim },
  todayPillText: { fontSize: 13, fontWeight: '600', color: C.accent },

  dateStripContent: { gap: 6, paddingVertical: 4, paddingHorizontal: 2 },
  dateChip: { width: 44, height: 64, borderRadius: 20, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', gap: 1 },
  dateChipActive: { backgroundColor: C.accent },
  dateChipDay: { fontSize: 10, fontWeight: '500', color: C.muted },
  dateChipDayActive: { color: 'rgba(255,255,255,0.75)' },
  dateChipNum: { fontSize: 16, fontWeight: '700', color: C.text },
  dateChipNumActive: { color: '#fff' },
  todayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.accent },

  dayLabel: { fontSize: 14, fontWeight: '600', color: C.text, marginTop: 10, marginBottom: 12 },

  chipRow: { marginBottom: 12, gap: 6 },
  chipRowLabel: { fontSize: 10, fontWeight: '600', color: C.dim, letterSpacing: 1 },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14, backgroundColor: C.surface, marginRight: 6 },
  chipActive: { backgroundColor: C.accent },
  chipText: { fontSize: 12, fontWeight: '500', color: C.muted },
  chipTextActive: { color: '#fff' },

  adminBar: { marginBottom: 14 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: C.accent, paddingVertical: 11, borderRadius: 10 },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  draftBar: { gap: 10 },
  draftBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.amberDim, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  draftBadgeText: { fontSize: 12, color: C.amber, fontWeight: '500' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  publishedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.greenDim, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  publishedText: { fontSize: 12, fontWeight: '500', color: C.green },

  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 8 },

  // Card
  card: { flexDirection: 'row', backgroundColor: C.surface, borderRadius: 12, marginBottom: 8, overflow: 'hidden' },
  timeCol: { width: 48, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, backgroundColor: C.surfaceAlt },
  timeStart: { fontSize: 10, fontWeight: '600', color: C.accent },
  timeLine: { width: 1, flex: 1, backgroundColor: C.border, marginVertical: 3 },
  timeEnd: { fontSize: 9, color: C.dim },
  cardBody: { flex: 1, paddingHorizontal: 12, paddingVertical: 10, gap: 4 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  slotLabel: { fontSize: 10, fontWeight: '500', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.4 },
  slotDuration: { fontSize: 9, color: C.dim },
  subjectText: { fontSize: 15, fontWeight: '600', color: C.text },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 2 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 11, color: C.muted },

  stBadge: { flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5, marginTop: 2 },
  stBadgeText: { fontSize: 10, fontWeight: '500' },

  // Action pills
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  actionPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  actionPillText: { fontSize: 11, fontWeight: '600' },

  // Breaks
  breakRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 14, marginBottom: 8, borderRadius: 8, backgroundColor: C.purpleDim },
  breakDot: { width: 6, height: 6, borderRadius: 3 },
  breakText: { flex: 1, fontSize: 12, fontWeight: '500' },
  breakTime: { fontSize: 10, color: C.dim },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: C.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '60%', paddingBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  modalTitle: { fontSize: 15, fontWeight: '600', color: C.text },
  facultyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border },
  facultyAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  facultyAvatarText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  facultyName: { fontSize: 14, fontWeight: '500', color: C.text },
  facultyEmail: { fontSize: 11, color: C.muted },
});
