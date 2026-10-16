/**
 * iGyan App - Root Layout
 * Main layout configuration for the educational app
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { useColorScheme } from '../hooks/useColorScheme';
import { AuthProvider } from '../utils/AuthContext';
import { SideNavProvider, useSideNav } from '../utils/SideNavContext';
import SideNavbar from '../components/SideNavbar';

// Custom theme for iGyan
const iGyanLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#4f46e5",
    background: '#f8fafc',
    card: '#FFFFFF',
    text: '#0a2434',
    border: '#135167',
  },
};

const iGyanDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: "#4f46e5",
    background: '#0a2434',
    card: '#135167',
    text: '#f8fafc',
    border: '#135167',
  },
};

export const unstable_settings = {
  anchor: '(tabs)',
};

// Inner layout component that can access SideNav context
function RootLayoutContent() {
  const colorScheme = useColorScheme();
  const { isOpen, closeSideNav } = useSideNav();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? iGyanDarkTheme : iGyanLightTheme}>
      <View style={styles.container}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="welcome" options={{ headerShown: false }} />
          <Stack.Screen name="auth-options" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="signup" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="course/[id]" options={{ title: 'Course Details', headerShown: false }} />
          <Stack.Screen name="lesson/[id]" options={{ title: 'Lesson', headerShown: false }} />
          <Stack.Screen name="settings" options={{ title: 'Settings', headerShown: false }} />
          <Stack.Screen name="live-classroom" options={{ title: 'Live Classroom', headerShown: false }} />
          <Stack.Screen name="viva-ai" options={{ title: 'Viva AI', headerShown: false }} />
          <Stack.Screen name="content-generator" options={{ title: 'Content Generator', headerShown: false }} />
          <Stack.Screen name="attendance" options={{ title: 'Attendance', headerShown: false }} />
          <Stack.Screen name="incubation-hub" options={{ title: 'Incubation Hub', headerShown: false }} />
          <Stack.Screen name="shark-ai" options={{ title: 'Shark AI', headerShown: false }} />
          <Stack.Screen name="quiz-me" options={{ title: 'Quiz Me', headerShown: false }} />
          <Stack.Screen name="teacher-prep" options={{ title: 'Teacher Prep', headerShown: false }} />
          <Stack.Screen name="tools/index" options={{ headerShown: false }} />
          <Stack.Screen name="tools/code-tutor" options={{ headerShown: false }} />
          <Stack.Screen name="tools/project-learning" options={{ headerShown: false }} />
          <Stack.Screen name="tools/step-by-step" options={{ headerShown: false }} />
          <Stack.Screen name="tools/text-summarizer" options={{ headerShown: false }} />
          <Stack.Screen name="daily-calendar" options={{ title: 'Manage Timetable', headerShown: false }} />
          <Stack.Screen name="daily-timetable" options={{ title: 'Daily Timetable', headerShown: false }} />
          <Stack.Screen name="school-management" options={{ title: 'Manage School', headerShown: false }} />
          <Stack.Screen name="manage-subjects" options={{ title: 'Manage Subjects', headerShown: false }} />
          <Stack.Screen name="manage-classes" options={{ title: 'Manage Classes', headerShown: false }} />
          <Stack.Screen name="manage-students" options={{ title: 'Manage Students', headerShown: false }} />
          <Stack.Screen name="manage-class-subjects" options={{ title: 'Assign Subjects', headerShown: false }} />
          <Stack.Screen name="manage-faculty" options={{ title: 'Manage Faculty', headerShown: false }} />
          <Stack.Screen name="manage-users" options={{ title: 'Manage Users', headerShown: false }} />
          <Stack.Screen name="chat" options={{ title: 'Messages', headerShown: false }} />
          <Stack.Screen name="chat-conversation" options={{ title: 'Chat', headerShown: false }} />
        </Stack>
        <SideNavbar isOpen={isOpen} onClose={closeSideNav} />
        <StatusBar style="dark" />
      </View>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SideNavProvider>
          <RootLayoutContent />
        </SideNavProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
});
