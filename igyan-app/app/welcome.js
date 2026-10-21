/* Hallmark · redesign: welcome · pre-emit critique: P4 H5 E4 S5 R5 V4 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, AccessibilityInfo } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import BrandLogo from '../components/BrandLogo';
import { IconSymbol } from '../components/IconSymbol';
import { githubUI as c } from '../constants/githubUI';

export default function WelcomeScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then(enabled => {
      if (!mounted) return;
      if (enabled) {
        fadeAnim.setValue(1);
        scaleAnim.setValue(1);
        return;
      }
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    });
    return () => { mounted = false; };
  }, [fadeAnim, scaleAnim]);

  const handleGetStarted = () => {
    router.push('/auth-options');
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <BrandLogo variant="hero" />
        </Animated.View>

        <Animated.View style={[styles.textContainer, { opacity: fadeAnim }]}>
          <Text accessibilityRole="header" style={styles.title}>Empowering the future of learning.</Text>
          <Text style={styles.description}>
            Personalized pathways, AI mentors, and a connected workspace for every learner and educator.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.buttonContainer, { opacity: fadeAnim }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Get started"
            accessibilityHint="Go to workspace selection"
            onPress={handleGetStarted}
            style={({ pressed }) => [styles.startButton, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.startButtonText}>Get started</Text>
            <IconSymbol name="chevron.right" size={24} color="#ffffff" />
          </Pressable>
        </Animated.View>

        <View pointerEvents="none" style={styles.decorCircle1} />
        <View pointerEvents="none" style={styles.decorCircle2} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background },
  container: {
    flex: 1,
    backgroundColor: c.background,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    marginBottom: 20,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: c.heading,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: c.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    marginBottom: 60,
  },
  startButton: {
    backgroundColor: c.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    minHeight: 56,
    shadowColor: '#0f2444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  decorCircle1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: c.surface,
    opacity: 0.7,
  },
  decorCircle2: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: c.subtle,
    opacity: 1,
  },
});
