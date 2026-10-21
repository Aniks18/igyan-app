/**
 * iGyan App - Tools Page
 * Collection of learning and productivity tools
 */

import React from 'react';
import { ScrollView, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import { IconSymbol } from '../../components/IconSymbol';
import Header from '../../components/Header';
import { useThemeColor } from '../../hooks/useThemeColor';
import { useSideNav } from '../../utils/SideNavContext';
import { exploreStyles } from '../../styles/pages/exploreStyles';

const tools = [
  {
    id: 'quiz-me',
    title: 'Quiz Me',
    description: 'AI-powered quiz generation for students',
    icon: 'questionmark.circle.fill',
    color: '#8B5CF6',
    route: '/quiz-me',
  },
  {
    id: 'teacher-prep',
    title: 'Teacher Prep',
    description: 'AI-powered preparation for educators',
    icon: 'graduationcap.fill',
    color: '#10B981',
    route: '/teacher-prep',
  },
  {
    id: 'code-tutor',
    title: 'Code Tutor',
    description: 'AI-powered coding teacher for all programming languages',
    icon: 'chevron.left.forwardslash.chevron.right',
    color: "#4f46e5",
    route: '/tools/code-tutor',
  },
  {
    id: 'project-learning',
    title: 'Project-Based Learning',
    description: 'Get personalized project recommendations',
    icon: 'cube.box.fill',
    color: '#F97316',
    route: '/tools/project-learning',
  },
  {
    id: 'step-by-step',
    title: 'Step-by-Step Guide',
    description: 'AI-powered learning journey architect',
    icon: 'list.number',
    color: '#F59E0B',
    route: '/tools/step-by-step',
  },
  {
    id: 'text-summarizer',
    title: 'Text Summarizer',
    description: 'Condense long text into clear summaries',
    icon: 'doc.text.fill',
    color: '#06B6D4',
    route: '/tools/text-summarizer',
  },
];

export default function ToolsPage() {
  const router = useRouter();
  const { openSideNav } = useSideNav();
  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');

  const handleToolPress = (tool) => {
    if (tool.id === 'code-tutor' || tool.id === 'step-by-step' || tool.id === 'project-learning' || tool.id === 'text-summarizer' || tool.id === 'quiz-me' || tool.id === 'teacher-prep') {
      router.push(tool.route);
    } else {
      // Other tools - coming soon
      alert(`${tool.title} - Coming Soon!`);
    }
  };

  return (
    <ThemedView style={exploreStyles.container}>
      <Header 
        title="Learning Tools" 
        onMenuPress={openSideNav} 
      />
      <ScrollView>
        {/* Tools description */}
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <ThemedText style={{ fontSize: 14, color: '#999', marginBottom: 16 }}>
            Powerful tools to enhance your learning experience
          </ThemedText>
        </View>

        {/* Tools Grid */}
        <View style={{ padding: 16, paddingTop: 0 }}>
          {tools.map((tool) => (
            <TouchableOpacity 
              key={tool.id}
              onPress={() => handleToolPress(tool)}
              activeOpacity={0.7}
            >
              <View style={[
                {
                  backgroundColor: cardColor,
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: borderColor,
                  flexDirection: 'row',
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }
              ]}>
                {/* Icon */}
                <View style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  backgroundColor: tool.color + '20',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                }}>
                  <IconSymbol name={tool.icon} size={28} color={tool.color} />
                </View>

                {/* Content */}
                <View style={{ flex: 1 }}>
                  <ThemedText style={{ 
                    fontSize: 18, 
                    fontWeight: '600', 
                    marginBottom: 4 
                  }}>
                    {tool.title}
                  </ThemedText>
                  <ThemedText style={{ 
                    fontSize: 14, 
                    color: '#999',
                    lineHeight: 20 
                  }}>
                    {tool.description}
                  </ThemedText>
                </View>

                {/* Arrow */}
                <IconSymbol name="chevron.right" size={20} color="#999" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
}
