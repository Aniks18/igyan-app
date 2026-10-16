/**
 * iGyan App - Project-Based Learning Tool
 * AI-powered personalized project recommendations
 */

import React, { useState, useRef } from 'react';
import { ScrollView, View, TextInput, TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import { IconSymbol } from '../../components/IconSymbol';
import Header from '../../components/Header';
import { useThemeColor } from '../../hooks/useThemeColor';
import { useSideNav } from '../../utils/SideNavContext';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced'];
const DURATION_OPTIONS = ['1-2 weeks', '2-4 weeks', '1-2 months', '2+ months'];

export default function ProjectBasedLearningPage() {
  const router = useRouter();
  const scrollViewRef = useRef(null);
  const { openSideNav } = useSideNav();
  const [formData, setFormData] = useState({
    topic: '',
    skillLevel: 'beginner',
    duration: '1-2 weeks',
    interests: '',
    goals: ''
  });
  const [projects, setProjects] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [showForm, setShowForm] = useState(true);

  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');
  const backgroundColor = useThemeColor({}, 'background');

  const handleInputChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.topic.trim()) {
      Alert.alert('Required', 'Please enter a topic/subject');
      return;
    }

    setGenerating(true);
    setShowForm(false);

    const prompt = `Generate 3 personalized project recommendations for a student based on the following:

Topic/Subject: ${formData.topic}
Skill Level: ${formData.skillLevel}
Available Time: ${formData.duration}
Interests: ${formData.interests || 'General learning'}
Learning Goals: ${formData.goals || 'Practical hands-on experience'}

Return a JSON object with this EXACT structure:
{
  "topic": "${formData.topic}",
  "recommendedProjects": [
    {
      "title": "Project name",
      "difficulty": "Beginner/Intermediate/Advanced",
      "duration": "Estimated time",
      "description": "Brief overview",
      "learningOutcomes": ["Outcome 1", "Outcome 2"],
      "requirements": {
        "skills": ["Skill 1"],
        "tools": ["Tool 1"],
        "prerequisites": ["Prereq 1"]
      },
      "phases": [
        {
          "phase": "Phase 1",
          "title": "Phase title",
          "tasks": ["Task 1", "Task 2"],
          "estimatedTime": "Time"
        }
      ],
      "challenges": ["Challenge 1"],
      "extensions": ["Extension 1"],
      "matchScore": 95
    }
  ],
  "generalTips": ["Tip 1", "Tip 2"],
  "skillsToLearn": ["Skill 1", "Skill 2"]
}

Make projects practical and achievable within ${formData.duration} for ${formData.skillLevel} level.
Return ONLY valid JSON.`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are an expert educational advisor specializing in project-based learning. You create personalized, practical project recommendations. Always return valid JSON with detailed, actionable project plans.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.8,
          max_tokens: 4000,
          response_format: { type: 'json_object' }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate project recommendations');
      }

      const data = await response.json();
      const parsedProjects = JSON.parse(data.choices[0].message.content);
      setProjects(parsedProjects);
    } catch (err) {
      console.error('Error generating projects:', err);
      Alert.alert('Error', 'Failed to generate project recommendations. Please try again.');
      setShowForm(true);
    } finally {
      setGenerating(false);
    }
  };

  const resetForm = () => {
    setProjects(null);
    setShowForm(true);
    setFormData({
      topic: '',
      skillLevel: 'beginner',
      duration: '1-2 weeks',
      interests: '',
      goals: ''
    });
  };

  const getDifficultyColor = (difficulty) => {
    if (difficulty === 'Beginner') return { bg: '#10B981' + '20', text: '#10B981' };
    if (difficulty === 'Intermediate') return { bg: "#4f46e5" + '20', text: "#4f46e5" };
    return { bg: '#EF4444' + '20', text: '#EF4444' };
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      {/* Header */}
      <Header 
        title="Project-Based Learning" 
        onMenuPress={openSideNav} 
        showBack 
        onBackPress={() => router.back()} 
        rightComponent={
          projects ? (
            <TouchableOpacity
              onPress={resetForm}
              style={{
                backgroundColor: '#10B981' + '20',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#10B981',
              }}
            >
              <ThemedText style={{ fontSize: 13, fontWeight: '600', color: '#10B981' }}>
                New Search
              </ThemedText>
            </TouchableOpacity>
          ) : null
        }
      />

      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
      >
        {showForm && !projects && (
          <View style={{ marginBottom: 20 }}>
            <ThemedText style={{ fontSize: 18, fontWeight: '700', marginBottom: 16 }}>
              Your Learning Profile
            </ThemedText>

            {/* Topic */}
            <View style={{ marginBottom: 16 }}>
              <ThemedText style={{ fontSize: 13, fontWeight: '600', marginBottom: 8, color: '#999' }}>
                Topic/Subject *
              </ThemedText>
              <TextInput
                value={formData.topic}
                onChangeText={(value) => handleInputChange('topic', value)}
                placeholder="E.g., Web Development, Data Science..."
                placeholderTextColor="#999"
                style={{
                  backgroundColor: backgroundColor,
                  borderWidth: 1,
                  borderColor: borderColor,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 15,
                  color: textColor,
                }}
              />
            </View>

            {/* Skill Level */}
            <View style={{ marginBottom: 16 }}>
              <ThemedText style={{ fontSize: 13, fontWeight: '600', marginBottom: 8, color: '#999' }}>
                Current Skill Level
              </ThemedText>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {SKILL_LEVELS.map((level) => (
                  <TouchableOpacity
                    key={level}
                    onPress={() => handleInputChange('skillLevel', level)}
                    style={{
                      flex: 1,
                      backgroundColor: formData.skillLevel === level ? '#10B981' : cardColor,
                      borderWidth: 1,
                      borderColor: formData.skillLevel === level ? '#10B981' : borderColor,
                      borderRadius: 12,
                      paddingVertical: 12,
                      alignItems: 'center',
                    }}
                  >
                    <ThemedText style={{ 
                      fontSize: 13,
                      fontWeight: '600',
                      color: formData.skillLevel === level ? '#FFF' : textColor,
                      textTransform: 'capitalize',
                    }}>
                      {level}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Duration */}
            <View style={{ marginBottom: 16 }}>
              <ThemedText style={{ fontSize: 13, fontWeight: '600', marginBottom: 8, color: '#999' }}>
                Available Time
              </ThemedText>
              <View style={{
                backgroundColor: backgroundColor,
                borderWidth: 1,
                borderColor: borderColor,
                borderRadius: 12,
                overflow: 'hidden',
              }}>
                {DURATION_OPTIONS.map((duration) => (
                  <TouchableOpacity
                    key={duration}
                    onPress={() => handleInputChange('duration', duration)}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      backgroundColor: formData.duration === duration ? '#10B981' + '15' : 'transparent',
                      borderBottomWidth: 1,
                      borderBottomColor: borderColor,
                    }}
                  >
                    <ThemedText style={{ 
                      fontSize: 14,
                      color: formData.duration === duration ? '#10B981' : textColor,
                      fontWeight: formData.duration === duration ? '600' : '400',
                    }}>
                      {duration}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Interests */}
            <View style={{ marginBottom: 16 }}>
              <ThemedText style={{ fontSize: 13, fontWeight: '600', marginBottom: 8, color: '#999' }}>
                Your Interests (Optional)
              </ThemedText>
              <TextInput
                value={formData.interests}
                onChangeText={(value) => handleInputChange('interests', value)}
                placeholder="E.g., gaming, social media, automation..."
                placeholderTextColor="#999"
                style={{
                  backgroundColor: backgroundColor,
                  borderWidth: 1,
                  borderColor: borderColor,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 15,
                  color: textColor,
                }}
              />
            </View>

            {/* Goals */}
            <View style={{ marginBottom: 24 }}>
              <ThemedText style={{ fontSize: 13, fontWeight: '600', marginBottom: 8, color: '#999' }}>
                Learning Goals (Optional)
              </ThemedText>
              <TextInput
                value={formData.goals}
                onChangeText={(value) => handleInputChange('goals', value)}
                placeholder="What do you want to achieve?"
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
                style={{
                  backgroundColor: backgroundColor,
                  borderWidth: 1,
                  borderColor: borderColor,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 15,
                  color: textColor,
                  minHeight: 80,
                  textAlignVertical: 'top',
                }}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!formData.topic.trim()}
              style={{
                backgroundColor: !formData.topic.trim() ? '#999' : '#10B981',
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: 'center',
              }}
            >
              <ThemedText style={{ fontSize: 16, fontWeight: '700', color: '#FFF' }}>
                Find Projects
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {generating && (
          <View style={{
            backgroundColor: cardColor,
            borderRadius: 16,
            padding: 40,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: borderColor,
          }}>
            <ActivityIndicator size="large" color="#10B981" />
            <ThemedText style={{ marginTop: 16, fontSize: 15, color: '#999' }}>
              AI is finding the perfect projects for you...
            </ThemedText>
          </View>
        )}

        {projects && (
          <View>
            {/* General Tips */}
            {projects.generalTips?.length > 0 && (
              <View style={{
                backgroundColor: "#4f46e5" + '15',
                borderRadius: 16,
                padding: 16,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: "#4f46e5" + '40',
              }}>
                <ThemedText style={{ fontSize: 16, fontWeight: '700', marginBottom: 12 }}>
                  💡 Learning Tips
                </ThemedText>
                {projects.generalTips.map((tip, idx) => (
                  <ThemedText key={idx} style={{ fontSize: 13, color: '#999', marginBottom: 6 }}>
                    • {tip}
                  </ThemedText>
                ))}
              </View>
            )}

            {/* Skills to Learn */}
            {projects.skillsToLearn?.length > 0 && (
              <View style={{
                backgroundColor: '#8B5CF6' + '15',
                borderRadius: 16,
                padding: 16,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: '#8B5CF6' + '40',
              }}>
                <ThemedText style={{ fontSize: 16, fontWeight: '700', marginBottom: 12 }}>
                  🎯 Skills You'll Develop
                </ThemedText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {projects.skillsToLearn.map((skill, idx) => (
                    <View key={idx} style={{
                      backgroundColor: '#8B5CF6' + '30',
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 8,
                    }}>
                      <ThemedText style={{ fontSize: 12, fontWeight: '600', color: '#8B5CF6' }}>
                        {skill}
                      </ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Projects */}
            {projects.recommendedProjects?.map((project, idx) => {
              const diffColor = getDifficultyColor(project.difficulty);
              return (
                <View key={idx} style={{
                  backgroundColor: cardColor,
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: borderColor,
                }}>
                  {/* Header */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        <View style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          backgroundColor: '#F59E0B',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12,
                        }}>
                          <ThemedText style={{ fontSize: 16, fontWeight: '700', color: '#FFF' }}>
                            #{idx + 1}
                          </ThemedText>
                        </View>
                        <View style={{ flex: 1 }}>
                          <ThemedText style={{ fontSize: 18, fontWeight: '700', marginBottom: 4 }}>
                            {project.title}
                          </ThemedText>
                          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                            <View style={{
                              backgroundColor: diffColor.bg,
                              paddingHorizontal: 10,
                              paddingVertical: 4,
                              borderRadius: 6,
                            }}>
                              <ThemedText style={{ fontSize: 11, fontWeight: '700', color: diffColor.text }}>
                                {project.difficulty}
                              </ThemedText>
                            </View>
                            <ThemedText style={{ fontSize: 12, color: '#999' }}>
                              ⏱️ {project.duration}
                            </ThemedText>
                          </View>
                        </View>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <ThemedText style={{ fontSize: 24, fontWeight: '700', color: '#F59E0B' }}>
                        {project.matchScore}%
                      </ThemedText>
                      <ThemedText style={{ fontSize: 10, color: '#999' }}>
                        Match
                      </ThemedText>
                    </View>
                  </View>

                  <ThemedText style={{ fontSize: 14, color: '#999', marginBottom: 16, lineHeight: 20 }}>
                    {project.description}
                  </ThemedText>

                  {/* Learning Outcomes */}
                  {project.learningOutcomes?.length > 0 && (
                    <View style={{ marginBottom: 16 }}>
                      <ThemedText style={{ fontSize: 15, fontWeight: '700', marginBottom: 8 }}>
                        ✓ What You'll Learn
                      </ThemedText>
                      {project.learningOutcomes.map((outcome, i) => (
                        <ThemedText key={i} style={{ fontSize: 13, color: '#999', marginBottom: 4 }}>
                          → {outcome}
                        </ThemedText>
                      ))}
                    </View>
                  )}

                  {/* Phases */}
                  {project.phases?.length > 0 && (
                    <View style={{ marginBottom: 16 }}>
                      <ThemedText style={{ fontSize: 15, fontWeight: '700', marginBottom: 12 }}>
                        📋 Project Roadmap
                      </ThemedText>
                      {project.phases.map((phase, i) => (
                        <View key={i} style={{
                          backgroundColor: backgroundColor,
                          borderRadius: 12,
                          padding: 12,
                          marginBottom: 8,
                          borderWidth: 1,
                          borderColor: borderColor,
                        }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                            <View style={{
                              width: 24,
                              height: 24,
                              borderRadius: 12,
                              backgroundColor: "#4f46e5",
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: 8,
                            }}>
                              <ThemedText style={{ fontSize: 11, fontWeight: '700', color: '#FFF' }}>
                                {i + 1}
                              </ThemedText>
                            </View>
                            <ThemedText style={{ fontSize: 14, fontWeight: '700', flex: 1 }}>
                              {phase.title}
                            </ThemedText>
                            <ThemedText style={{ fontSize: 11, color: '#999' }}>
                              {phase.estimatedTime}
                            </ThemedText>
                          </View>
                          {phase.tasks?.map((task, j) => (
                            <ThemedText key={j} style={{ fontSize: 12, color: '#999', marginBottom: 4, marginLeft: 32 }}>
                              ▸ {task}
                            </ThemedText>
                          ))}
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Challenges & Extensions */}
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    {project.challenges?.length > 0 && (
                      <View style={{
                        flex: 1,
                        backgroundColor: '#EF4444' + '15',
                        borderRadius: 12,
                        padding: 12,
                      }}>
                        <ThemedText style={{ fontSize: 13, fontWeight: '700', marginBottom: 8, color: '#EF4444' }}>
                          ⚠️ Challenges
                        </ThemedText>
                        {project.challenges.map((challenge, i) => (
                          <ThemedText key={i} style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>
                            • {challenge}
                          </ThemedText>
                        ))}
                      </View>
                    )}
                    {project.extensions?.length > 0 && (
                      <View style={{
                        flex: 1,
                        backgroundColor: '#10B981' + '15',
                        borderRadius: 12,
                        padding: 12,
                      }}>
                        <ThemedText style={{ fontSize: 13, fontWeight: '700', marginBottom: 8, color: '#10B981' }}>
                          🚀 Extensions
                        </ThemedText>
                        {project.extensions.map((ext, i) => (
                          <ThemedText key={i} style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>
                            • {ext}
                          </ThemedText>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}
