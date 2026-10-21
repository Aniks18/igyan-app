/**
 * iGyan App - Course Detail Screen
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, View, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import { IconSymbol } from '../../components/IconSymbol';
import Header from '../../components/Header';
import { useThemeColor } from '../../hooks/useThemeColor';
import { useSideNav } from '../../utils/SideNavContext';
import { fetchCourseById } from '../../services/coursesService';

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { openSideNav } = useSideNav();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('english');
  const cardColor = useThemeColor({}, 'card');

  const loadCourse = useCallback(async () => {
    try {
      setLoading(true);
      const courseData = await fetchCourseById(id);
      setCourse(courseData);
    } catch (error) {
      console.error('Error loading course:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  const startCourse = (lang = 'english') => {
    router.push(`/course/viewer/${id}?lang=${lang}`);
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <Header 
          title="Course Details" 
          onMenuPress={openSideNav} 
        />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <ThemedText style={{ marginTop: 16 }}>Loading course...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!course) {
    return (
      <ThemedView style={styles.container}>
        <Header 
          title="Course Details" 
          onMenuPress={openSideNav} 
        />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ThemedText style={{ fontSize: 18 }}>Course not found</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const modules = [
    {
      id: 1,
      title: 'Main Content PDF',
      type: 'pdf',
      icon: 'doc.text.fill',
      url: selectedLanguage === 'hindi' ? course.modules.module1Hindi : course.modules.module1English,
    },
    {
      id: 2,
      title: 'Mind Map PDF',
      type: 'pdf',
      icon: 'brain.fill',
      url: selectedLanguage === 'hindi' ? course.modules.module2Hindi : course.modules.module2English,
    },
    {
      id: 3,
      title: 'Video Lecture',
      type: 'video',
      icon: 'play.circle.fill',
      url: selectedLanguage === 'hindi' ? course.modules.module3Hindi : course.modules.module3English,
    },
  ];

  return (
    <ThemedView style={styles.container}>
      <Header 
        title={course.title || 'Course Details'} 
        onMenuPress={openSideNav} 
      />
      <ScrollView>
        {/* Course Header */}
        <View style={[styles.headerImage, { justifyContent: 'center', alignItems: 'center' }]}>
          <ThemedText style={{ fontSize: 80 }}>{course.thumbnail}</ThemedText>
        </View>
        
        <View style={styles.content}>
          <ThemedText style={styles.courseTitle}>{course.title}</ThemedText>
          <View style={styles.categoryBadge}>
            <ThemedText style={styles.categoryText}>{course.category}</ThemedText>
          </View>

          {/* Language Toggle */}
          <View style={styles.languageToggle}>
            <TouchableOpacity 
              style={[
                styles.languageButton,
                selectedLanguage === 'english' && styles.languageButtonActive
              ]}
              onPress={() => setSelectedLanguage('english')}
            >
              <ThemedText style={[
                styles.languageButtonText,
                selectedLanguage === 'english' && styles.languageButtonTextActive
              ]}>
                🇬🇧 English
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.languageButton,
                selectedLanguage === 'hindi' && styles.languageButtonActive
              ]}
              onPress={() => setSelectedLanguage('hindi')}
            >
              <ThemedText style={[
                styles.languageButtonText,
                selectedLanguage === 'hindi' && styles.languageButtonTextActive
              ]}>
                🇮🇳 हिंदी
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Description */}
          <ThemedText style={styles.sectionTitle}>About this course</ThemedText>
          <ThemedText style={styles.description}>{course.description}</ThemedText>

          {/* Course Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <IconSymbol name="clock.fill" size={20} color="#4f46e5" />
              <ThemedText style={styles.statText}>{course.duration}</ThemedText>
            </View>
            <View style={styles.statItem}>
              <IconSymbol name="tag.fill" size={20} color="#10B981" />
              <ThemedText style={styles.statText}>{course.price}</ThemedText>
            </View>
          </View>

          {/* Course Modules */}
          <ThemedText style={styles.sectionTitle}>Course Modules</ThemedText>
          {modules.map((module) => (
            <View 
              key={module.id}
              style={[
                styles.lessonItem, 
                { backgroundColor: cardColor },
                !module.url && { opacity: 0.5 }
              ]}
            >
              <View style={styles.lessonNumber}>
                <IconSymbol name={module.icon} size={24} color="#4f46e5" />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.lessonTitle}>{module.title}</ThemedText>
                <ThemedText style={styles.moduleType}>
                  {module.type.toUpperCase()} • {module.url ? 'Available' : 'Coming Soon'}
                </ThemedText>
              </View>
              {module.url && (
                <IconSymbol name="checkmark.circle.fill" size={20} color="#10B981" />
              )}
            </View>
          ))}

          {/* Start Course Button */}
          <TouchableOpacity
            style={{
              backgroundColor: "#4f46e5",
              padding: 16,
              borderRadius: 16,
              marginTop: 20,
              shadowColor: "#4f46e5",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
            onPress={() => startCourse(selectedLanguage)}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <IconSymbol name="play.circle.fill" size={24} color="#FFF" />
              <ThemedText style={{ color: '#FFF', fontSize: 18, fontWeight: '700' }}>
                Start Learning
              </ThemedText>
            </View>
          </TouchableOpacity>

          <View style={{ padding: 16, backgroundColor: cardColor, borderRadius: 12, marginTop: 16 }}>
            <ThemedText style={{ fontSize: 14, lineHeight: 20, opacity: 0.7 }}>
              💡 All modules will open inside the app. You can switch between modules and languages anytime during the course
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerImage: {
    width: '100%',
    height: 200,
    backgroundColor: "#4f46e5",
  },
  content: {
    padding: 16,
  },
  courseTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  instructor: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  statText: {
    marginLeft: 8,
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.8,
  },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  lessonNumber: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#4f46e510",
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  lessonNumberText: {
    color: "#4f46e5",
    fontWeight: 'bold',
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  moduleType: {
    fontSize: 12,
    opacity: 0.6,
  },
  categoryBadge: {
    backgroundColor: "#4f46e520",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  categoryText: {
    color: "#4f46e5",
    fontSize: 14,
    fontWeight: '600',
  },
  languageToggle: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  languageButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  languageButtonActive: {
    backgroundColor: "#4f46e5",
  },
  languageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  languageButtonTextActive: {
    color: '#FFF',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  enrollButton: {
    backgroundColor: "#4f46e5",
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  enrollButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
