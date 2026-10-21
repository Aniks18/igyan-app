/**
 * iGyan App - Side Navigation Bar Component
 * Minimalist side drawer with clean animations
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
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BrandLogo from './BrandLogo';
import { IconSymbol } from './IconSymbol';
import { useAuth } from '../utils/AuthContext';
import { supabase } from '../utils/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(290, SCREEN_WIDTH * 0.8);

const navItems = [
  { id: 'home', label: 'Dashboard', icon: 'house.fill', route: '/(tabs)/home' },
  { id: 'courses', label: 'Learn', icon: 'book.fill', route: '/(tabs)/courses' },
  { id: 'explore', label: 'Explore', icon: 'magnifyingglass', route: '/(tabs)/explore' },
  { id: 'live', label: 'Classroom', icon: 'video.fill', route: '/live-classroom' },
  { id: 'attendance', label: 'Attendance', icon: 'checklist', route: '/attendance' },
  { id: 'viva-ai', label: 'AI Viva Lab', icon: 'sparkles', route: '/viva-ai' },
  { id: 'shark-ai', label: 'Shark AI', icon: 'chart.line.uptrend.xyaxis', route: '/shark-ai' },
  { id: 'content-gen', label: 'Pitch Craft', icon: 'doc.richtext.fill', route: '/content-generator' },
  { id: 'incubation', label: 'Incubation Hub', icon: 'building.2.fill', route: '/incubation-hub' },
  { id: 'tools', label: 'AI Tools', icon: 'cpu', route: '/tools/index' },
  { id: 'daily-calendar', label: 'Manage Timetable', icon: 'calendar', route: '/daily-calendar' },
  { id: 'daily-timetable', label: 'Daily Timetable', icon: 'clock.fill', route: '/daily-timetable' },
  // "Manage School" is handled as an expandable group below
  // "Messages" is conditionally added for parent/faculty below
];

const schoolSubItems = [
  { id: 'manage-users', label: 'Manage Users', icon: 'person.2.fill', route: '/manage-users' },
  { id: 'manage-subjects', label: 'Manage Subjects', icon: 'books.vertical.fill', route: '/manage-subjects' },
  { id: 'manage-classes', label: 'Manage Classes', icon: 'rectangle.stack.fill', route: '/manage-classes' },
  { id: 'manage-students', label: 'Manage Students', icon: 'person.3.fill', route: '/manage-students' },
  { id: 'manage-class-subjects', label: 'Assign Subjects', icon: 'link', route: '/manage-class-subjects' },
  { id: 'manage-faculty', label: 'Manage Faculty', icon: 'person.text.rectangle', route: '/manage-faculty' },
];

const bottomNavItems = [
  { id: 'settings', label: 'Settings', icon: 'gearshape.fill', route: '/settings' },
];

export default function SideNavbar({ isOpen, onClose }) {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [schoolExpanded, setSchoolExpanded] = useState(false);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    if (user?.role === 'parent') {
      setShowChat(true);
    } else if (user?.role === 'faculty' && user?.id) {
      (async () => {
        try {
          // Try matching by user_id first, then fallback to email
          let { data, error } = await supabase
            .from('faculty_profiles')
            .select('is_class_teacher')
            .eq('user_id', user.id)
            .maybeSingle();

          if (!data && user.email) {
            ({ data, error } = await supabase
              .from('faculty_profiles')
              .select('is_class_teacher')
              .eq('email', user.email)
              .maybeSingle());
          }

          console.log('Faculty profile check:', { data, error, userId: user.id, email: user.email });
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
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 20,
          stiffness: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
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

  if (!isOpen) return null;

  return (
    <View style={[styles.overlay, { paddingTop: 0 }]} pointerEvents="box-none">
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
            paddingTop: insets.top + 8,
            paddingBottom: insets.bottom,
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
              <IconSymbol name="xmark" size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Profile */}
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              {user?.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>{getUserInitials()}</Text>
                </View>
              )}
            </View>
            <Text style={styles.userName} numberOfLines={1}>
              {user?.full_name || 'Guest User'}
            </Text>
            <Text style={styles.userRole}>{getUserRole()}</Text>
          </View>
        </View>

        {/* Navigation Items - Scrollable */}
        <ScrollView
          style={styles.navScroll}
          contentContainerStyle={styles.navScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.navSection}>
            {navItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.navItem}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                onPress={() => handleNavigation(item.route)}
                activeOpacity={0.6}
              >
                <IconSymbol name={item.icon} size={18} color="#64748b" />
                <Text style={styles.navLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}

            {/* Chat - visible for parent & faculty */}
            {showChat && (
              <TouchableOpacity
                style={styles.navItem}
                accessibilityRole="button"
                accessibilityLabel="Messages"
                onPress={() => handleNavigation('/chat')}
                activeOpacity={0.6}
              >
                <IconSymbol name="envelope.fill" size={18} color="#64748b" />
                <Text style={styles.navLabel}>Messages</Text>
              </TouchableOpacity>
            )}

            {/* Expandable Manage School group */}
            <TouchableOpacity
              style={styles.navItem}
              accessibilityRole="button"
              accessibilityLabel={schoolExpanded ? 'Collapse Manage School' : 'Expand Manage School'}
              accessibilityState={{ expanded: schoolExpanded }}
              onPress={() => setSchoolExpanded(prev => !prev)}
              activeOpacity={0.6}
            >
              <IconSymbol name="gearshape.fill" size={18} color="#64748b" />
              <Text style={styles.navLabel}>Manage School</Text>
              <IconSymbol name={schoolExpanded ? 'chevron.up' : 'chevron.down'} size={12} color="#475569" />
            </TouchableOpacity>
            {schoolExpanded && schoolSubItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.navItem, styles.subNavItem]}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                onPress={() => handleNavigation(item.route)}
                activeOpacity={0.6}
              >
                <IconSymbol name={item.icon} size={15} color="#475569" />
                <Text style={[styles.navLabel, styles.subNavLabel]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          <View style={styles.bottomDivider} />
          
          {bottomNavItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.navItem}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              onPress={() => handleNavigation(item.route)}
              activeOpacity={0.6}
            >
              <IconSymbol name={item.icon} size={18} color="#64748b" />
              <Text style={styles.navLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}

          {/* Logout */}
          <TouchableOpacity
            style={[styles.navItem, styles.logoutItem]}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
            onPress={handleLogout}
            activeOpacity={0.6}
          >
            <IconSymbol name="rectangle.portrait.and.arrow.right" size={18} color="#ef4444" />
            <Text style={[styles.navLabel, styles.logoutLabel]}>Sign Out</Text>
          </TouchableOpacity>

          {/* Footer */}
          <Text style={styles.footerText}>iGyan v1.0.0</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: '#ffffff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: {
        elevation: 24,
      },
    }),
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f5ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileSection: {
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#d9e3f3',
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4f46e5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f2444',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '400',
  },
  navScroll: {
    flex: 1,
  },
  navScrollContent: {
    paddingTop: 4,
  },
  navSection: {
    paddingHorizontal: 12,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginVertical: 1,
    gap: 14,
  },
  navLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    color: '#12305c',
    letterSpacing: 0.1,
  },
  subNavItem: {
    paddingLeft: 48,
    paddingVertical: 10,
  },
  subNavLabel: {
    fontSize: 13,
    color: '#94a3b8',
  },
  bottomSection: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  bottomDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#d9e3f3',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  logoutItem: {
    marginTop: 4,
  },
  logoutLabel: {
    color: '#ef4444',
    fontWeight: '500',
  },
  footerText: {
    fontSize: 11,
    color: '#334155',
    textAlign: 'center',
    marginTop: 12,
    letterSpacing: 0.5,
  },
});
