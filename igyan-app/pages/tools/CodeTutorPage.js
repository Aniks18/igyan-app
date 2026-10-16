/**
 * iGyan App - Code Tutor Page
 * AI-powered coding teacher for all programming languages
 */

import React, { useState, useRef, useEffect } from 'react';
import { ScrollView, View, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import { IconSymbol } from '../../components/IconSymbol';
import Header from '../../components/Header';
import { useThemeColor } from '../../hooks/useThemeColor';
import { useSideNav } from '../../utils/SideNavContext';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

const PROGRAMMING_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript', extension: 'js' },
  { value: 'python', label: 'Python', extension: 'py' },
  { value: 'java', label: 'Java', extension: 'java' },
  { value: 'cpp', label: 'C++', extension: 'cpp' },
  { value: 'c', label: 'C', extension: 'c' },
  { value: 'html', label: 'HTML', extension: 'html' },
  { value: 'css', label: 'CSS', extension: 'css' },
  { value: 'typescript', label: 'TypeScript', extension: 'ts' },
  { value: 'php', label: 'PHP', extension: 'php' },
  { value: 'ruby', label: 'Ruby', extension: 'rb' },
  { value: 'go', label: 'Go', extension: 'go' },
  { value: 'rust', label: 'Rust', extension: 'rs' },
  { value: 'swift', label: 'Swift', extension: 'swift' },
  { value: 'kotlin', label: 'Kotlin', extension: 'kt' },
];

const STARTER_PROMPTS = [
  'Explain variables and data types',
  'How do I create a function?',
  'Help me debug this code',
  'What are loops?',
  'Teach me about arrays',
  'Best practices for beginners',
];

