/**
 * iGyan App — Daily Timetable (Read-Only)
 *
 * Shows the published daily snapshot for the selected date.
 * No edit/cancel/substitute actions — view-only.
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
} from 'react-native';
import Header from '../../components/Header';
import { IconSymbol } from '../../components/IconSymbol';
import { useSideNav } from '../../utils/SideNavContext';
import { useAuth } from '../../utils/AuthContext';
import {
  getActiveSession,
  getActiveTemplate,
  getTemplateSlots,
  getTemplateDays,
  getDailyRecord,
  getDailyEntries,
  getSchoolClasses,
  getStudentClass,
} from '../../services/timetableService';

const ADMIN_ROLES = ['super_admin', 'co_admin'];
const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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
export default function DailyTimetablePage() {
  const { openSideNav } = useSideNav();
  const { user } = useAuth();
  const isAdmin = ADMIN_ROLES.includes(user?.role);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekDates, setWeekDates] = useState(getWeekDates(new Date()));

  const [template, setTemplate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [days, setDays] = useState([]);
  const [dailyRecord, setDailyRecord] = useState(null);
  const [dailyEntries, setDailyEntries] = useState([]);

  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [myClassId, setMyClassId] = useState(null);

  const [loadError, setLoadError] = useState('');

  // Boot
  const boot = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      if (!user?.school_id) return;
      const sess = await getActiveSession(user.school_id);
      if (!sess) return;

      const tmpl = await getActiveTemplate(user.school_id, sess.id);
      setTemplate(tmpl);
      if (!tmpl) return;

      const [sl, dy] = await Promise.all([getTemplateSlots(tmpl.id), getTemplateDays(tmpl.id)]);
      setSlots(sl);
      setDays(dy);

      if (isAdmin) {
        const cls = await getSchoolClasses(user.school_id);
        setClasses(cls);
        if (cls.length > 0) setSelectedClassId(cls[0].id);
      } else if (user.role === 'student') {
        const sc = await getStudentClass(user.id);
        if (sc) setMyClassId(sc.class_id);
      }
    } catch (e) {
      console.error('DailyTimetable boot:', e);
      setLoadError('Could not load the timetable. Check your connection and try again.');
    }
    finally { setLoading(false); }
  }, [user?.school_id, user?.id, user?.role, isAdmin]);

  useEffect(() => { boot(); }, [boot]);
  useEffect(() => { setWeekDates(getWeekDates(selectedDate)); }, [selectedDate]);

  const loadDay = useCallback(async () => {
    if (!template) return;
    const classId = isAdmin ? selectedClassId : myClassId;
    if (!classId) return;

    try {
      // Only fetch published records
      const record = await getDailyRecord(user.school_id, fmtDate(selectedDate));
      setDailyRecord(record);

      if (record && record.status === 'published') {
        setDailyEntries(await getDailyEntries(record.id, classId));
      } else {
        setDailyEntries([]);
      }
      setLoadError('');
    } catch (e) {
      // A failed day-load must not masquerade as "not published".
      console.error('DailyTimetable loadDay:', e);
      setLoadError('Could not load this day. Check your connection and try again.');
    }
  }, [template, selectedDate, user?.school_id, isAdmin, selectedClassId, myClassId]);

  useEffect(() => {
    if (template && days.length > 0) loadDay();
  }, [template, days, loadDay]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadDay();
    } catch (e) {
      console.error('DailyTimetable refresh:', e);
      setLoadError('Could not refresh. Check your connection and try again.');
    } finally {
      setRefreshing(false);
    }
  }, [loadDay]);

  const shiftWeek = (dir) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + dir * 7);
    setSelectedDate(d);
  };

  const displaySlots = useMemo(() => {
    if (!slots.length || !dailyEntries.length) return [];

    return slots.map((slot) => {
      if (slot.slot_type === 'short_break' || slot.slot_type === 'lunch_break') {
        return { ...slot, type: slot.slot_type };
      }
      const entry = dailyEntries.find((e) => (e.slot_id || e.timetable_slots?.id) === slot.id);
      return {
        ...slot,
        type: 'period',
        subject: entry?.actual_subject_name || entry?.original_subject_name || '—',
        teacher: entry?.actual_faculty_name || entry?.original_faculty_name || '—',
        room: entry?.room || '',
        status: entry?.status || null,
      };
    });
  }, [slots, dailyEntries]);

  const isPublished = dailyRecord?.status === 'published';

  // ═══════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════
  if (loading) {
    return (
      <View style={s.root}>
        <Header title="Daily Timetable" onMenuPress={openSideNav} />
        <View style={s.center}>
          <ActivityIndicator size="large" color={C.accent} />
          <Text style={s.mutedText}>Loading…</Text>
        </View>
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={s.root}>
        <Header title="Daily Timetable" onMenuPress={openSideNav} />
        <View style={s.center}>
          <IconSymbol name="cloud.fill" size={44} color={C.dim} />
          <Text style={s.emptyTitle}>Could not load timetable</Text>
          <Text style={s.mutedText}>{loadError}</Text>
          <TouchableOpacity
            onPress={boot}
            style={s.retryBtn}
            accessibilityRole="button"
            accessibilityLabel="Try loading the timetable again"
          >
            <Text style={s.retryBtnText}>Try again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!template) {
    return (
      <View style={s.root}>
        <Header title="Daily Timetable" onMenuPress={openSideNav} />
        <View style={s.center}>
          <IconSymbol name="calendar" size={44} color={C.dim} />
          <Text style={s.emptyTitle}>No Timetable</Text>
          <Text style={s.mutedText}>No active template configured.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <Header title="Daily Timetable" onMenuPress={openSideNav} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollInner}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Week Nav */}
        <View style={s.weekRow}>
          <TouchableOpacity
            onPress={() => shiftWeek(-1)}
            style={s.arrowBtn}
            accessibilityRole="button"
            accessibilityLabel="Previous week"
          ><IconSymbol name="chevron.left" size={16} color={C.text} /></TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelectedDate(new Date())}
            style={s.todayPill}
            accessibilityRole="button"
            accessibilityLabel="Jump to today"
          ><Text style={s.todayPillText}>Today</Text></TouchableOpacity>
          <TouchableOpacity
            onPress={() => shiftWeek(1)}
            style={s.arrowBtn}
            accessibilityRole="button"
            accessibilityLabel="Next week"
          ><IconSymbol name="chevron.right" size={16} color={C.text} /></TouchableOpacity>
        </View>

        {/* Date Strip */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.dateStripContent}>
          {weekDates.map((dt, i) => {
            const sel = isSameDay(dt, selectedDate);
            const today = isSameDay(dt, new Date());
            return (
              <TouchableOpacity
                key={i}
                style={[s.dateChip, sel && s.dateChipActive]}
                onPress={() => setSelectedDate(new Date(dt))}
                accessibilityRole="radio"
                accessibilityState={{ checked: sel }}
                accessibilityLabel={`${DAYS_SHORT[i]}, ${dt.getDate()}`}
              >
                <Text style={[s.dateChipDay, sel && s.dateChipDayActive]}>{DAYS_SHORT[i]}</Text>
                <Text style={[s.dateChipNum, sel && s.dateChipNumActive]}>{dt.getDate()}</Text>
                {today && <View style={[s.todayDot, sel && { backgroundColor: '#fff' }]} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={s.dayLabel}>{fmtDisplay(selectedDate)}</Text>

        {/* Admin: class selector */}
        {isAdmin && classes.length > 0 && (
          <View style={s.chipRow}>
            <Text style={s.chipRowLabel}>Class</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {classes.map((cls) => (
                <TouchableOpacity
                  key={cls.id}
                  style={[s.chip, selectedClassId === cls.id && s.chipActive]}
                  onPress={() => setSelectedClassId(cls.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selectedClassId === cls.id }}
                  accessibilityLabel={`Class ${cls.class_name} ${cls.section || ''}`}
                >
                  <Text style={[s.chipText, selectedClassId === cls.id && s.chipTextActive]}>{cls.class_name} {cls.section || ''}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Status indicator */}
        {isPublished ? (
          <View style={s.publishedBadge}>
            <IconSymbol name="checkmark.circle.fill" size={14} color={C.green} />
            <Text style={s.publishedText}>Published Timetable</Text>
          </View>
        ) : (
          <View style={s.notPublishedBadge}>
            <IconSymbol name="clock.fill" size={14} color={C.muted} />
            <Text style={s.notPublishedText}>Timetable not yet published for this date</Text>
          </View>
        )}

        {/* Slots */}
        {displaySlots.length === 0 ? (
          <View style={s.emptyBox}>
            <IconSymbol name="calendar" size={32} color={C.dim} />
            <Text style={s.mutedText}>
              {isPublished ? 'No periods found' : 'Awaiting published timetable'}
            </Text>
          </View>
        ) : (
          displaySlots.map((slot, idx) => <ReadOnlySlotCard key={slot.id || idx} slot={slot} />)
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

// ═══════════════════════════════════════════
//  READ-ONLY SLOT CARD
// ═══════════════════════════════════════════
function ReadOnlySlotCard({ slot }) {
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
        </View>

        {st && (
          <View style={[s.stBadge, { backgroundColor: st.bg }]}>
            <IconSymbol name={st.icon} size={11} color={st.color} />
            <Text style={[s.stBadgeText, { color: st.color }]}>{st.label}</Text>
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
  arrowBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  todayPill: { paddingHorizontal: 16, paddingVertical: 7, minHeight: 44, justifyContent: 'center', borderRadius: 14, backgroundColor: C.accentDim },
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
  chipRowLabel: { fontSize: 12, fontWeight: '600', color: C.dim },
  chip: { paddingHorizontal: 14, paddingVertical: 6, minHeight: 44, justifyContent: 'center', borderRadius: 14, backgroundColor: C.surface, marginRight: 6 },
  retryBtn: { marginTop: 14, backgroundColor: C.accent, paddingHorizontal: 20, minHeight: 44, justifyContent: 'center', borderRadius: 8 },
  retryBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  chipActive: { backgroundColor: C.accent },
  chipText: { fontSize: 12, fontWeight: '500', color: C.muted },
  chipTextActive: { color: '#fff' },

  publishedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.greenDim, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginBottom: 14 },
  publishedText: { fontSize: 12, fontWeight: '500', color: C.green },
  notPublishedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(100,116,139,0.08)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginBottom: 14 },
  notPublishedText: { fontSize: 12, fontWeight: '500', color: C.muted },

  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 8 },

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

  breakRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 14, marginBottom: 8, borderRadius: 8, backgroundColor: C.purpleDim },
  breakDot: { width: 6, height: 6, borderRadius: 3 },
  breakText: { flex: 1, fontSize: 12, fontWeight: '500' },
  breakTime: { fontSize: 10, color: C.dim },
});
