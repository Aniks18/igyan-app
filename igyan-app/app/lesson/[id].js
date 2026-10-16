/**
 * iGyan App - Lesson Player Screen
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import { IconSymbol } from '../../components/IconSymbol';
import Header from '../../components/Header';
import { useSideNav } from '../../utils/SideNavContext';

export default function LessonScreen() {
  const { id } = useLocalSearchParams();
  const { openSideNav } = useSideNav();

  return (
    <ThemedView style={styles.container}>
      <Header 
        title="Lesson" 
        onMenuPress={openSideNav} 
        showBack 
        onBackPress={() => router.back()} 
      />
      {/* Video Player Placeholder */}
      <View style={styles.videoPlayer}>
        <TouchableOpacity style={styles.playButton}>
          <IconSymbol name="play.circle.fill" size={64} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Lesson Info */}
      <View style={styles.content}>
        <ThemedText style={styles.lessonTitle}>Introduction to React Native</ThemedText>
        <ThemedText style={styles.lessonDescription}>
          In this lesson, you'll learn the fundamentals of React Native and how it differs from 
          traditional mobile development approaches.
        </ThemedText>

        {/* Navigation Buttons */}
        <View style={styles.navButtons}>
          <TouchableOpacity style={styles.navButton}>
            <IconSymbol name="chevron.left.forwardslash.chevron.right" size={20} color="#4f46e5" />
            <ThemedText style={styles.navButtonText}>Previous</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.navButton, styles.nextButton]}>
            <ThemedText style={styles.nextButtonText}>Next Lesson</ThemedText>
            <IconSymbol name="chevron.right" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  videoPlayer: {
    width: '100%',
    height: 250,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    opacity: 0.8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  lessonTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  lessonDescription: {
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.8,
  },
  navButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingTop: 16,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4f46e5",
  },
  navButtonText: {
    marginLeft: 8,
    color: "#4f46e5",
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: "#4f46e5",
    borderColor: "#4f46e5",
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginRight: 8,
  },
});