export default function CodeTutorPage() {
  const router = useRouter();
  const scrollViewRef = useRef(null);
  const { openSideNav } = useSideNav();
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');
  const backgroundColor = useThemeColor({}, 'background');

  const handleLanguageChange = (newLanguage) => {
    setSelectedLanguage(newLanguage);
    setShowLanguagePicker(false);
    const languageLabel = PROGRAMMING_LANGUAGES.find(l => l.value === newLanguage)?.label;
    setMessages([
      {
        role: 'assistant',
        content: `Great! I'm now your ${languageLabel} tutor. I'll help you learn ${languageLabel} programming with clear explanations and code examples. What would you like to learn?`,
        timestamp: new Date().toISOString(),
      }
    ]);
  };

  const handleSubmit = async () => {
    if (!inputMessage.trim() || isGenerating) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsGenerating(true);

    try {
      const languageInfo = PROGRAMMING_LANGUAGES.find(l => l.value === selectedLanguage);
      const systemPrompt = `You are an expert ${languageInfo.label} programming tutor. Your role is to:
1. Teach ${languageInfo.label} concepts clearly and concisely
2. Provide working code examples in ${languageInfo.label} with proper syntax
3. Explain code line-by-line when requested
4. Help debug and fix code errors
5. Suggest best practices and modern approaches
6. Be encouraging and patient with learners

IMPORTANT: 
- Always write code examples using proper ${languageInfo.label} syntax
- Provide clear explanations before and after code examples
- Keep explanations beginner-friendly but technically accurate
- When explaining code, break it down step-by-step`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.slice(-10).map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            { role: 'user', content: inputMessage }
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from AI tutor');
      }

      const data = await response.json();
      const assistantMessage = {
        role: 'assistant',
        content: data.choices[0].message.content,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Error:', err);
      Alert.alert('Error', 'Failed to get response. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const renderMessage = (message, index) => {
    const isUser = message.role === 'user';
    return (
      <View
        key={index}
        style={{
          flexDirection: 'row',
          marginBottom: 16,
          justifyContent: isUser ? 'flex-end' : 'flex-start',
        }}
      >
        {!isUser && (
          <View style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "#4f46e5",
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 8,
          }}>
            <IconSymbol name="chevron.left.forwardslash.chevron.right" size={20} color="#FFF" />
          </View>
        )}
        
        <View style={{
          maxWidth: '75%',
          backgroundColor: isUser ? "#4f46e5" : cardColor,
          borderRadius: 16,
          borderWidth: isUser ? 0 : 1,
          borderColor: borderColor,
          padding: 12,
        }}>
          <ThemedText style={{ 
            color: isUser ? '#FFF' : textColor,
            fontSize: 15,
            lineHeight: 22,
          }}>
            {message.content}
          </ThemedText>
        </View>

        {isUser && (
          <View style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: '#8B5CF6',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 8,
          }}>
            <IconSymbol name="person.fill" size={20} color="#FFF" />
          </View>
        )}
      </View>
    );
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      {/* Header */}
      <Header 
        title="Code Tutor" 
        onMenuPress={openSideNav} 
        showBack 
        onBackPress={() => router.back()} 
        rightComponent={
          <TouchableOpacity
            onPress={() => setShowLanguagePicker(!showLanguagePicker)}
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
              {PROGRAMMING_LANGUAGES.find(l => l.value === selectedLanguage)?.label}
            </ThemedText>
          </TouchableOpacity>
        }
      />

      {/* Language Picker */}
      {showLanguagePicker && (
        <View style={{
          backgroundColor: cardColor,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: borderColor,
          marginHorizontal: 16,
          marginTop: 8,
          maxHeight: 200,
        }}>
          <ScrollView>
            {PROGRAMMING_LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.value}
                onPress={() => handleLanguageChange(lang.value)}
                style={{
                  padding: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: borderColor,
                  backgroundColor: selectedLanguage === lang.value ? "#4f46e5" + '10' : 'transparent',
                }}
              >
                <ThemedText style={{ 
                  fontSize: 15,
                  color: selectedLanguage === lang.value ? "#4f46e5" : textColor,
                  fontWeight: selectedLanguage === lang.value ? '600' : '400',
                }}>
                  {lang.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 40 }}>
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: "#4f46e5",
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}>
              <IconSymbol name="chevron.left.forwardslash.chevron.right" size={40} color="#FFF" />
            </View>
            <ThemedText style={{ fontSize: 22, fontWeight: '700', marginBottom: 8, textAlign: 'center' }}>
              Welcome to Code Tutor!
            </ThemedText>
            <ThemedText style={{ fontSize: 14, color: '#999', marginBottom: 24, textAlign: 'center', paddingHorizontal: 32 }}>
              Select a programming language and ask me anything. I can help you learn concepts, debug code, and provide best practices.
            </ThemedText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
              {STARTER_PROMPTS.map((prompt, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setInputMessage(prompt)}
                  style={{
                    backgroundColor: cardColor,
                    borderWidth: 1,
                    borderColor: borderColor,
                    borderRadius: 12,
                    padding: 12,
                    margin: 4,
                  }}
                >
                  <ThemedText style={{ fontSize: 13 }}>{prompt}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          messages.map(renderMessage)
        )}

        {isGenerating && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <View style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "#4f46e5",
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 8,
            }}>
              <IconSymbol name="chevron.left.forwardslash.chevron.right" size={20} color="#FFF" />
            </View>
            <View style={{
              backgroundColor: cardColor,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: borderColor,
              padding: 12,
            }}>
              <ActivityIndicator size="small" color="#4f46e5" />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View style={{
        backgroundColor: cardColor,
        borderTopWidth: 1,
        borderTopColor: borderColor,
        padding: 16,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextInput
            value={inputMessage}
            onChangeText={setInputMessage}
            placeholder={`Ask me anything about ${PROGRAMMING_LANGUAGES.find(l => l.value === selectedLanguage)?.label}...`}
            placeholderTextColor="#999"
            style={{
              flex: 1,
              backgroundColor: backgroundColor,
              borderWidth: 1,
              borderColor: borderColor,
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontSize: 15,
              color: textColor,
              marginRight: 8,
            }}
            multiline
            editable={!isGenerating}
          />
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!inputMessage.trim() || isGenerating}
            style={{
              backgroundColor: (!inputMessage.trim() || isGenerating) ? '#999' : "#4f46e5",
              width: 48,
              height: 48,
              borderRadius: 24,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconSymbol 
              name={isGenerating ? 'hourglass' : 'arrow.up'} 
              size={24} 
              color="#FFF" 
            />
          </TouchableOpacity>
        </View>
      </View>
    </ThemedView>
  );
}
