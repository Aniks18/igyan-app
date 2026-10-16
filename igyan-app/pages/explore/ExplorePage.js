/**
 * iGyan App - Explore Page
 * Discover AI-powered tools and resources
 */

import React from 'react';
import { ScrollView, View, TextInput, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import { IconSymbol } from '../../components/IconSymbol';
import { useThemeColor } from '../../hooks/useThemeColor';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 cards per row with padding

const aiTools = [
  {
    id: 'ai-copilot',
    title: 'AI Copilot',
    description: 'Your personal AI tutor with memory',
    icon: 'brain.head.profile',
    color: '#8B5CF6',
  },
  {
    id: 'code-tutor',
    title: 'Code Tutor',
    description: 'Learn programming with AI guidance',
    icon: 'chevron.left.forwardslash.chevron.right',
    color: "#4f46e5",
  },
  {
    id: 'project-learning',
    title: 'Project Ideas',
    description: 'Get personalized project recommendations',
    icon: 'cube.box.fill',
    color: '#10B981',
  },
  {
    id: 'step-by-step',
    title: 'Step Guide',
    description: 'Create detailed learning roadmaps',
    icon: 'list.number',
    color: '#F59E0B',
  },
  {
    id: 'text-summarizer',
    title: 'Summarizer',
    description: 'Condense text into key insights',
    icon: 'doc.text.fill',
    color: '#06B6D4',
  },
];

export default function ExplorePage() {
  const router = useRouter();
  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');
  const backgroundColor = useThemeColor({}, 'background');

  return (
    <ThemedView style={{ flex: 1, backgroundColor }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Search */}
        <View style={{ padding: 16, paddingBottom: 8 }}>
          <ThemedText style={{ fontSize: 32, fontWeight: '800', marginBottom: 16 }}>
            Explore
          </ThemedText>
          <View style={{
            backgroundColor: cardColor,
            borderRadius: 16,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
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
              placeholder="Search tools and resources..."
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* AI Tools Section */}
        <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <View>
              <ThemedText style={{ fontSize: 24, fontWeight: '700', marginBottom: 4 }}>
                🤖 AI Tools
              </ThemedText>
              <ThemedText style={{ fontSize: 14, color: '#999' }}>
                Powered by advanced AI technology
              </ThemedText>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/tools')}
              style={{
                backgroundColor: "#4f46e5",
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 12,
              }}
            >
              <ThemedText style={{ fontSize: 13, fontWeight: '700', color: '#FFF' }}>
                View All
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Tools Grid - 2 columns */}
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 16,
            marginBottom: 24,
          }}>
            {aiTools.map((tool) => (
              <TouchableOpacity
                key={tool.id}
                onPress={() => {
                  if (tool.id === 'ai-copilot') {
                    router.push('/copilot');
                  } else {
                    router.push('/tools');
                  }
                }}
                activeOpacity={0.7}
                style={{ width: CARD_WIDTH }}
              >
                <View style={{
                  backgroundColor: cardColor,
                  borderRadius: 20,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: borderColor,
                  height: 180,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  elevation: 2,
                }}>
                  <View style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    backgroundColor: tool.color + '20',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}>
                    <IconSymbol name={tool.icon} size={28} color={tool.color} />
                  </View>
                  <ThemedText style={{
                    fontSize: 17,
                    fontWeight: '700',
                    marginBottom: 6,
                    lineHeight: 22,
                  }}>
                    {tool.title}
                  </ThemedText>
                  <ThemedText style={{
                    fontSize: 13,
                    color: '#999',
                    lineHeight: 18,
                  }}>
                    {tool.description}
                  </ThemedText>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Info Card */}
          <View style={{
            backgroundColor: "#4f46e5" + '15',
            borderRadius: 20,
            padding: 20,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: "#4f46e5" + '30',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'start', gap: 16 }}>
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: "#4f46e5",
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <IconSymbol name="sparkles" size={24} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={{ fontSize: 18, fontWeight: '700', marginBottom: 8, color: "#4f46e5" }}>
                  AI-Powered Learning
                </ThemedText>
                <ThemedText style={{ fontSize: 14, lineHeight: 20, color: '#999' }}>
                  Our tools use cutting-edge AI to provide personalized learning experiences. 
                  Perfect for students and educators looking to enhance productivity.
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Coming Soon Card */}
          <View style={{
            backgroundColor: cardColor,
            borderRadius: 20,
            padding: 20,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: borderColor,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#10B981' + '20',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}>
                <IconSymbol name="bell.fill" size={20} color="#10B981" />
              </View>
              <ThemedText style={{ fontSize: 18, fontWeight: '700', flex: 1 }}>
                More Tools Coming Soon
              </ThemedText>
            </View>
            <ThemedText style={{ fontSize: 14, lineHeight: 20, color: '#999' }}>
              We're constantly adding new AI-powered tools based on user feedback. 
              Stay tuned for quiz generators, flashcards, study planners, and more!
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}
