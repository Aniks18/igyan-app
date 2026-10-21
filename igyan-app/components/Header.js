/**
 * iGyan App - Header Component
 * Consistent header with profile icon for side navigation
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BrandLogo from './BrandLogo';
import { IconSymbol } from './IconSymbol';
import { useAuth } from '../utils/AuthContext';

export default function Header({ 
  title = 'iGyan', 
  onMenuPress, 
  rightComponent,
  transparent = false,
}) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const getUserInitials = () => {
    if (!user?.full_name) return 'U';
    const names = user.full_name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return names[0][0].toUpperCase();
  };

  return (
    <View style={[
      styles.container, 
      { paddingTop: insets.top },
      transparent && styles.transparent,
    ]}>
      <View style={styles.content}>
        {/* Left Section */}
        <View style={styles.leftSection}>
          <TouchableOpacity
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel="Open navigation menu"
            onPress={onMenuPress}
            activeOpacity={0.7}
          >
            <IconSymbol name="line.3.horizontal" size={22} color="#0f2444" />
          </TouchableOpacity>
        </View>

        {/* Center - School Icon + Title */}
        <View style={styles.centerSection}>
          <BrandLogo size={28} />
          <Text style={[styles.title, { flexShrink: 1 }]} numberOfLines={1}>{title}</Text>
        </View>

        {/* Right Section */}
        <View style={styles.rightSection}>
          {rightComponent ? (
            rightComponent
          ) : (
            <>
              {/* Notification Bell */}
              <View style={styles.iconButton}>
                <IconSymbol name="bell.fill" size={22} color="#0f2444" />
                </View>

              {/* Profile/Menu Button */}
              <TouchableOpacity
                style={styles.profileButton}
                accessibilityRole="button"
              accessibilityLabel="Open account menu"
              onPress={onMenuPress}
                activeOpacity={0.7}
              >
                {user?.avatar_url ? (
                  <Image source={{ uri: user.avatar_url }} style={styles.profileImage} />
                ) : (
                  <View style={styles.profilePlaceholder}>
                    <Text style={styles.profileInitials}>{getUserInitials()}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  transparent: {
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 16,
  },
  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minWidth: 0,
  },
  rightSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },

  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f2444',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f5ff',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  profileButton: {
    marginLeft: 4,
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#4f46e5',
  },
  profilePlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#4f46e5',
  },
  profileInitials: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4f46e5',
  },
});
