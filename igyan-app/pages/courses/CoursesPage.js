/**
 * iGyan App - Courses Page
 * Browse and manage enrolled courses
 */

import React, { useState, useEffect } from 'react';
import { ScrollView, View, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import { IconSymbol } from '../../components/IconSymbol';
import { useThemeColor } from '../../hooks/useThemeColor';
import { coursesStyles } from '../../styles/pages/coursesStyles';
import { fetchCourses, mockCourses } from '../../services/coursesService';

const categories = ['All', 'Foundation', 'Programming', 'Design', 'Business', 'Data Science'];

export default function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');

  // Fetch courses from online source
  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      // Try to fetch from Google Sheets first
      let coursesData = await fetchCourses();
      
      // If empty or failed, use mock data
      if (!coursesData || coursesData.length === 0) {
        coursesData = mockCourses;
      }
      
      setCourses(coursesData);
    } catch (error) {
      console.error('Error loading courses:', error);
      setCourses(mockCourses); // Fallback to mock data
    } finally {
      setLoading(false);
    }
  };

  // Filter courses by category and search query
  const filteredCourses = courses.filter((course) => {
    const matchesCategory = activeCategory === 'All' || course.category === activeCategory;
    const matchesSearch = 
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <ThemedView style={coursesStyles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <ThemedText style={{ marginTop: 16, fontSize: 16 }}>Loading courses...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      {/* Header */}
      <View style={{ padding: 16, paddingBottom: 0 }}>
        <ThemedText style={{ fontSize: 32, fontWeight: '800', marginBottom: 16 }}>
          My Courses
        </ThemedText>
        
        {/* Search Bar */}
        <View style={{
          backgroundColor: cardColor,
          borderRadius: 16,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: borderColor,
        }}>
          <IconSymbol name="magnifyingglass" size={20} color="#999" />
          <TextInput
            style={{
              flex: 1,
              marginLeft: 12,
              fontSize: 15,
              color: textColor,
            }}
            placeholder="Search courses..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Categories */}
      <View style={{ paddingBottom: 8 }}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={{
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 24,
                backgroundColor: activeCategory === category ? "#4f46e5" : cardColor,
                borderWidth: 1,
                borderColor: activeCategory === category ? "#4f46e5" : borderColor,
                shadowColor: activeCategory === category ? "#4f46e5" : '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: activeCategory === category ? 0.3 : 0.05,
                shadowRadius: 4,
                elevation: activeCategory === category ? 4 : 1,
              }}
              onPress={() => setActiveCategory(category)}
            >
              <ThemedText
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: activeCategory === category ? '#FFF' : textColor,
                }}
              >
                {category}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Courses List */}
      <ScrollView 
        contentContainerStyle={{ padding: 16, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {filteredCourses.length === 0 ? (
          <View style={{ padding: 48, alignItems: 'center' }}>
            <ThemedText style={{ fontSize: 48, marginBottom: 16 }}>📚</ThemedText>
            <ThemedText style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>
              No courses found
            </ThemedText>
            <ThemedText style={{ fontSize: 14, opacity: 0.6, textAlign: 'center' }}>
              Try adjusting your search or filters
            </ThemedText>
          </View>
        ) : (
          filteredCourses.map((course) => (
            <TouchableOpacity 
              key={course.id}
              onPress={() => router.push(`/course/${course.id}`)}
              activeOpacity={0.7}
              style={{ marginBottom: 16 }}
            >
              <View style={{
                backgroundColor: cardColor,
                borderRadius: 20,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: borderColor,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
                elevation: 3,
              }}>
                <View style={{ flexDirection: 'row' }}>
                  {/* Thumbnail */}
                  <View style={{
                    width: 120,
                    height: 140,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: course.thumbnail ? 'transparent' : "#4f46e510",
                  }}>
                    <ThemedText style={{ fontSize: 56 }}>{course.thumbnail}</ThemedText>
                  </View>
                  
                  {/* Content */}
                  <View style={{ flex: 1, padding: 16, paddingLeft: 12 }}>
                    {/* Category Badge */}
                    <View style={{
                      backgroundColor: "#4f46e515",
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 8,
                      alignSelf: 'flex-start',
                      marginBottom: 8,
                    }}>
                      <ThemedText style={{ fontSize: 11, fontWeight: '700', color: "#4f46e5" }}>
                        {course.category.toUpperCase()}
                      </ThemedText>
                    </View>

                    {/* Title */}
                    <ThemedText style={{ fontSize: 18, fontWeight: '700', marginBottom: 6, lineHeight: 24 }}>
                      {course.title}
                    </ThemedText>

                    {/* Description */}
                    <ThemedText numberOfLines={2} style={{ fontSize: 13, opacity: 0.7, marginBottom: 10, lineHeight: 18 }}>
                      {course.description}
                    </ThemedText>

                    {/* Meta Row */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <IconSymbol name="clock.fill" size={14} color="#999" />
                        <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>
                          {course.duration}
                        </ThemedText>
                      </View>
                      <ThemedText style={{
                        fontSize: 14,
                        fontWeight: '700',
                        color: course.price === 'Free' ? '#10B981' : "#4f46e5",
                      }}>
                        {course.price}
                      </ThemedText>
                    </View>

                    {/* Progress Bar */}
                    {course.progress > 0 && (
                      <View style={{ marginTop: 12 }}>
                        <View style={{
                          height: 6,
                          backgroundColor: '#E0E0E0',
                          borderRadius: 3,
                          overflow: 'hidden',
                        }}>
                          <View style={{
                            height: '100%',
                            width: `${course.progress}%`,
                            backgroundColor: '#10B981',
                            borderRadius: 3,
                          }} />
                        </View>
                        <ThemedText style={{ fontSize: 11, marginTop: 4, opacity: 0.6 }}>
                          {course.progress}% completed
                        </ThemedText>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </ThemedView>
  );
}
