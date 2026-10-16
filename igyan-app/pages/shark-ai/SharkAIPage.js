/**
 * iGyan App - Shark AI Page
 * AI-powered pitch evaluation system
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  Dimensions,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as Speech from 'expo-speech';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import { IconSymbol } from '../../components/IconSymbol';
import Header from '../../components/Header';
import { useThemeColor } from '../../hooks/useThemeColor';
import { useSideNav } from '../../utils/SideNavContext';
import { useAuth } from '../../utils/AuthContext';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
const PITCH_DURATION = 300; // 5 minutes in seconds

const EVALUATION_CRITERIA = [
  { id: 1, name: 'Pitch Clarity & Structure', maxScore: 20 },
  { id: 2, name: 'Business Model Understanding', maxScore: 20 },
  { id: 3, name: 'Market Opportunity', maxScore: 20 },
  { id: 4, name: 'Financial Projections & Ask', maxScore: 20 },
  { id: 5, name: 'Communication & Passion', maxScore: 20 },
];

const LANGUAGE_CONTENT = {
  english: {
    greeting: "Hello! I'm Shark AI, your virtual investor. Upload your pitch deck and let me evaluate your business idea!",
    startPitch: "Great! Your 5-minute pitch starts now. Present your business idea clearly and passionately.",
    evaluating: "Thank you for your pitch! Let me analyze it...",
    askQuestion: "Feel free to ask any questions about your pitch or my feedback.",
  },
  hindi: {
    greeting: "नमस्ते! मैं शार्क AI हूं, आपका वर्चुअल निवेशक। अपना पिच डेक अपलोड करें और मुझे अपना बिज़नेस आइडिया evaluate करने दें!",
    startPitch: "बहुत अच्छा! आपका 5 मिनट का पिच अब शुरू होता है। अपना बिज़नेस आइडिया स्पष्ट और जुनून के साथ प्रस्तुत करें।",
    evaluating: "आपके पिच के लिए धन्यवाद! मुझे इसका विश्लेषण करने दें...",
    askQuestion: "अपने पिच या मेरी फीडबैक के बारे में कोई भी सवाल पूछें।",
  },
};

export default function SharkAIPage() {
  const { openSideNav } = useSideNav();
  const { user } = useAuth();
  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');
  const flatListRef = useRef(null);

  // State
  const [language, setLanguage] = useState('english');
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [fileId, setFileId] = useState(null);
  
  // Pitch mode state
  const [isPitchMode, setIsPitchMode] = useState(false);
  const [pitchTimer, setPitchTimer] = useState(PITCH_DURATION);
  const [pitchTranscript, setPitchTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  
  // Speech state
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Evaluation results
  const [evaluationScores, setEvaluationScores] = useState(null);

  // Initialize with greeting
  useEffect(() => {
    const greeting = {
      role: 'assistant',
      content: LANGUAGE_CONTENT[language].greeting,
      timestamp: new Date().toISOString(),
    };
    setMessages([greeting]);
    speakText(greeting.content);
  }, []);

  // Timer effect
  useEffect(() => {
    let interval;
    if (isPitchMode && pitchTimer > 0) {
      interval = setInterval(() => {
        setPitchTimer(prev => {
          if (prev <= 1) {
            handleSubmitPitch();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPitchMode, pitchTimer]);

  // Auto scroll to bottom
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const speakText = async (text) => {
    try {
      setIsSpeaking(true);
      await Speech.speak(text, {
        language: language === 'hindi' ? 'hi-IN' : 'en-US',
        pitch: 1.0,
        rate: 0.9,
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    } catch (error) {
      console.error('Speech error:', error);
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = async () => {
    await Speech.stop();
    setIsSpeaking(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const file = result.assets[0];
        setUploadedFile(file);
        setIsLoading(true);

        // For demo purposes, we'll use a placeholder content
        // In production, you'd send this to a backend for text extraction
        const content = `Business pitch document: ${file.name}`;
        setFileContent(content);
        setFileId(Date.now().toString());

        const uploadMessage = {
          role: 'assistant',
          content: `📄 Great! I've received your document "${file.name}". Now you can start your pitch! Click the "Start Pitch" button when you're ready. You'll have 5 minutes to present your business idea.`,
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, uploadMessage]);
        speakText(uploadMessage.content);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('Error', 'Failed to pick document');
      setIsLoading(false);
    }
  };

  const handleStartPitch = () => {
    setIsPitchMode(true);
    setPitchTimer(PITCH_DURATION);
    setPitchTranscript('');
    
    const startMessage = {
      role: 'assistant',
      content: LANGUAGE_CONTENT[language].startPitch,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, startMessage]);
    speakText(startMessage.content);
  };

  const handleSubmitPitch = async () => {
    setIsPitchMode(false);
    const pitchContent = pitchTranscript || inputMessage;
    
    if (!pitchContent.trim() || pitchContent.length < 50) {
      Alert.alert('Invalid Pitch', 'Please provide a more detailed pitch (at least 50 characters).');
      return;
    }

    // Add user's pitch as a message
    const userMessage = {
      role: 'user',
      content: pitchContent,
      timestamp: new Date().toISOString(),
      isPitch: true,
    };
    setMessages(prev => [...prev, userMessage]);

    // Show evaluating message
    const evaluatingMessage = {
      role: 'assistant',
      content: LANGUAGE_CONTENT[language].evaluating,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, evaluatingMessage]);

    setIsLoading(true);
    setInputMessage('');
    setPitchTranscript('');

    try {
      const evaluation = await evaluatePitch(pitchContent);
      
      const evaluationMessage = {
        role: 'assistant',
        content: evaluation.feedback,
        timestamp: new Date().toISOString(),
        isEvaluation: true,
        scores: evaluation.scores,
      };
      setMessages(prev => [...prev, evaluationMessage]);
      setEvaluationScores(evaluation.scores);
      
      // Speak summary
      speakText(`Your overall score is ${evaluation.scores.total} out of 100. ${evaluation.summary}`);
    } catch (error) {
      console.error('Evaluation error:', error);
      Alert.alert('Error', 'Failed to evaluate pitch. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const evaluatePitch = async (pitchContent) => {
    const systemPrompt = `You are Shark AI, a tough but fair business investor evaluating pitches like on Shark Tank.

Evaluate the pitch based on these criteria (score 0-20 each):
1. Pitch Clarity & Structure (20 points)
2. Business Model Understanding (20 points)
3. Market Opportunity (20 points)
4. Financial Projections & Ask (20 points)
5. Communication & Passion (20 points)

IMPORTANT: First check if the pitch is coherent and about a real business. If it's gibberish or nonsensical, give very low scores.

Respond in this JSON format:
{
  "scores": {
    "clarity": <number>,
    "businessModel": <number>,
    "market": <number>,
    "financials": <number>,
    "communication": <number>,
    "total": <number>
  },
  "summary": "<2 sentence summary>",
  "feedback": "<detailed markdown feedback with strengths, weaknesses, and advice>",
  "investment": "<Yes/No/Maybe with brief reason>"
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Document context: ${fileContent || 'No document uploaded'}\n\nPitch: ${pitchContent}` }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get AI response');
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      // Try to parse JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('JSON parse error:', e);
    }

    // Fallback response
    return {
      scores: { clarity: 10, businessModel: 10, market: 10, financials: 10, communication: 10, total: 50 },
      summary: 'Pitch evaluated.',
      feedback: content,
      investment: 'Maybe',
    };
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { 
              role: 'system', 
              content: `You are Shark AI, a helpful business investor assistant. Answer questions about pitches, business strategy, and entrepreneurship. Be encouraging but honest. ${language === 'hindi' ? 'Respond in Hindi if the user writes in Hindi.' : ''}` 
            },
            ...messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: inputMessage }
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) throw new Error('API error');

      const data = await response.json();
      const assistantMessage = {
        role: 'assistant',
        content: data.choices[0].message.content,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item, index }) => {
    const isUser = item.role === 'user';
    
    return (
      <View style={[styles.messageRow, isUser && styles.userMessageRow]}>
        {!isUser && (
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarEmoji}>🦈</Text>
          </View>
        )}
        <View style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.assistantBubble,
          { backgroundColor: isUser ? '#0891b2' : cardColor }
        ]}>
          <Text style={[styles.messageText, { color: isUser ? '#fff' : textColor }]}>
            {item.content}
          </Text>
          {item.isEvaluation && item.scores && (
            <View style={styles.scoresContainer}>
              <View style={styles.totalScoreContainer}>
                <Text style={styles.totalScoreLabel}>Overall Score</Text>
                <Text style={styles.totalScoreValue}>{item.scores.total}/100</Text>
              </View>
              {EVALUATION_CRITERIA.map((criteria, idx) => {
                const scoreKey = ['clarity', 'businessModel', 'market', 'financials', 'communication'][idx];
                const score = item.scores[scoreKey] || 0;
                const percentage = (score / criteria.maxScore) * 100;
                return (
                  <View key={criteria.id} style={styles.criteriaRow}>
                    <Text style={[styles.criteriaName, { color: textColor }]}>{criteria.name}</Text>
                    <View style={styles.progressBarContainer}>
                      <View style={[styles.progressBar, { width: `${percentage}%` }]} />
                    </View>
                    <Text style={[styles.criteriaScore, { color: textColor }]}>{score}/{criteria.maxScore}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
        {isUser && (
          <View style={[styles.avatarContainer, styles.userAvatar]}>
            <Text style={styles.avatarEmoji}>👤</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <Header 
        title="Shark AI" 
        onMenuPress={openSideNav} 
        showBack 
        onBackPress={() => router.back()} 
      />

      {/* Language Toggle */}
      <View style={[styles.languageToggle, { borderColor }]}>
        <TouchableOpacity
          style={[styles.langBtn, language === 'english' && styles.langBtnActive]}
          onPress={() => setLanguage('english')}
          disabled={isPitchMode}
        >
          <Text style={[styles.langBtnText, language === 'english' && styles.langBtnTextActive]}>
            🇬🇧 English
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.langBtn, language === 'hindi' && styles.langBtnActive]}
          onPress={() => setLanguage('hindi')}
          disabled={isPitchMode}
        >
          <Text style={[styles.langBtnText, language === 'hindi' && styles.langBtnTextActive]}>
            🇮🇳 हिंदी
          </Text>
        </TouchableOpacity>
      </View>

      {/* Timer Display */}
      {isPitchMode && (
        <View style={styles.timerContainer}>
          <IconSymbol name="clock.fill" size={20} color="#ef4444" />
          <Text style={styles.timerText}>{formatTime(pitchTimer)}</Text>
        </View>
      )}

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Loading Indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#0891b2" />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}

      {/* Bottom Actions */}
      <View style={[styles.bottomContainer, { backgroundColor: cardColor, borderTopColor: borderColor }]}>
        {/* File Upload */}
        {!uploadedFile && !isPitchMode && (
          <TouchableOpacity style={styles.uploadButton} onPress={handlePickDocument}>
            <IconSymbol name="doc.fill" size={20} color="#fff" />
            <Text style={styles.uploadButtonText}>Upload Pitch Deck</Text>
          </TouchableOpacity>
        )}

        {/* Uploaded File Info */}
        {uploadedFile && !isPitchMode && (
          <View style={styles.fileInfoContainer}>
            <IconSymbol name="doc.fill" size={16} color="#0891b2" />
            <Text style={styles.fileInfoText} numberOfLines={1}>{uploadedFile.name}</Text>
            <TouchableOpacity onPress={() => setUploadedFile(null)}>
              <IconSymbol name="xmark.circle.fill" size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>
        )}

        {/* Start Pitch Button */}
        {uploadedFile && !isPitchMode && !evaluationScores && (
          <TouchableOpacity style={styles.startPitchButton} onPress={handleStartPitch}>
            <IconSymbol name="mic.fill" size={20} color="#fff" />
            <Text style={styles.startPitchButtonText}>Start 5-Min Pitch</Text>
          </TouchableOpacity>
        )}

        {/* Pitch Input */}
        {isPitchMode && (
          <View style={styles.pitchInputContainer}>
            <TextInput
              style={[styles.pitchInput, { borderColor, color: textColor }]}
              placeholder="Type your pitch here..."
              placeholderTextColor="#999"
              value={inputMessage}
              onChangeText={setInputMessage}
              multiline
              maxLength={5000}
            />
            <TouchableOpacity style={styles.submitPitchButton} onPress={handleSubmitPitch}>
              <Text style={styles.submitPitchButtonText}>Submit Pitch</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Chat Input (after evaluation) */}
        {!isPitchMode && evaluationScores && (
          <View style={styles.chatInputContainer}>
            <TextInput
              style={[styles.chatInput, { borderColor, color: textColor }]}
              placeholder="Ask a question..."
              placeholderTextColor="#999"
              value={inputMessage}
              onChangeText={setInputMessage}
            />
            <TouchableOpacity 
              style={[styles.sendButton, (!inputMessage.trim() || isLoading) && styles.sendButtonDisabled]} 
              onPress={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
            >
              <IconSymbol name="paperplane.fill" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* TTS Controls */}
        {isSpeaking && (
          <TouchableOpacity style={styles.stopSpeakingButton} onPress={stopSpeaking}>
            <IconSymbol name="speaker.slash.fill" size={16} color="#fff" />
            <Text style={styles.stopSpeakingText}>Stop Speaking</Text>
          </TouchableOpacity>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  languageToggle: {
    flexDirection: 'row',
    margin: 12,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  langBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  langBtnActive: {
    backgroundColor: '#0891b2',
  },
  langBtnText: {
    fontSize: 13,
    color: '#999',
  },
  langBtnTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  timerText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ef4444',
    marginLeft: 8,
  },
  messagesContainer: {
    padding: 12,
    paddingBottom: 20,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  userMessageRow: {
    justifyContent: 'flex-end',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0891b2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  userAvatar: {
    backgroundColor: '#6366f1',
    marginRight: 0,
    marginLeft: 8,
  },
  avatarEmoji: {
    fontSize: 18,
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 16,
    padding: 12,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  scoresContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  totalScoreContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  totalScoreLabel: {
    fontSize: 12,
    color: '#999',
  },
  totalScoreValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0891b2',
  },
  criteriaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  criteriaName: {
    flex: 1,
    fontSize: 11,
  },
  progressBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 3,
    marginHorizontal: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#0891b2',
    borderRadius: 3,
  },
  criteriaScore: {
    fontSize: 11,
    width: 35,
    textAlign: 'right',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  loadingText: {
    marginLeft: 8,
    color: '#999',
    fontSize: 13,
  },
  bottomContainer: {
    padding: 12,
    borderTopWidth: 1,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0891b2',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  fileInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(8, 145, 178, 0.1)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    gap: 8,
  },
  fileInfoText: {
    flex: 1,
    fontSize: 13,
    color: '#0891b2',
  },
  startPitchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  startPitchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  pitchInputContainer: {
    gap: 10,
  },
  pitchInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
    maxHeight: 150,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  submitPitchButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitPitchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chatInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0891b2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  stopSpeakingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 10,
    gap: 6,
  },
  stopSpeakingText: {
    color: "#12305c",
    fontSize: 13,
  },
});
