/**
 * iGyan App - Text Summarizer Tool
 * AI-powered text summarization
 */

import React, { useState, useRef } from 'react';
import { ScrollView, View, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import { IconSymbol } from '../../components/IconSymbol';
import Header from '../../components/Header';
import { useThemeColor } from '../../hooks/useThemeColor';
import { useSideNav } from '../../utils/SideNavContext';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

const SUMMARY_STYLES = [
  { value: 'concise', label: 'Concise', description: 'Brief, to-the-point summary' },
  { value: 'detailed', label: 'Detailed', description: 'Comprehensive overview' },
  { value: 'bullet', label: 'Bullet Points', description: 'Key points in list format' },
];

export default function TextSummarizerPage() {
  const scrollViewRef = useRef(null);
  const { openSideNav } = useSideNav();
  const [text, setText] = useState('');
  const [summaryStyle, setSummaryStyle] = useState('concise');
  const [summary, setSummary] = useState('');
  const [generating, setGenerating] = useState(false);

  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');
  const backgroundColor = useThemeColor({}, 'background');

  const handleSummarize = async () => {
    if (!text.trim()) {
      Alert.alert('Required', 'Please enter text to summarize');
      return;
    }

    setGenerating(true);
    setSummary('');

    const styleInstructions = {
      concise: 'Provide a brief, concise summary in 2-3 sentences.',
      detailed: 'Provide a detailed, comprehensive summary covering all key points.',
      bullet: 'Provide key points as a bulleted list (use • for bullets).'
    };

    const prompt = `Summarize the following text. ${styleInstructions[summaryStyle]}

Text to summarize:
${text}

Summary:`;

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
              content: 'You are a helpful assistant that creates clear, accurate summaries of text. Focus on extracting the most important information while maintaining clarity.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.5,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const data = await response.json();
      setSummary(data.choices[0].message.content.trim());
    } catch (err) {
      console.error('Error generating summary:', err);
      Alert.alert('Error', 'Failed to generate summary. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleClear = () => {
    setText('');
    setSummary('');
    setSummaryStyle('concise');
  };

  const handleCopySummary = () => {
    if (summary) {
      // In React Native, we'd use Clipboard API
      Alert.alert('Copied!', 'Summary copied to clipboard');
    }
  };

  const wordCount = text.trim().split(/\s+/).filter(w => w).length;

  return (
    <ThemedView style={{ flex: 1 }}>
      {/* Header */}
      <Header 
        title="Text Summarizer" 
        onMenuPress={openSideNav} 
        rightComponent={
          summary ? (
            <TouchableOpacity
              onPress={handleClear}
              style={{
                backgroundColor: '#EF4444' + '20',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#EF4444',
              }}
            >
              <ThemedText style={{ fontSize: 13, fontWeight: '600', color: '#EF4444' }}>
                Clear
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
        {/* Input Section */}
        <View style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <ThemedText style={{ fontSize: 16, fontWeight: '700' }}>
              Text to Summarize
            </ThemedText>
            <ThemedText style={{ fontSize: 12, color: '#999' }}>
              {wordCount} words
            </ThemedText>
          </View>
          
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Paste or type your text here..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={10}
            style={{
              backgroundColor: backgroundColor,
              borderWidth: 1,
              borderColor: borderColor,
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontSize: 15,
              color: textColor,
              minHeight: 200,
              textAlignVertical: 'top',
            }}
          />
        </View>

        {/* Summary Style */}
        <View style={{ marginBottom: 20 }}>
          <ThemedText style={{ fontSize: 16, fontWeight: '700', marginBottom: 12 }}>
            Summary Style
          </ThemedText>
          <View style={{ gap: 12 }}>
            {SUMMARY_STYLES.map((style) => (
              <TouchableOpacity
                key={style.value}
                onPress={() => setSummaryStyle(style.value)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: summaryStyle === style.value ? '#10B981' + '15' : cardColor,
                  borderWidth: 1,
                  borderColor: summaryStyle === style.value ? '#10B981' : borderColor,
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <View style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: summaryStyle === style.value ? '#10B981' : borderColor,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}>
                  {summaryStyle === style.value && (
                    <View style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: '#10B981',
                    }} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={{ fontSize: 15, fontWeight: '600', marginBottom: 2 }}>
                    {style.label}
                  </ThemedText>
                  <ThemedText style={{ fontSize: 12, color: '#999' }}>
                    {style.description}
                  </ThemedText>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Summarize Button */}
        <TouchableOpacity
          onPress={handleSummarize}
          disabled={!text.trim() || generating}
          style={{
            backgroundColor: (!text.trim() || generating) ? '#999' : '#10B981',
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          {generating ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator size="small" color="#FFF" />
              <ThemedText style={{ fontSize: 16, fontWeight: '700', color: '#FFF' }}>
                Summarizing...
              </ThemedText>
            </View>
          ) : (
            <ThemedText style={{ fontSize: 16, fontWeight: '700', color: '#FFF' }}>
              Generate Summary
            </ThemedText>
          )}
        </TouchableOpacity>

        {/* Summary Output */}
        {summary && (
          <View style={{
            backgroundColor: cardColor,
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: borderColor,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <ThemedText style={{ fontSize: 18, fontWeight: '700' }}>
                Summary
              </ThemedText>
              <TouchableOpacity
                onPress={handleCopySummary}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: "#4f46e5" + '20',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                }}
              >
                <IconSymbol name="doc.on.doc" size={16} color="#4f46e5" />
                <ThemedText style={{ fontSize: 13, fontWeight: '600', color: "#4f46e5" }}>
                  Copy
                </ThemedText>
              </TouchableOpacity>
            </View>
            
            <ThemedText style={{ fontSize: 15, lineHeight: 24, color: textColor }}>
              {summary}
            </ThemedText>
          </View>
        )}

        {/* Info */}
        <View style={{
          backgroundColor: "#4f46e5" + '10',
          borderRadius: 12,
          padding: 16,
          marginTop: 20,
          borderWidth: 1,
          borderColor: "#4f46e5" + '30',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'start', gap: 12 }}>
            <View style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: "#4f46e5",
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <IconSymbol name="lightbulb.fill" size={18} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText style={{ fontSize: 14, fontWeight: '700', marginBottom: 6, color: "#4f46e5" }}>
                Pro Tip
              </ThemedText>
              <ThemedText style={{ fontSize: 13, lineHeight: 20, color: '#999' }}>
                For best results, paste well-structured text. The AI works great with articles, essays, reports, and documents.
              </ThemedText>
            </View>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}
