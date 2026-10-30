import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { IconSymbol } from '../../components/IconSymbol';
import { supabase } from '../../utils/supabase';
const { MONTHS, monthCells, attendanceSummary } = require('../../services/dashboardMetrics');

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const initialStats = { students: 0, faculty: 0, schoolAverage: 0, studentsAtRisk: 0 };

function shortName(name) {
  return name?.trim().split(/\s+/)[0] || 'Admin';
}

function CountCard({ icon, tone, label, value, detail }) {
  return (
    <View style={styles.countCard}>
      <View style={[styles.countIcon, { backgroundColor: tone.background }]}>
        <IconSymbol name={icon} size={25} color={tone.color} />
      </View>
      <View style={styles.countText}>
        <Text style={styles.countLabel}>{label}</Text>
        <Text style={styles.countValue}>{value}</Text>
        {detail ? <Text style={styles.countDetail}>{detail}</Text> : null}
      </View>
    </View>
  );
}

function PerformanceChart({ label, values }) {
  const hasData = values.some(value => typeof value === 'number');
  return (
    <View accessible accessibilityLabel={`${label}. ${hasData ? 'Attendance data chart.' : 'No attendance data recorded yet.'}`} style={[styles.chartWrap, !hasData && styles.chartWrapEmpty]}>
      {hasData ? <View style={styles.barChart}>{values.map((value, index) => <View key={MONTHS[index]} style={styles.barColumn}><View style={styles.barTrack}>{typeof value === 'number' ? <View style={[styles.bar, { height: `${Math.max(value, 4)}%` }]} /> : <View style={styles.missingBar} />}</View><Text style={styles.barLabel}>{MONTHS[index]}</Text></View>)}</View> : <View style={styles.noDataChart}><View style={styles.emptyLine} /><Text style={styles.chartEmptyText}>No attendance data yet</Text></View>}
    </View>
  );
}

function PerformanceCard({ title, subtitle, values }) {
  const { width } = useWindowDimensions();
  const isCompact = width < 390;
  return (
    <View style={styles.performanceCard}>
      <View style={[styles.performanceHeading, isCompact && styles.performanceHeadingCompact]}>
        <View style={styles.performanceCopy}><Text style={styles.performanceTitle}>{title}</Text><Text style={styles.performanceSubtitle}>{subtitle}</Text></View>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Open attendance" onPress={() => router.push('/attendance')} style={[styles.viewButton, isCompact && styles.viewButtonCompact]}>
          <Text numberOfLines={1} style={styles.viewButtonText}>Attendance</Text>
          <IconSymbol name="chevron.right" size={16} color="#1769c2" />
        </TouchableOpacity>
      </View>
      <PerformanceChart label={title} values={values} />
    </View>
  );
}

