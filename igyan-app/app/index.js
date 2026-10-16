/**
 * iGyan App - Index Route
 * Handles initial routing and auth check
 */

import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../utils/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function Index() {
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/welcome');
      }
    }
  }, [isAuthenticated, loading]);

  return (
    <LinearGradient
      colors={['#0a2434', '#135167', "#4f46e5"]}
      style={styles.container}
    >
      <ActivityIndicator size="large" color="#f8fafc" />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
