/**
 * iGyan App - Step-by-Step Guide Generator
 * AI-powered learning journey architect
 */

import React, { useState, useRef, useEffect } from 'react';
import { ScrollView, View, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import { IconSymbol } from '../../components/IconSymbol';
import Header from '../../components/Header';
import { useThemeColor } from '../../hooks/useThemeColor';
import { useSideNav } from '../../utils/SideNavContext';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

const DETAIL_LEVEL_COPY = {
  quickstart: 'Deliver a compact 4-step guide focused on essential actions and momentum.',
  standard: 'Deliver a balanced 5-7 step guide with context, actions, and guidance.',
  deepdive: 'Deliver an in-depth 7-9 step guide with detailed explanations, decision points, and best practices.'
};

const AUDIENCE_OPTIONS = [
  { value: 'self', label: 'Personal Learning' },
  { value: 'students', label: 'Students/Class' },
  { value: 'team', label: 'Team/Collaborative' },
  { value: 'client', label: 'Client Delivery' }
];

const TIMEFRAME_OPTIONS = [
  '1-2 days',
  '3-5 days',
  '1-2 weeks',
  '3-4 weeks',
  '1-2 months'
];

const DETAIL_LEVEL_OPTIONS = [
  { value: 'quickstart', label: 'Quickstart' },
  { value: 'standard', label: 'Standard' },
  { value: 'deepdive', label: 'Deep Dive' }
];

export default function StepByStepGuidePage() {
  const scrollViewRef = useRef(null);
  const { openSideNav } = useSideNav();
  const [formData, setFormData] = useState({
    topic: '',
    goal: '',
    audience: 'self',
    timeframe: '1-2 weeks',
    detailLevel: 'standard',
    constraints: ''
  });
  const [guide, setGuide] = useState(null);
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
      Alert.alert('Required', 'Please enter a focus area');
      return;
    }

    setGenerating(true);
    setShowForm(false);

    const goalText = formData.goal?.trim() || 'Develop practical understanding';
    const constraintsText = formData.constraints?.trim() || '';
    const audienceLabel = AUDIENCE_OPTIONS.find(o => o.value === formData.audience)?.label || 'Personal Learning';

    const prompt = `Create a clear, actionable step-by-step guide in JSON format.

Topic: ${formData.topic}
Audience: ${audienceLabel}
Primary Goal: ${goalText}
Desired Timeframe: ${formData.timeframe}
Detail Expectation: ${DETAIL_LEVEL_COPY[formData.detailLevel]}
Constraints or Special Notes: ${constraintsText || 'None'}

Instructions:
- Tailor the tone for ${audienceLabel.toLowerCase()}.
- Align depth and pacing to ${formData.timeframe} and ${formData.detailLevel} expectations.
- Provide a sequence of steps that progressively builds understanding and output.
- Use practical, realistic language and include hands-on actions.
- Include checkpoints, deliverables, and reminders to verify progress.
- Keep the plan feasible for the stated timeframe.
- Avoid placeholder text; use concrete advice.

Return the response in this EXACT JSON format:
{
  "topic": "Topic name",
  "overview": {
    "goal": "Primary goal",
    "summary": "Brief summary",
    "estimatedDuration": "e.g., 2-3 weeks",
    "difficulty": "Beginner/Intermediate/Advanced"
  },
  "prerequisites": ["Prerequisite 1", "Prerequisite 2"],
  "materials": ["Material 1", "Material 2"],
  "steps": [
    {
      "stepNumber": 1,
      "title": "Step title",
      "objective": "What this step achieves",
      "actions": ["Action 1", "Action 2"],
      "tips": ["Tip 1", "Tip 2"],
      "estimatedTime": "e.g., 2-3 days"
    }
  ],
  "followUp": {
    "nextActions": ["Action 1", "Action 2"],
    "successMetrics": ["Metric 1", "Metric 2"]
  }
}

Provide ONLY valid JSON, no additional commentary.`;

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
              content: 'You are an instructional design expert who creates precise, motivating step-by-step plans for learners and teams. Always return valid JSON responses that are grounded in achievable actions.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 3200,
          response_format: { type: 'json_object' }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate guide');
      }

      const data = await response.json();
      const generatedContent = data.choices[0].message.content;
      const parsedData = JSON.parse(generatedContent);
      setGuide(parsedData);
    } catch (err) {
      console.error('Error generating guide:', err);
      Alert.alert('Error', 'Failed to generate guide. Please try again.');
      setShowForm(true);
    } finally {
      setGenerating(false);
    }
  };

  const resetForm = () => {
    setGuide(null);
    setShowForm(true);
    setFormData({
      topic: '',
      goal: '',
      audience: 'self',
      timeframe: '1-2 weeks',
      detailLevel: 'standard',
      constraints: ''
    });
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      {/* Header */}
      <Header 
        title="Step-by-Step Guide" 
        onMenuPress={openSideNav} 
        rightComponent={
          guide ? (
            <TouchableOpacity
              onPress={resetForm}
              style={{
                backgroundColor: "#4f46e5" + '20',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: "#4f46e5",
              }}
            >
              <ThemedText style={{ fontSize: 13, fontWeight: '600', color: "#4f46e5" }}>
                New Guide
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
        {showForm && !guide && (
          <View style={{ marginBottom: 20 }}>
            <ThemedText style={{ fontSize: 18, fontWeight: '700', marginBottom: 16 }}>
              Blueprint Inputs
            </ThemedText>

            {/* Topic */}
            <View style={{ marginBottom: 16 }}>
              <ThemedText style={{ fontSize: 13, fontWeight: '600', marginBottom: 8, color: '#999' }}>
                Focus Area *
              </ThemedText>
              <TextInput
                value={formData.topic}
                onChangeText={(value) => handleInputChange('topic', value)}
                placeholder="E.g., Launch a student podcast, learn React Native..."
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

            {/* Goal */}
            <View style={{ marginBottom: 16 }}>
              <ThemedText style={{ fontSize: 13, fontWeight: '600', marginBottom: 8, color: '#999' }}>
                Desired Outcome
              </ThemedText>
              <TextInput
                value={formData.goal}
                onChangeText={(value) => handleInputChange('goal', value)}
                placeholder="What does success look like?"
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

            {/* Audience & Timeframe */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <ThemedText style={{ fontSize: 13, fontWeight: '600', marginBottom: 8, color: '#999' }}>
                  Audience
                </ThemedText>
                <View style={{
                  backgroundColor: backgroundColor,
                  borderWidth: 1,
                  borderColor: borderColor,
                  borderRadius: 12,
                  overflow: 'hidden',
                }}>
                  {AUDIENCE_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => handleInputChange('audience', option.value)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        backgroundColor: formData.audience === option.value ? "#4f46e5" + '15' : 'transparent',
                        borderBottomWidth: 1,
                        borderBottomColor: borderColor,
                      }}
                    >
                      <ThemedText style={{ 
                        fontSize: 14,
                        color: formData.audience === option.value ? "#4f46e5" : textColor,
                        fontWeight: formData.audience === option.value ? '600' : '400',
                      }}>
                        {option.label}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={{ flex: 1 }}>
                <ThemedText style={{ fontSize: 13, fontWeight: '600', marginBottom: 8, color: '#999' }}>
                  Duration
                </ThemedText>
                <View style={{
                  backgroundColor: backgroundColor,
                  borderWidth: 1,
                  borderColor: borderColor,
                  borderRadius: 12,
                  overflow: 'hidden',
                }}>
                  {TIMEFRAME_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option}
                      onPress={() => handleInputChange('timeframe', option)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        backgroundColor: formData.timeframe === option ? "#4f46e5" + '15' : 'transparent',
                        borderBottomWidth: 1,
                        borderBottomColor: borderColor,
                      }}
                    >
                      <ThemedText style={{ 
                        fontSize: 14,
                        color: formData.timeframe === option ? "#4f46e5" : textColor,
                        fontWeight: formData.timeframe === option ? '600' : '400',
                      }}>
                        {option}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Detail Level */}
            <View style={{ marginBottom: 16 }}>
              <ThemedText style={{ fontSize: 13, fontWeight: '600', marginBottom: 8, color: '#999' }}>
                Depth Profile
              </ThemedText>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {DETAIL_LEVEL_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => handleInputChange('detailLevel', option.value)}
                    style={{
                      flex: 1,
                      backgroundColor: formData.detailLevel === option.value ? "#4f46e5" : cardColor,
                      borderWidth: 1,
                      borderColor: formData.detailLevel === option.value ? "#4f46e5" : borderColor,
                      borderRadius: 12,
                      paddingVertical: 12,
                      alignItems: 'center',
                    }}
                  >
                    <ThemedText style={{ 
                      fontSize: 13,
                      fontWeight: '600',
                      color: formData.detailLevel === option.value ? '#FFF' : textColor,
                    }}>
                      {option.label}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
              <ThemedText style={{ fontSize: 11, color: '#999', marginTop: 6 }}>
                {DETAIL_LEVEL_COPY[formData.detailLevel]}
              </ThemedText>
            </View>

            {/* Constraints */}
            <View style={{ marginBottom: 24 }}>
              <ThemedText style={{ fontSize: 13, fontWeight: '600', marginBottom: 8, color: '#999' }}>
                Constraints & Context
              </ThemedText>
              <TextInput
                value={formData.constraints}
                onChangeText={(value) => handleInputChange('constraints', value)}
                placeholder="Tools on hand, dependencies, constraints..."
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
                backgroundColor: !formData.topic.trim() ? '#999' : "#4f46e5",
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: 'center',
              }}
            >
              <ThemedText style={{ fontSize: 16, fontWeight: '700', color: '#FFF' }}>
                Build Blueprint
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
            <ActivityIndicator size="large" color="#4f46e5" />
            <ThemedText style={{ marginTop: 16, fontSize: 15, color: '#999' }}>
              AI is composing your personalized blueprint...
            </ThemedText>
          </View>
        )}

        {guide && (
          <View>
            {/* Overview */}
            <View style={{
              backgroundColor: cardColor,
              borderRadius: 16,
              padding: 20,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: borderColor,
            }}>
              <ThemedText style={{ fontSize: 22, fontWeight: '700', marginBottom: 8 }}>
                {guide.topic}
              </ThemedText>
              <ThemedText style={{ fontSize: 14, color: '#999', marginBottom: 12 }}>
                {guide.overview?.summary}
              </ThemedText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <View style={{
                  backgroundColor: "#4f46e5" + '20',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                }}>
                  <ThemedText style={{ fontSize: 12, fontWeight: '600', color: "#4f46e5" }}>
                    {guide.overview?.estimatedDuration}
                  </ThemedText>
                </View>
                <View style={{
                  backgroundColor: '#10B981' + '20',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                }}>
                  <ThemedText style={{ fontSize: 12, fontWeight: '600', color: '#10B981' }}>
                    {guide.overview?.difficulty}
                  </ThemedText>
                </View>
              </View>
            </View>

            {/* Prerequisites & Materials */}
            {(guide.prerequisites?.length > 0 || guide.materials?.length > 0) && (
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                {guide.prerequisites?.length > 0 && (
                  <View style={{
                    flex: 1,
                    backgroundColor: cardColor,
                    borderRadius: 16,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: borderColor,
                  }}>
                    <ThemedText style={{ fontSize: 13, fontWeight: '700', marginBottom: 12, textTransform: 'uppercase' }}>
                      Prerequisites
                    </ThemedText>
                    {guide.prerequisites.map((item, idx) => (
                      <ThemedText key={idx} style={{ fontSize: 13, color: '#999', marginBottom: 6 }}>
                        • {item}
                      </ThemedText>
                    ))}
                  </View>
                )}

                {guide.materials?.length > 0 && (
                  <View style={{
                    flex: 1,
                    backgroundColor: cardColor,
                    borderRadius: 16,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: borderColor,
                  }}>
                    <ThemedText style={{ fontSize: 13, fontWeight: '700', marginBottom: 12, textTransform: 'uppercase' }}>
                      Materials
                    </ThemedText>
                    {guide.materials.map((item, idx) => (
                      <ThemedText key={idx} style={{ fontSize: 13, color: '#999', marginBottom: 6 }}>
                        • {item}
                      </ThemedText>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Steps */}
            <View style={{
              backgroundColor: cardColor,
              borderRadius: 16,
              padding: 20,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: borderColor,
            }}>
              <ThemedText style={{ fontSize: 18, fontWeight: '700', marginBottom: 20 }}>
                Milestone Roadmap
              </ThemedText>
              {guide.steps?.map((step, idx) => (
                <View key={idx} style={{ marginBottom: 20 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
                    <View style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: "#4f46e5",
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}>
                      <ThemedText style={{ fontSize: 14, fontWeight: '700', color: '#FFF' }}>
                        {step.stepNumber}
                      </ThemedText>
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={{ fontSize: 16, fontWeight: '700', marginBottom: 4 }}>
                        {step.title}
                      </ThemedText>
                      {step.estimatedTime && (
                        <ThemedText style={{ fontSize: 12, color: '#999' }}>
                          ⏱️ {step.estimatedTime}
                        </ThemedText>
                      )}
                    </View>
                  </View>

                  {step.objective && (
                    <ThemedText style={{ fontSize: 14, color: '#999', marginBottom: 12, lineHeight: 20 }}>
                      <ThemedText style={{ fontWeight: '600', color: textColor }}>Objective:</ThemedText> {step.objective}
                    </ThemedText>
                  )}

                  {step.actions?.length > 0 && (
                    <View style={{
                      backgroundColor: "#4f46e5" + '10',
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 12,
                    }}>
                      <ThemedText style={{ fontSize: 12, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase' }}>
                        Action Steps
                      </ThemedText>
                      {step.actions.map((action, i) => (
                        <ThemedText key={i} style={{ fontSize: 13, color: '#999', marginBottom: 4 }}>
                          • {action}
                        </ThemedText>
                      ))}
                    </View>
                  )}

                  {step.tips?.length > 0 && (
                    <View style={{
                      backgroundColor: '#10B981' + '10',
                      borderRadius: 12,
                      padding: 12,
                    }}>
                      <ThemedText style={{ fontSize: 12, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase' }}>
                        💡 Expert Tips
                      </ThemedText>
                      {step.tips.map((tip, i) => (
                        <ThemedText key={i} style={{ fontSize: 13, color: '#999', marginBottom: 4 }}>
                          • {tip}
                        </ThemedText>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>

            {/* Follow Up */}
            {guide.followUp && (
              <View style={{
                backgroundColor: cardColor,
                borderRadius: 16,
                padding: 20,
                borderWidth: 1,
                borderColor: borderColor,
              }}>
                <ThemedText style={{ fontSize: 18, fontWeight: '700', marginBottom: 16 }}>
                  Next Steps
                </ThemedText>

                {guide.followUp.nextActions?.length > 0 && (
                  <View style={{ marginBottom: 16 }}>
                    <ThemedText style={{ fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                      🎯 Next Actions
                    </ThemedText>
                    {guide.followUp.nextActions.map((action, idx) => (
                      <ThemedText key={idx} style={{ fontSize: 13, color: '#999', marginBottom: 4 }}>
                        {idx + 1}. {action}
                      </ThemedText>
                    ))}
                  </View>
                )}

                {guide.followUp.successMetrics?.length > 0 && (
                  <View>
                    <ThemedText style={{ fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                      ⭐ Success Metrics
                    </ThemedText>
                    {guide.followUp.successMetrics.map((metric, idx) => (
                      <ThemedText key={idx} style={{ fontSize: 13, color: '#999', marginBottom: 4 }}>
                        • {metric}
                      </ThemedText>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}