export default function SuperAdminDashboard({ user, school }) {
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const [stats, setStats] = useState(initialStats);
  const [classPerformance, setClassPerformance] = useState(Array(12).fill(null));
  const [teacherPerformance, setTeacherPerformance] = useState(Array(12).fill(null));
  const [events, setEvents] = useState([]);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const loadDashboard = useCallback(async () => {
    if (!user?.school_id) return;
    try {
      const [students, faculty, studentAttendance, facultyAttendance, eventResult] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('school_id', user.school_id).eq('role', 'student'),
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('school_id', user.school_id).eq('role', 'faculty'),
        supabase.from('student_attendance_v2').select('status, student_id, attendance_date').eq('school_id', user.school_id).limit(1000),
        supabase.from('faculty_attendance').select('status, attendance_date').eq('school_id', user.school_id).limit(1000),
        supabase.from('events').select('id, title, location, start_date, start_time, end_time').eq('school_id', user.school_id).order('start_date', { ascending: true }).limit(3),
      ]);
      const studentSummary = attendanceSummary(studentAttendance.data, ['present', 'half_day']);
      const facultySummary = attendanceSummary(facultyAttendance.data, ['present']);
      setStats({
        students: students.error ? 0 : students.count || 0,
        faculty: faculty.error ? 0 : faculty.count || 0,
        schoolAverage: studentSummary.average,
        studentsAtRisk: studentSummary.atRisk,
      });
      setClassPerformance(studentSummary.monthly);
      setTeacherPerformance(facultySummary.monthly);
      setEvents(eventResult.error ? [] : eventResult.data || []);
    } catch {
      // Keep the zero-value dashboard visible when the optional analytics tables are unavailable.
    }
  }, [user?.school_id]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const calendar = useMemo(() => monthCells(calendarMonth), [calendarMonth]);
  const today = new Date();
  const currentMonth = today.getFullYear() === calendarMonth.getFullYear() && today.getMonth() === calendarMonth.getMonth();
  const eventDates = new Set(events.map(event => event.start_date?.slice(0, 10)).filter(Boolean));
  const layout = isWide ? styles.wideColumns : styles.narrowColumns;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.page, isWide && styles.pageWide]}>
        <View style={layout}>
          <View style={[styles.primaryColumn, !isWide && styles.primaryColumnNarrow]}>
            <View style={styles.welcomeCard}>
              <View style={styles.welcomeCopy}>
                <Text style={styles.greeting}>Good morning, {shortName(user?.full_name)}</Text>
                <Text style={styles.wave}>👋</Text>
                <Text style={styles.welcomeText}>Here’s how {school?.school_name || 'your school'} is performing today.</Text>
              </View>
              <View style={styles.welcomeArt}><IconSymbol name="graduationcap.fill" size={52} color="#4f46e5" /><IconSymbol name="chart.line.uptrend.xyaxis" size={27} color="#f97316" style={styles.artAccent} /></View>
              <View style={styles.countGrid}>
                <CountCard icon="person.3.fill" tone={{ background: '#eaf3ff', color: '#2878dd' }} label="Students" value={stats.students} />
                <CountCard icon="graduationcap.fill" tone={{ background: '#f2ebff', color: '#8758f4' }} label="Teachers" value={stats.faculty} />
                <CountCard icon="building.2.fill" tone={{ background: '#e7f8f0', color: '#1bb66a' }} label="School average" value={`${stats.schoolAverage}%`} detail={stats.schoolAverage === 0 ? 'Set up attendance' : null} />
                <CountCard icon="exclamationmark.triangle.fill" tone={{ background: '#fff4df', color: '#f59e0b' }} label="Students at risk" value={stats.studentsAtRisk} detail={stats.schoolAverage === 0 ? 'Set up attendance' : null} />
              </View>
            </View>
            <PerformanceCard title="Class performance" subtitle="Monthly attendance & academic health score" values={classPerformance} />
            <PerformanceCard title="Teacher performance" subtitle="Faculty attendance & teaching engagement index" values={teacherPerformance} />
          </View>

          <View style={[styles.sideColumn, isWide && styles.sideColumnWide]}>
            <View style={styles.calendarCard}>
              <View style={styles.calendarHeader}>
                <TouchableOpacity accessibilityRole="button" accessibilityLabel="Previous month" style={styles.calendarNavButton} onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}><IconSymbol name="chevron.left" size={22} color="#6880a1" /></TouchableOpacity>
                <Text style={styles.calendarTitle}>{calendarMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</Text>
                <TouchableOpacity accessibilityRole="button" accessibilityLabel="Next month" style={styles.calendarNavButton} onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}><IconSymbol name="chevron.right" size={22} color="#6880a1" /></TouchableOpacity>
              </View>
              <View style={styles.weekRow}>{WEEKDAYS.map(day => <Text key={day} style={styles.weekDay}>{day}</Text>)}</View>
              <View style={styles.calendarGrid}>{calendar.map((day, index) => {
                const isToday = currentMonth && day === today.getDate();
                const dateKey = day ? `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : null;
                return <View key={`${index}-${day || 'blank'}`} style={styles.dayCell}>{day ? <><Text style={[styles.dayText, isToday && styles.today]}>{day}</Text>{eventDates.has(dateKey) ? <View style={styles.eventDot} /> : null}</> : null}</View>;
              })}</View>
            </View>
            <View style={styles.eventsCard}>
              <View style={styles.eventsHeader}><Text style={styles.eventsTitle}>Upcoming Events</Text><TouchableOpacity accessibilityRole="button" onPress={() => router.push('/daily-calendar')}><Text style={styles.eventsLink}>Calendar</Text></TouchableOpacity></View>
              {events.length ? events.map(event => <View key={event.id} style={styles.eventItem}><View style={styles.eventMeta}><Text style={styles.eventLocation}>{event.location || 'School event'}</Text><Text style={styles.eventDate}>{event.start_date ? new Date(event.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Upcoming'}</Text></View><Text style={styles.eventName} numberOfLines={1}>{event.title || 'School Event'}</Text><Text style={styles.eventTime}>{event.start_time || 'Time to be confirmed'}{event.end_time ? ` – ${event.end_time}` : ''}</Text></View>) : <View style={styles.emptyEvents}><IconSymbol name="calendar" size={24} color="#9aabc4" /><Text style={styles.eventsEmptyText}>No upcoming events scheduled yet</Text><TouchableOpacity accessibilityRole="button" onPress={() => router.push('/daily-calendar')} style={styles.createEvent}><IconSymbol name="plus" size={17} color="#e85d12" /><Text style={styles.createEventText}>Plan the school day</Text></TouchableOpacity></View>}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f6f9fd' },
  page: { width: '100%', alignSelf: 'center', padding: 18, paddingBottom: 120 },
  pageWide: { maxWidth: 1540, padding: 32 },
  wideColumns: { flexDirection: 'row', gap: 28, alignItems: 'flex-start' },
  narrowColumns: { flexDirection: 'column', alignItems: 'stretch', gap: 20 },
  primaryColumn: { flex: 1, minWidth: 0, gap: 24 }, primaryColumnNarrow: { flexGrow: 0, flexShrink: 0, width: '100%' },
  sideColumn: { position: 'relative', width: '100%', gap: 24 }, sideColumnWide: { width: 430, maxWidth: '34%' },
  welcomeCard: { borderWidth: 1, borderColor: '#e2eaf5', borderRadius: 20, backgroundColor: '#fff', padding: 24, shadowColor: '#102a4c', shadowOpacity: 0.06, shadowRadius: 12, elevation: 2 },
  welcomeCopy: { paddingRight: 66 }, greeting: { color: '#0e1f3d', fontSize: 27, lineHeight: 33, fontWeight: '800', letterSpacing: -0.5 }, wave: { fontSize: 24, marginTop: 2 }, welcomeText: { color: '#6880a1', fontSize: 15, lineHeight: 22, marginTop: 8, maxWidth: 520 },
  welcomeArt: { position: 'absolute', right: 24, top: 26, width: 64, height: 64, borderRadius: 32, backgroundColor: '#f0edff', alignItems: 'center', justifyContent: 'center' }, artAccent: { position: 'absolute', right: -7, bottom: -4 },
  countGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 24 }, countCard: { minWidth: 0, flexGrow: 1, flexBasis: '47%', flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1, borderColor: '#e7edf6', borderRadius: 14, padding: 11, backgroundColor: '#fff', shadowColor: '#102a4c', shadowOpacity: 0.05, shadowRadius: 7, elevation: 1 }, countIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12 }, countText: { flex: 1, minWidth: 0 }, countLabel: { color: '#7085a4', fontWeight: '600', fontSize: 12, lineHeight: 16 }, countValue: { color: '#0e1f3d', fontWeight: '800', fontSize: 24, lineHeight: 29, marginTop: 1 }, countDetail: { color: '#9aabc4', fontSize: 10, lineHeight: 13, marginTop: 2 },
  performanceCard: { borderWidth: 1, borderColor: '#e2eaf5', borderRadius: 20, backgroundColor: '#fff', padding: 24, shadowColor: '#102a4c', shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 }, performanceHeading: { flexDirection: 'row', gap: 10, justifyContent: 'space-between', alignItems: 'flex-start' }, performanceHeadingCompact: { flexDirection: 'column' }, performanceCopy: { flex: 1, minWidth: 0 }, performanceTitle: { color: '#0e1f3d', fontSize: 20, lineHeight: 25, fontWeight: '800' }, performanceSubtitle: { color: '#8aa0c0', fontSize: 13, lineHeight: 18, marginTop: 3 }, viewButton: { flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 1, borderWidth: 1, borderColor: '#dbe7f5', paddingHorizontal: 9, paddingVertical: 7, borderRadius: 9 }, viewButtonCompact: { alignSelf: 'flex-start' }, viewButtonText: { color: '#1769c2', fontSize: 12, fontWeight: '700' },
  chartWrap: { marginTop: 16, minHeight: 174 }, chartWrapEmpty: { minHeight: 82 }, barChart: { height: 174, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: '#e8eef8', paddingHorizontal: 2 }, barColumn: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end' }, barTrack: { width: '72%', height: 142, justifyContent: 'flex-end', backgroundColor: '#f7f9fc', borderRadius: 4, overflow: 'hidden' }, bar: { width: '100%', backgroundColor: '#ff7a36', borderRadius: 4 }, missingBar: { height: 2, width: '100%', backgroundColor: '#dce6f3' }, barLabel: { color: '#8aa0c0', fontSize: 9, marginTop: 8 }, noDataChart: { height: 82, justifyContent: 'center', alignItems: 'center', borderBottomWidth: 1, borderColor: '#e8eef8' }, emptyLine: { position: 'absolute', left: 0, right: 0, borderTopWidth: 2, borderStyle: 'dashed', borderColor: '#ff8d55' }, chartEmptyText: { color: '#8aa0c0', fontSize: 12, backgroundColor: '#fff', paddingHorizontal: 10 },
  calendarCard: { width: '100%', borderWidth: 1, borderColor: '#e2eaf5', borderRadius: 22, backgroundColor: '#fff', padding: 24, shadowColor: '#102a4c', shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 }, calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }, calendarNavButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }, calendarTitle: { color: '#203451', fontSize: 17, fontWeight: '800' }, weekRow: { flexDirection: 'row' }, weekDay: { width: '14.285%', textAlign: 'center', color: '#9aabc4', fontSize: 11, fontWeight: '700', marginBottom: 10 }, calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' }, dayCell: { width: '14.285%', height: 36, alignItems: 'center', justifyContent: 'center', position: 'relative' }, dayText: { color: '#405675', fontSize: 13, fontWeight: '600', width: 30, height: 30, textAlign: 'center', lineHeight: 30 }, today: { color: '#e85d12', borderWidth: 2, borderColor: '#ff762b', borderRadius: 8, fontWeight: '800' }, eventDot: { position: 'absolute', bottom: 1, width: 4, height: 4, borderRadius: 2, backgroundColor: '#e85d12' },
  eventsCard: { width: '100%', borderWidth: 1, borderColor: '#e2eaf5', borderRadius: 22, backgroundColor: '#fff', padding: 24, shadowColor: '#102a4c', shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 }, eventsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, eventsTitle: { color: '#0e1f3d', fontSize: 19, fontWeight: '800' }, eventsLink: { color: '#e85d12', fontSize: 13, fontWeight: '700' }, emptyEvents: { borderWidth: 1, borderColor: '#dce7f5', borderStyle: 'dashed', borderRadius: 14, alignItems: 'center', padding: 24, marginTop: 20 }, eventsEmptyText: { color: '#7890af', textAlign: 'center', fontSize: 13, marginTop: 10 }, createEvent: { flexDirection: 'row', gap: 5, alignItems: 'center', marginTop: 13 }, createEventText: { color: '#e85d12', fontSize: 13, fontWeight: '800' }, eventItem: { borderWidth: 1, borderColor: '#e5edf8', borderRadius: 12, marginTop: 13, padding: 12 }, eventMeta: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 }, eventLocation: { color: '#e85d12', fontSize: 11, fontWeight: '700', flexShrink: 1 }, eventDate: { color: '#8aa0c0', fontSize: 11, fontWeight: '700' }, eventName: { color: '#0e1f3d', fontSize: 14, fontWeight: '800', marginTop: 6 }, eventTime: { color: '#8aa0c0', fontSize: 11, marginTop: 4 },
});
