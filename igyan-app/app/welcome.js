/**
 * iGyan App - Welcome Screen
 * First screen users see when opening the app
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '../components/IconSymbol';

export default function WelcomeScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleGetStarted = () => {
    router.push('/auth-options');
  };

  return (
    <View style={styles.container}>
      {/* Logo Section */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Image
          source={require('../assets/brand/igyan-ai-mark.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Welcome Message */}
      <Animated.View style={[styles.textContainer, { opacity: fadeAnim }]}>
        <Text style={styles.title}>Empowering the future of learning.</Text>
        <Text style={styles.description}>
          Personalized pathways, AI mentors, and a connected workspace for every learner and educator.
        </Text>
      </Animated.View>

      {/* Get Started Button */}
      <Animated.View style={[styles.buttonContainer, { opacity: fadeAnim }]}>
        <TouchableOpacity style={styles.startButton} onPress={handleGetStarted}>
          <Text style={styles.startButtonText}>Get Started</Text>
          <IconSymbol name="chevron.right" size={24} color="#ffffff" />
        </TouchableOpacity>
      </Animated.View>

      {/* Decorative Elements */}
      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f8ff",
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    marginBottom: 20,
  },
  logoImage: {
    width: 200,
    height: 200,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: "#12305c",
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: "#12305c",
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.85,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    marginBottom: 60,
  },
  startButton: {
    backgroundColor: "#4f46e5",
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  startButtonText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 8,
  },
  decorCircle1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#ffffff",
    opacity: 0.3,
  },
  decorCircle2: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "#4f46e5",
    opacity: 0.1,
  },
});
