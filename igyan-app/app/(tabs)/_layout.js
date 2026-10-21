/**
 * iGyan App - Tab Layout
 * Bottom tab navigation configuration
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs, router } from 'expo-router';

import { HapticTab } from '../../components/HapticTab';
import { IconSymbol } from '../../components/IconSymbol';
import Header from '../../components/Header';
import { useAuth } from '../../utils/AuthContext';
import { useSideNav } from '../../utils/SideNavContext';
import { supabase } from '../../utils/supabase';

const INSTITUTIONAL_ROLES = ['super_admin', 'co_admin', 'student', 'faculty', 'parent'];

export default function TabLayout() {
  const { user, loading } = useAuth();
  const { openSideNav } = useSideNav();
  const [schoolName, setSchoolName] = useState('iGyan');

  // Route guard: the tab group is authenticated-only. Send signed-out
  // users back to welcome instead of rendering an empty shell.
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/welcome');
    }
  }, [user, loading]);

  const fetchSchoolName = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('school_name')
        .eq('id', user.school_id)
        .single();

      if (!error && data) {
        setSchoolName(data.school_name);
      }
    } catch (error) {
      console.error('Error fetching school name:', error);
    }
  }, [user?.school_id]);

  useEffect(() => {
    if (user && user.school_id && INSTITUTIONAL_ROLES.includes(user.role)) {
      fetchSchoolName();
    }
  }, [user, fetchSchoolName]);

  return (
    <View style={styles.container}>
      <Header title={schoolName} onMenuPress={openSideNav} />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#4f46e5',
          tabBarInactiveTintColor: '#64748b',
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopColor: '#d9e3f3',
            borderTopWidth: 1,
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="courses"
          options={{
            title: 'Learn',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="book.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Explore',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="magnifyingglass" color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});
