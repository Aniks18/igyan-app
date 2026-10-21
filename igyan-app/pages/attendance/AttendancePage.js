/**
 * iGyan App - Smart Attendance System
 * Mark attendance, track patterns, and send alerts
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import { IconSymbol } from '../../components/IconSymbol';
import Header from '../../components/Header';
import { useThemeColor } from '../../hooks/useThemeColor';
import { useSideNav } from '../../utils/SideNavContext';
import { useAuth } from '../../utils/AuthContext';
import { supabase } from '../../utils/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function AttendancePage() {
  const { openSideNav } = useSideNav();
  const { user } = useAuth();
  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');
  const mutedColor = useThemeColor({}, 'icon');

  // State
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState({});
  const [showStats, setShowStats] = useState(false);
  const [absenteeAlerts, setAbsenteeAlerts] = useState([]);
  const [view, setView] = useState('mark'); // 'mark' or 'history'
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Demo data for testing (remove when Supabase is connected)
  const demoStudents = [
    { id: '1', profileId: 'p1', regNo: 'STU001', name: 'Aarav Sharma', email: 'aarav@school.com', class: '10', section: 'A' },
    { id: '2', profileId: 'p2', regNo: 'STU002', name: 'Priya Patel', email: 'priya@school.com', class: '10', section: 'A' },
    { id: '3', profileId: 'p3', regNo: 'STU003', name: 'Rahul Kumar', email: 'rahul@school.com', class: '10', section: 'A' },
    { id: '4', profileId: 'p4', regNo: 'STU004', name: 'Sneha Gupta', email: 'sneha@school.com', class: '10', section: 'A' },
    { id: '5', profileId: 'p5', regNo: 'STU005', name: 'Vikram Singh', email: 'vikram@school.com', class: '10', section: 'B' },
    { id: '6', profileId: 'p6', regNo: 'STU006', name: 'Ananya Reddy', email: 'ananya@school.com', class: '10', section: 'B' },
    { id: '7', profileId: 'p7', regNo: 'STU007', name: 'Arjun Nair', email: 'arjun@school.com', class: '9', section: 'A' },
    { id: '8', profileId: 'p8', regNo: 'STU008', name: 'Kavya Iyer', email: 'kavya@school.com', class: '9', section: 'A' },
  ];

  // Load demo data on mount
  useEffect(() => {
    setStudents(demoStudents);
    // You can replace this with actual Supabase fetch
    // fetchStudents();
    // fetchAttendance();
  }, []);

  // Initialize attendance when class/section changes
  useEffect(() => {
    if (selectedClass && selectedSection) {
      loadAttendanceForDate();
    }
  }, [selectedClass, selectedSection, selectedDate, students]);

  // Load attendance for selected date
  const loadAttendanceForDate = () => {
    const filteredStudents = students.filter(
      (s) => s.class === selectedClass && s.section === selectedSection
    );
    
    const initialData = {};
    filteredStudents.forEach((student) => {
      initialData[student.id] = 'present';
    });
    setAttendanceData(initialData);
  };

  // Check for absentee alerts
  useEffect(() => {
    if (attendance.length > 0 && students.length > 0) {
      const alerts = [];
      const today = new Date();
      const threeDaysAgo = new Date(today);
      threeDaysAgo.setDate(today.getDate() - 3);

      students.forEach((student) => {
        const studentAttendance = attendance.filter(
          (a) =>
            a.records[student.id] === 'absent' &&
            new Date(a.date) >= threeDaysAgo &&
            new Date(a.date) <= today
        );

        if (studentAttendance.length >= 3) {
          alerts.push({
            student,
            absentDays: studentAttendance.length,
            lastAbsent: studentAttendance[studentAttendance.length - 1].date,
          });
        }
      });

      setAbsenteeAlerts(alerts);
    }
  }, [attendance, students]);

  // Get unique classes and sections
  const uniqueClasses = [...new Set(students.map((s) => s.class))].sort();
  const uniqueSections = selectedClass
    ? [...new Set(students.filter((s) => s.class === selectedClass).map((s) => s.section))].sort()
    : [];

  // Get filtered students
  const filteredStudents = students.filter(
    (s) => s.class === selectedClass && s.section === selectedSection
  );

  // Toggle attendance status
  const toggleAttendance = (studentId) => {
    setAttendanceData((prev) => {
      const current = prev[studentId] || 'present';
      return {
        ...prev,
        [studentId]: current === 'present' ? 'absent' : 'present',
      };
    });
  };

  // Mark all present
  const markAllPresent = () => {
    const newData = {};
    filteredStudents.forEach((student) => {
      newData[student.id] = 'present';
    });
    setAttendanceData(newData);
  };

  // Save attendance
  const handleSaveAttendance = async () => {
    if (isLoading) return;
    if (!selectedClass || !selectedSection) {
      setSaveError('Select a class and section before saving attendance.');
      return;
    }
    setSaveError('');

    setIsLoading(true);

    try {
      // Create attendance record
      const newRecord = {
        id: Date.now().toString(),
        date: selectedDate,
        class: selectedClass,
        section: selectedSection,
        records: { ...attendanceData },
        timestamp: new Date().toISOString(),
        markedBy: user?.email || 'Faculty',
      };

      setAttendance((prev) => [newRecord, ...prev]);
      setShowStats(true);

      setTimeout(() => setShowStats(false), 3000);
    } catch (error) {
      console.error('Error saving attendance:', error);
      setSaveError('Could not save attendance. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Send reminder to parents
  const sendReminderToParents = (studentId) => {
    const student = students.find((s) => s.id === studentId);
    if (student) {
      Alert.alert(
        'Reminder sent',
        `Notification sent to parents of ${student.name}.\n\nMessage: Your child has been absent for multiple consecutive days.`
      );
    }
  };

  // Calculate statistics
  const calculateStats = () => {
    if (!selectedClass || !selectedSection) return null;

    let present = 0;
    let absent = 0;

    filteredStudents.forEach((student) => {
      const status = attendanceData[student.id] || 'present';
      if (status === 'present') present++;
      if (status === 'absent') absent++;
    });

    return { present, absent, total: filteredStudents.length };
  };

  const stats = calculateStats();

  // Get attendance history
  const getAttendanceHistory = () => {
    return attendance
      .filter(
        (a) =>
          (!selectedClass || a.class === selectedClass) &&
          (!selectedSection || a.section === selectedSection)
      )
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const attendanceHistory = getAttendanceHistory();

  // Get initials
  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Reload data
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  return (
    <ThemedView style={styles.container}>
      <Header
        title="Attendance"
        onMenuPress={openSideNav}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroIconContainer}>
            <IconSymbol name="checklist" size={32} color="#fff" />
          </View>
          <ThemedText style={styles.heroTitle}>Smart Attendance</ThemedText>
          <ThemedText style={styles.heroSubtitle}>
            Mark attendance, track patterns & send alerts
          </ThemedText>
        </View>

        {/* Absentee Alerts */}
        {absenteeAlerts.length > 0 && (
          <View style={styles.alertContainer}>
            <View style={styles.alertHeader}>
              <IconSymbol name="exclamationmark.triangle.fill" size={24} color="#ef4444" />
              <View style={styles.alertHeaderText}>
                <Text style={styles.alertTitle}>
                  Absentee Alerts ({absenteeAlerts.length})
                </Text>
                <Text style={styles.alertSubtitle}>
                  Students absent for 3+ consecutive days
                </Text>
              </View>
            </View>
            {absenteeAlerts.map((alert) => (
              <View key={alert.student.id} style={styles.alertCard}>
                <View style={styles.alertCardLeft}>
                  <View style={styles.alertAvatar}>
                    <Text style={styles.alertAvatarText}>
                      {getInitials(alert.student.name)}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.alertStudentName}>{alert.student.name}</Text>
                    <Text style={styles.alertStudentInfo}>
                      Class {alert.student.class}-{alert.student.section} • Absent {alert.absentDays} days
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.alertButton}
                  onPress={() => sendReminderToParents(alert.student.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Send absence reminder to parents of ${alert.student.name}`}
                >
                  <IconSymbol name="bell.fill" size={16} color="#fff" />
                  <Text style={styles.alertButtonText}>Alert</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* View Tabs */}
        <View style={[styles.tabContainer, { backgroundColor: cardColor }]}>
          <TouchableOpacity
            style={[styles.tab, view === 'mark' && styles.tabActive]}
            onPress={() => setView('mark')}
            accessibilityRole="tab"
            accessibilityState={{ selected: view === 'mark' }}
            accessibilityLabel="Mark attendance tab"
          >
            <Text style={[styles.tabText, view === 'mark' && styles.tabTextActive]}>
              Mark Attendance
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, view === 'history' && styles.tabActive]}
            onPress={() => setView('history')}
            accessibilityRole="tab"
            accessibilityState={{ selected: view === 'history' }}
            accessibilityLabel="Attendance history tab"
          >
            <Text style={[styles.tabText, view === 'history' && styles.tabTextActive]}>
              History
            </Text>
          </TouchableOpacity>
        </View>

        {view === 'mark' ? (
          <>
            {/* Class Selection */}
            <View style={[styles.filterSection, { backgroundColor: cardColor }]}>
              <ThemedText style={styles.filterTitle}>Select Class Details</ThemedText>
              
              {/* Date Display */}
              <View style={styles.dateContainer}>
                <IconSymbol name="calendar" size={20} color="#4f46e5" />
                <Text style={styles.dateText}>
                  {new Date(selectedDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </View>

              {/* Class Selector */}
              <ThemedText style={styles.filterLabel}>Class</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorRow}>
                {uniqueClasses.map((cls) => (
                  <TouchableOpacity
                    key={cls}
                    style={[
                      styles.selectorChip,
                      selectedClass === cls && styles.selectorChipActive,
                    ]}
                    onPress={() => {
                      setSelectedClass(cls);
                      setSelectedSection('');
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selectedClass === cls }}
                    accessibilityLabel={`Class ${cls}`}
                  >
                    <Text
                      style={[
                        styles.selectorChipText,
                        selectedClass === cls && styles.selectorChipTextActive,
                      ]}
                    >
                      Class {cls}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Section Selector */}
              {selectedClass && (
                <>
                  <ThemedText style={styles.filterLabel}>Section</ThemedText>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorRow}>
                    {uniqueSections.map((sec) => (
                      <TouchableOpacity
                        key={sec}
                        style={[
                          styles.selectorChip,
                          selectedSection === sec && styles.selectorChipActive,
                        ]}
                        onPress={() => setSelectedSection(sec)}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: selectedSection === sec }}
                        accessibilityLabel={`Section ${sec}`}
                      >
                        <Text
                          style={[
                            styles.selectorChipText,
                            selectedSection === sec && styles.selectorChipTextActive,
                          ]}
                        >
                          Section {sec}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}
            </View>

            {/* Statistics */}
            {stats && filteredStudents.length > 0 && (
              <View style={styles.statsContainer}>
                <View style={[styles.statCard, { backgroundColor: "#4f46e520" }]}>
                  <IconSymbol name="person.3.fill" size={24} color="#4f46e5" />
                  <Text style={[styles.statValue, { color: "#4f46e5" }]}>{stats.total}</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#10b98120' }]}>
                  <IconSymbol name="checkmark.circle.fill" size={24} color="#10b981" />
                  <Text style={[styles.statValue, { color: '#10b981' }]}>{stats.present}</Text>
                  <Text style={styles.statLabel}>Present</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#ef444420' }]}>
                  <IconSymbol name="xmark.circle.fill" size={24} color="#ef4444" />
                  <Text style={[styles.statValue, { color: '#ef4444' }]}>{stats.absent}</Text>
                  <Text style={styles.statLabel}>Absent</Text>
                </View>
              </View>
            )}

            {/* Success Message */}
            {showStats && (
              <View style={styles.successMessage}>
                <IconSymbol name="checkmark.circle.fill" size={24} color="#10b981" />
                <Text style={styles.successText}>Attendance saved successfully!</Text>
              </View>
            )}

            {/* Student List */}
            {filteredStudents.length > 0 ? (
              <View style={[styles.studentListContainer, { backgroundColor: cardColor }]}>
                <View style={styles.studentListHeader}>
                  <ThemedText style={styles.studentListTitle}>
                    Class {selectedClass}-{selectedSection}
                  </ThemedText>
                  <TouchableOpacity
                    style={styles.markAllButton}
                    onPress={markAllPresent}
                    accessibilityRole="button"
                    accessibilityLabel="Mark all students present"
                  >
                    <Text style={styles.markAllButtonText}>✓ All Present</Text>
                  </TouchableOpacity>
                </View>

                {filteredStudents.map((student, index) => {
                  const status = attendanceData[student.id] || 'present';
                  const isPresent = status === 'present';

                  return (
                    <View key={student.id} style={styles.studentCard}>
                      <View style={styles.studentInfo}>
                        <View style={styles.studentAvatar}>
                          <Text style={styles.studentAvatarText}>
                            {getInitials(student.name)}
                          </Text>
                        </View>
                        <View style={styles.studentDetails}>
                          <Text style={styles.studentName}>{student.name}</Text>
                          <Text style={styles.studentRegNo}>{student.regNo}</Text>
                        </View>
                      </View>

                      <View style={styles.studentActions}>
                        <View
                          style={[
                            styles.statusBadge,
                            isPresent ? styles.statusPresent : styles.statusAbsent,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              isPresent ? styles.statusTextPresent : styles.statusTextAbsent,
                            ]}
                          >
                            {isPresent ? '✓ Present' : '✕ Absent'}
                          </Text>
                        </View>

                        <TouchableOpacity
                          style={styles.toggleButton}
                          onPress={() => toggleAttendance(student.id)}
                          accessibilityRole="switch"
                          accessibilityState={{ checked: isPresent }}
                          accessibilityLabel={`${student.name}, currently ${isPresent ? 'present' : 'absent'}. Activate to mark ${isPresent ? 'absent' : 'present'}.`}
                        >
                          <Text style={styles.toggleButtonText}>Toggle</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}

                {saveError ? (
                  <View style={styles.errorBox}>
                    <Text accessibilityLiveRegion="polite" style={styles.errorText}>{saveError}</Text>
                  </View>
                ) : null}

                {/* Save Button */}
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveAttendance}
                  disabled={isLoading}
                  accessibilityRole="button"
                  accessibilityLabel="Save attendance"
                  accessibilityState={{ disabled: isLoading, busy: isLoading }}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <IconSymbol name="square.and.arrow.down.fill" size={20} color="#fff" />
                      <Text style={styles.saveButtonText}>Save Attendance</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.emptyState, { backgroundColor: cardColor }]}>
                <IconSymbol name="doc.text.magnifyingglass" size={64} color={mutedColor} />
                <ThemedText style={styles.emptyStateTitle}>Select Class Details</ThemedText>
                <ThemedText style={styles.emptyStateSubtitle}>
                  Choose class and section to mark attendance
                </ThemedText>
              </View>
            )}
          </>
        ) : (
          <>
            {/* History View */}
            <View style={[styles.filterSection, { backgroundColor: cardColor }]}>
              <ThemedText style={styles.filterTitle}>Filter History</ThemedText>
              
              {/* Class Filter */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorRow}>
                <TouchableOpacity
                  style={[
                    styles.selectorChip,
                    !selectedClass && styles.selectorChipActive,
                  ]}
                  onPress={() => {
                    setSelectedClass('');
                    setSelectedSection('');
                  }}
                >
                  <Text
                    style={[
                      styles.selectorChipText,
                      !selectedClass && styles.selectorChipTextActive,
                    ]}
                  >
                    All Classes
                  </Text>
                </TouchableOpacity>
                {uniqueClasses.map((cls) => (
                  <TouchableOpacity
                    key={cls}
                    style={[
                      styles.selectorChip,
                      selectedClass === cls && styles.selectorChipActive,
                    ]}
                    onPress={() => setSelectedClass(cls)}
                  >
                    <Text
                      style={[
                        styles.selectorChipText,
                        selectedClass === cls && styles.selectorChipTextActive,
                      ]}
                    >
                      Class {cls}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* History List */}
            {attendanceHistory.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: cardColor }]}>
                <IconSymbol name="clock.arrow.circlepath" size={64} color={mutedColor} />
                <ThemedText style={styles.emptyStateTitle}>No Records Yet</ThemedText>
                <ThemedText style={styles.emptyStateSubtitle}>
                  Start marking attendance to see history
                </ThemedText>
              </View>
            ) : (
              attendanceHistory.map((record) => {
                const recordStats = {
                  present: Object.values(record.records).filter((s) => s === 'present').length,
                  absent: Object.values(record.records).filter((s) => s === 'absent').length,
                  total: Object.keys(record.records).length,
                };

                return (
                  <View key={record.id} style={[styles.historyCard, { backgroundColor: cardColor }]}>
                    <View style={styles.historyHeader}>
                      <View style={styles.historyDate}>
                        <IconSymbol name="calendar" size={20} color="#4f46e5" />
                        <View>
                          <Text style={styles.historyTitle}>
                            Class {record.class}-{record.section}
                          </Text>
                          <Text style={styles.historySubtitle}>
                            {new Date(record.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.historyBadge}>
                        <Text style={styles.historyBadgeText}>
                          {recordStats.total} Students
                        </Text>
                      </View>
                    </View>

                    <View style={styles.historyStats}>
                      <View style={styles.historyStatItem}>
                        <Text style={[styles.historyStatValue, { color: '#10b981' }]}>
                          {recordStats.present}
                        </Text>
                        <Text style={styles.historyStatLabel}>Present</Text>
                      </View>
                      <View style={styles.historyStatItem}>
                        <Text style={[styles.historyStatValue, { color: '#ef4444' }]}>
                          {recordStats.absent}
                        </Text>
                        <Text style={styles.historyStatLabel}>Absent</Text>
                      </View>
                      <View style={styles.historyStatItem}>
                        <Text style={[styles.historyStatValue, { color: "#4f46e5" }]}>
                          {recordStats.total > 0
                            ? ((recordStats.present / recordStats.total) * 100).toFixed(0)
                            : 0}%
                        </Text>
                        <Text style={styles.historyStatLabel}>Rate</Text>
                      </View>
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.progressBarContainer}>
                      <View style={styles.progressBar}>
                        <View
                          style={[
                            styles.progressFill,
                            styles.progressPresent,
                            { width: `${(recordStats.present / recordStats.total) * 100}%` },
                          ]}
                        />
                        <View
                          style={[
                            styles.progressFill,
                            styles.progressAbsent,
                            { width: `${(recordStats.absent / recordStats.total) * 100}%` },
                          ]}
                        />
                      </View>
                    </View>

                    <Text style={styles.historyMarkedBy}>
                      Marked by {record.markedBy}
                    </Text>
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f8ff",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 20,
  },
  heroIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#4f46e5",
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#8899a6',
    textAlign: 'center',
  },

  // Alert Styles
  alertContainer: {
    backgroundColor: '#fef2f2',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  alertHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#991b1b',
  },
  alertSubtitle: {
    fontSize: 12,
    color: '#b91c1c',
    marginTop: 2,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  alertCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  alertAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fecaca',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  alertAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#991b1b',
  },
  alertStudentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
  },
  alertStudentInfo: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  alertButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  alertButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },

  // Tab Styles
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: "#4f46e5",
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8899a6',
  },
  tabTextActive: {
    color: '#fff',
  },

  // Filter Styles
  filterSection: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
    color: '#8899a6',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 171, 244, 0.1)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  dateText: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '500',
    color: "#4f46e5",
  },
  selectorRow: {
    flexDirection: 'row',
  },
  selectorChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  selectorChipActive: {
    backgroundColor: "#4f46e5",
    borderColor: "#4f46e5",
  },
  selectorChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8899a6',
  },
  selectorChipTextActive: {
    color: '#fff',
  },

  // Stats Styles
  statsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#8899a6',
    marginTop: 2,
  },

  // Success Message
  successMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b98120',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  successText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  errorBox: {
    backgroundColor: '#fdecea',
    borderWidth: 1,
    borderColor: '#b3261e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#12305c',
  },

  // Student List Styles
  studentListContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  studentListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  studentListTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  markAllButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  markAllButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
  studentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  studentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#4f46e5",
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  studentAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '600',
    color: "#12305c",
  },
  studentRegNo: {
    fontSize: 12,
    color: '#8899a6',
    marginTop: 2,
  },
  studentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusPresent: {
    backgroundColor: '#10b98120',
  },
  statusAbsent: {
    backgroundColor: '#ef444420',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusTextPresent: {
    color: '#10b981',
  },
  statusTextAbsent: {
    color: '#ef4444',
  },
  toggleButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  toggleButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8899a6',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: "#4f46e5",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },

  // Empty State
  emptyState: {
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#8899a6',
    marginTop: 4,
    textAlign: 'center',
  },

  // History Styles
  historyCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  historyDate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyDateIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: "#12305c",
  },
  historySubtitle: {
    fontSize: 12,
    color: '#8899a6',
    marginTop: 2,
  },
  historyBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  historyBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  historyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  historyStatItem: {
    alignItems: 'center',
  },
  historyStatValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  historyStatLabel: {
    fontSize: 11,
    color: '#8899a6',
    marginTop: 2,
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  progressPresent: {
    backgroundColor: '#10b981',
  },
  progressAbsent: {
    backgroundColor: '#ef4444',
  },
  historyMarkedBy: {
    fontSize: 11,
    color: '#8899a6',
    textAlign: 'right',
  },
});
