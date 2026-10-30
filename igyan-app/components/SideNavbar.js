/**
 * iGyan App - Side Navigation Drawer
 * Hallmark · component: drawer · genre: modern-minimal · theme: githubUI system
 * states: default · pressed · focus-visible · active-route · expanded · selected
 * contrast: body text ≥ 7:1, muted ≥ 4.5:1 on surface
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BrandLogo from './BrandLogo';
import { IconSymbol } from './IconSymbol';
import { useAuth } from '../utils/AuthContext';
import { supabase } from '../utils/supabase';
import { githubUI as c } from '../constants/githubUI';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(312, SCREEN_WIDTH * 0.86);

const SECTIONS = [
  {
    id: 'overview',
    title: 'Overview',
    items: [
      { id: 'home', label: 'Dashboard', icon: 'house.fill', route: '/(tabs)/home' },
      { id: 'courses', label: 'Learn', icon: 'book.fill', route: '/(tabs)/courses' },
      { id: 'explore', label: 'Explore', icon: 'magnifyingglass', route: '/(tabs)/explore' },
      { id: 'live', label: 'Classroom', icon: 'video.fill', route: '/live-classroom' },
      { id: 'attendance', label: 'Attendance', icon: 'checklist', route: '/attendance' },
    ],
  },
  {
    id: 'studio',
    title: 'Create & grow',
    items: [
      { id: 'viva-ai', label: 'AI Viva Lab', icon: 'sparkles', route: '/viva-ai' },
      { id: 'shark-ai', label: 'Shark AI', icon: 'chart.line.uptrend.xyaxis', route: '/shark-ai' },
      { id: 'content-gen', label: 'Pitch Craft', icon: 'doc.richtext.fill', route: '/content-generator' },
      { id: 'incubation', label: 'Incubation Hub', icon: 'building.2.fill', route: '/incubation-hub' },
      { id: 'tools', label: 'AI Tools', icon: 'cpu', route: '/tools/index' },
    ],
  },
  {
    id: 'schedule',
    title: 'Schedule',
    items: [
      { id: 'daily-calendar', label: 'Manage Timetable', icon: 'calendar', route: '/daily-calendar' },
      { id: 'daily-timetable', label: 'Daily Timetable', icon: 'clock.fill', route: '/daily-timetable' },
    ],
  },
];

const schoolSubItems = [
  { id: 'manage-users', label: 'Manage Users', icon: 'person.2.fill', route: '/manage-users' },
  { id: 'manage-subjects', label: 'Manage Subjects', icon: 'books.vertical.fill', route: '/manage-subjects' },
  { id: 'manage-classes', label: 'Manage Classes', icon: 'rectangle.stack.fill', route: '/manage-classes' },
  { id: 'manage-students', label: 'Manage Students', icon: 'person.3.fill', route: '/manage-students' },
  { id: 'manage-class-subjects', label: 'Assign Subjects', icon: 'link', route: '/manage-class-subjects' },
  { id: 'manage-faculty', label: 'Manage Faculty', icon: 'person.text.rectangle', route: '/manage-faculty' },
];

const CHAT_ITEM = { id: 'chat', label: 'Messages', icon: 'envelope.fill', route: '/chat' };
const SETTINGS_ITEM = { id: 'settings', label: 'Settings', icon: 'gearshape.fill', route: '/settings' };

const stripGroup = (route) => route.replace('/(tabs)', '');

export default function SideNavbar({ isOpen, onClose }) {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [schoolExpanded, setSchoolExpanded] = useState(false);
  const [showChat, setShowChat] = useState(false);
  // Stay mounted through the close animation so the drawer slides out
  // instead of vanishing the frame `isOpen` flips to false.
  const [visible, setVisible] = useState(isOpen);

  useEffect(() => {
    if (user?.role === 'parent') {
      setShowChat(true);
    } else if (user?.role === 'faculty' && user?.id) {
      (async () => {
        try {
          let { data } = await supabase
            .from('faculty_profiles')
            .select('is_class_teacher')
            .eq('user_id', user.id)
            .maybeSingle();

          if (!data && user.email) {
            ({ data } = await supabase
              .from('faculty_profiles')
              .select('is_class_teacher')
              .eq('email', user.email)
              .maybeSingle());
          }

          setShowChat(data?.is_class_teacher === true);
        } catch (e) {
          console.error('Faculty profile error:', e);
          setShowChat(false);
        }
      })();
    } else {
      setShowChat(false);
    }
  }, [user?.id, user?.role, user?.email]);

  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      slideAnim.setValue(-DRAWER_WIDTH);
      fadeAnim.setValue(0);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 26,
          stiffness: 260,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
      const t = setTimeout(() => setVisible(false), 240);
      return () => clearTimeout(t);
    }
  }, [isOpen, fadeAnim, slideAnim]);

  const handleNavigation = (route) => {
    onClose();
    setTimeout(() => {
      router.push(route);
    }, 150);
  };

  const handleLogout = async () => {
    onClose();
    try {
      await logout();
      router.replace('/welcome');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getUserInitials = () => {
    if (!user?.full_name) return 'U';
    const names = user.full_name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return names[0][0].toUpperCase();
  };

  const getUserRole = () => {
    if (!user?.role) return 'Student';
    const roleMap = {
      'super_admin': 'Super Admin',
      'co_admin': 'Co-Admin',
      'student': 'Student',
      'faculty': 'Faculty',
      'b2c_student': 'Learner',
      'b2c_mentor': 'Mentor',
    };
    return roleMap[user.role] || 'User';
  };

  const isRouteActive = (route) => {
    const target = stripGroup(route);
    if (pathname === route || pathname === target) return true;
    // Directory index routes (e.g. /tools/index) resolve to the folder path.
    if (target.endsWith('/index') && pathname === target.slice(0, -'/index'.length)) return true;
    return target !== '/' && pathname?.startsWith(`${target}/`);
  };

  const renderItem = (item) => {
    const active = isRouteActive(item.route);
    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.navItem, active && styles.navItemActive]}
        accessibilityRole="button"
        accessibilityLabel={item.label}
        accessibilityState={{ selected: active }}
        onPress={() => handleNavigation(item.route)}
        activeOpacity={0.6}
      >
        <View style={styles.iconCell}>
          <IconSymbol name={item.icon} size={20} color={active ? c.primary : c.placeholder} />
        </View>
        <Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>
      </TouchableOpacity>
    );
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
      </TouchableWithoutFeedback>

      {/* Drawer */}
      <Animated.View
        style={[
          styles.drawer,
          {
            transform: [{ translateX: slideAnim }],
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + 8,
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <BrandLogo variant="sidebar" />
            <TouchableOpacity
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Close navigation menu"
              onPress={onClose}
              activeOpacity={0.7}
            >
              <IconSymbol name="xmark" size={16} color={c.muted} />
            </TouchableOpacity>
          </View>

          {/* Profile card */}
          <TouchableOpacity
            style={styles.profileCard}
            accessibilityRole="button"
            accessibilityLabel="Open profile"
            onPress={() => handleNavigation('/(tabs)/profile')}
            activeOpacity={0.7}
          >
            <View style={styles.avatarContainer}>
              {user?.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>{getUserInitials()}</Text>
                </View>
              )}
            </View>
            <View style={styles.profileMeta}>
              <Text style={styles.userName} numberOfLines={1}>
                {user?.full_name || 'Guest User'}
              </Text>
              <View style={styles.rolePill}>
                <Text style={styles.roleText}>{getUserRole()}</Text>
              </View>
            </View>
            <IconSymbol name="chevron.right" size={16} color={c.placeholder} />
          </TouchableOpacity>
        </View>

        {/* Navigation - scrollable */}
        <ScrollView
          style={styles.navScroll}
          contentContainerStyle={styles.navScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {SECTIONS.map((section, sectionIndex) => (
            <View key={section.id} style={sectionIndex > 0 && styles.sectionGap}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.items.map(renderItem)}
            </View>
          ))}

          {showChat && (
            <View style={styles.sectionGap}>
              <Text style={styles.sectionTitle}>Inbox</Text>
              {renderItem(CHAT_ITEM)}
            </View>
          )}

          {/* Manage School group */}
          <View style={styles.sectionGap}>
            <Text style={styles.sectionTitle}>Administration</Text>
            <TouchableOpacity
              style={styles.navItem}
              accessibilityRole="button"
              accessibilityLabel={schoolExpanded ? 'Collapse Manage School' : 'Expand Manage School'}
              accessibilityState={{ expanded: schoolExpanded }}
              onPress={() => setSchoolExpanded((prev) => !prev)}
              activeOpacity={0.6}
            >
              <View style={styles.iconCell}>
                <IconSymbol name="building.columns.fill" size={20} color={c.placeholder} />
              </View>
              <Text style={styles.navLabel}>Manage School</Text>
              <IconSymbol
                name={schoolExpanded ? 'chevron.up' : 'chevron.down'}
                size={14}
                color={c.muted}
              />
            </TouchableOpacity>
            {schoolExpanded && (
              <View style={styles.subList}>
                {schoolSubItems.map((item) => {
                  const active = isRouteActive(item.route);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.navItem, styles.subNavItem, active && styles.navItemActive]}
                      accessibilityRole="button"
                      accessibilityLabel={item.label}
                      accessibilityState={{ selected: active }}
                      onPress={() => handleNavigation(item.route)}
                      activeOpacity={0.6}
                    >
                      <View style={styles.iconCell}>
                        <IconSymbol
                          name={item.icon}
                          size={18}
                          color={active ? c.primary : c.placeholder}
                        />
                      </View>
                      <Text style={[styles.navLabel, styles.subNavLabel, active && styles.navLabelActive]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Bottom actions */}
        <View style={styles.bottomSection}>
          {renderItem(SETTINGS_ITEM)}
          <TouchableOpacity
            style={styles.navItem}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
            onPress={handleLogout}
            activeOpacity={0.6}
          >
            <View style={styles.iconCell}>
              <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color={c.error} />
            </View>
            <Text style={[styles.navLabel, styles.logoutLabel]}>Sign Out</Text>
          </TouchableOpacity>
          <Text style={styles.footerText}>iGyan v1.1.0</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 36, 68, 0.45)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: c.surface,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#0f2444',
        shadowOffset: { width: 8, height: 0 },
        shadowOpacity: 0.18,
        shadowRadius: 24,
      },
      android: {
        elevation: 24,
      },
    }),
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: c.subtle,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.background,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
    gap: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: c.border,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: c.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
  },
  profileMeta: {
    flex: 1,
    gap: 5,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: c.heading,
  },
  rolePill: {
    alignSelf: 'flex-start',
    backgroundColor: c.subtle,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
    color: c.muted,
    letterSpacing: 0.3,
  },
  navScroll: {
    flex: 1,
  },
  navScrollContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  sectionGap: {
    marginTop: 18,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: c.placeholder,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginVertical: 1,
    gap: 12,
  },
  navItemActive: {
    backgroundColor: c.focusBackground,
  },
  // Fixed-width slot so every label starts on the same vertical line.
  iconCell: {
    width: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: c.text,
  },
  navLabelActive: {
    color: c.primary,
    fontWeight: '600',
  },
  subList: {
    marginLeft: 25,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: c.border,
    marginTop: 2,
    gap: 1,
  },
  subNavItem: {
    paddingVertical: 9,
  },
  subNavLabel: {
    fontSize: 13,
  },
  bottomSection: {
    backgroundColor: c.surface,
    borderTopWidth: 1,
    borderTopColor: c.border,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
  },
  logoutLabel: {
    color: c.error,
    fontWeight: '600',
  },
  footerText: {
    fontSize: 11,
    color: c.muted,
    textAlign: 'center',
    marginTop: 10,
    letterSpacing: 0.4,
  },
});
