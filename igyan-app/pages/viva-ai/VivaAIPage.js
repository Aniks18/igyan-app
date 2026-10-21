/**
 * iGyan App - Viva AI Page
 * AI-powered pitch deck creator and voice pitch evaluator
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as Speech from 'expo-speech';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import { IconSymbol } from '../../components/IconSymbol';
import Header from '../../components/Header';
import { useSideNav } from '../../utils/SideNavContext';
import { useAuth } from '../../utils/AuthContext';

// Components
import VivaAvatar from '../../components/viva-ai/VivaAvatar';
import FileUploadCard from '../../components/viva-ai/FileUploadCard';
import MessageBubble from '../../components/viva-ai/MessageBubble';
import PitchTimer from '../../components/viva-ai/PitchTimer';
import ScoreCard from '../../components/viva-ai/ScoreCard';
import LanguageSelector from '../../components/viva-ai/LanguageSelector';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
const PITCH_DURATION = 300; // 5 minutes in seconds

const EVALUATION_CRITERIA = [
  { id: 'clarity', name: 'Pitch Clarity & Structure', maxScore: 20 },
  { id: 'business', name: 'Business Model Understanding', maxScore: 20 },
  { id: 'market', name: 'Market Opportunity', maxScore: 20 },
  { id: 'financials', name: 'Financial Projections & Ask', maxScore: 20 },
  { id: 'passion', name: 'Communication & Passion', maxScore: 20 },
];

const STARTER_PROMPTS = [
  'How do I create a compelling pitch?',
  'What should my pitch deck include?',
  'Help me with my business model',
  'How to present financial projections?',
  'Tips for investor presentations',
];

export default function VivaAIPage() {
  const { openSideNav } = useSideNav();
  const { user } = useAuth();
  const scrollViewRef = useRef(null);
  
  // State
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [language, setLanguage] = useState('english');
  
  // Pitch mode states
  const [isPitchMode, setIsPitchMode] = useState(false);
  const [pitchTimer, setPitchTimer] = useState(PITCH_DURATION);
  const [pitchTranscript, setPitchTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Evaluation state
  const [evaluation, setEvaluation] = useState(null);
  const [showEvaluation, setShowEvaluation] = useState(false);

  // Timer effect
  useEffect(() => {
    let interval;
    if (isPitchMode && pitchTimer > 0) {
      interval = setInterval(() => {
        setPitchTimer((prev) => {
          if (prev <= 1) {
            handlePitchComplete();
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
    if (scrollViewRef.current && messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Welcome message
  useEffect(() => {
    const welcomeMessage = {
      role: 'assistant',
      content: `🦈 Welcome to **Viva AI** - Your AI Pitch Coach!\n\nI'm here to help you:\n• Create compelling pitch decks\n• Practice your investor pitch\n• Get detailed feedback and scores\n• Improve your presentation skills\n\n**How to get started:**\n1. Upload your business document (PDF/PPT/DOC)\n2. Click "Start Pitch" to begin your 5-minute pitch\n3. Speak or type your pitch\n4. Receive AI-powered evaluation\n\nOr simply ask me anything about pitching!`,
      timestamp: new Date().toISOString(),
    };
    setMessages([welcomeMessage]);
    speakText(language === 'hindi' 
      ? 'वीवा AI में आपका स्वागत है! मैं आपका AI पिच कोच हूं।'
      : 'Welcome to Viva AI! I am your AI pitch coach.');
  }, []);

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
    try {
      await Speech.stop();
      setIsSpeaking(false);
    } catch (error) {
      console.error('Stop speech error:', error);
    }
  };

  const handleFileUpload = async () => {
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
        
        // Add message about file upload
        const uploadMessage = {
          role: 'assistant',
          content: `📄 **Document Uploaded Successfully!**\n\n**File:** ${file.name}\n\nGreat! I've received your document. You can now:\n• Click **"Start Pitch"** to begin your 5-minute pitch presentation\n• Ask me questions about your business\n• Get tips on improving your pitch\n\nWhen you're ready, start your pitch and I'll evaluate it!`,
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, uploadMessage]);
        
        speakText(language === 'hindi'
          ? 'दस्तावेज़ सफलतापूर्वक अपलोड हो गया। आप अब अपना पिच शुरू कर सकते हैं।'
          : 'Document uploaded successfully. You can now start your pitch.');
      }
    } catch (error) {
      console.error('File upload error:', error);
      Alert.alert('Error', 'Failed to upload file. Please try again.');
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setFileContent('');
  };

  const startPitchMode = () => {
    if (!uploadedFile) {
      Alert.alert(
        'Upload Required',
        'Please upload your business document before starting the pitch.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      '🎤 Ready to Pitch?',
      'You will have 5 minutes to present your business pitch. The AI will evaluate you on:\n\n• Pitch Clarity & Structure\n• Business Model Understanding\n• Market Opportunity\n• Financial Projections\n• Communication & Passion\n\nAre you ready to begin?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Start Pitch', 
          onPress: () => {
            setIsPitchMode(true);
            setPitchTimer(PITCH_DURATION);
            setPitchTranscript('');
            setShowEvaluation(false);
            setEvaluation(null);
            
            const startMessage = {
              role: 'assistant',
              content: `⏱️ **Your 5-Minute Pitch Has Started!**\n\nThe timer is running. Present your business pitch now!\n\n**Tips:**\n• Introduce your business clearly\n• Explain the problem you're solving\n• Describe your solution\n• Share your market opportunity\n• Present your financials and ask\n\nType or speak your pitch below. Good luck! 🍀`,
              timestamp: new Date().toISOString(),
            };
            setMessages(prev => [...prev, startMessage]);
            
            speakText(language === 'hindi'
              ? 'आपका पिच शुरू हो गया है। आपके पास 5 मिनट हैं।'
              : 'Your pitch has started. You have 5 minutes. Good luck!');
          }
        },
      ]
    );
  };

  const handlePitchComplete = async () => {
    setIsPitchMode(false);
    setIsRecording(false);
    
    const finalPitch = pitchTranscript || inputMessage;
    
    if (!finalPitch || finalPitch.trim().length < 50) {
      const errorMessage = {
        role: 'assistant',
        content: '❌ **Pitch Too Short**\n\nYour pitch needs to be more detailed for a proper evaluation. Please try again with a more comprehensive presentation of your business.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    // Add user's pitch as a message
    const pitchMessage = {
      role: 'user',
      content: `**My Pitch:**\n\n${finalPitch}`,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, pitchMessage]);
    setInputMessage('');
    setPitchTranscript('');

    // Evaluate the pitch
    await evaluatePitch(finalPitch);
  };

  const evaluatePitch = async (pitch) => {
    setIsLoading(true);
    
    try {
      const evaluationPrompt = `You are a Shark Tank-style investor evaluating a business pitch. 

PITCH CONTENT:
${pitch}

DOCUMENT CONTEXT:
${fileContent || 'No document provided'}

Evaluate this pitch and provide:
1. An overall score out of 100
2. Individual scores for each category (out of 20):
   - Pitch Clarity & Structure
   - Business Model Understanding  
   - Market Opportunity
   - Financial Projections & Ask
   - Communication & Passion

3. Key strengths (2-3 points)
4. Areas for improvement (2-3 points)
5. Investment decision: YES / NO / MAYBE with brief reasoning
6. One actionable piece of advice

Format your response as:
**Overall Score: [X]/100**

**Category Scores:**
- Pitch Clarity & Structure: [X]/20
- Business Model Understanding: [X]/20
- Market Opportunity: [X]/20
- Financial Projections & Ask: [X]/20
- Communication & Passion: [X]/20

**Strengths:**
• [Point 1]
• [Point 2]

**Areas to Improve:**
• [Point 1]
• [Point 2]

**Investment Decision:** [YES/NO/MAYBE]
[Brief reasoning]

**Key Advice:**
[One actionable tip]`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: 'You are a tough but fair Shark Tank investor. Provide honest, constructive feedback.' },
            { role: 'user', content: evaluationPrompt }
          ],
          temperature: 0.7,
          max_tokens: 1500,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get evaluation');
      }

      const data = await response.json();
      const evaluationContent = data.choices[0].message.content;

      // Parse scores from response
      const overallMatch = evaluationContent.match(/Overall Score:\s*(\d+)/i);
      const overallScore = overallMatch ? parseInt(overallMatch[1]) : 0;

      const scores = {
        clarity: parseInt(evaluationContent.match(/Pitch Clarity.*?(\d+)/i)?.[1] || 0),
        business: parseInt(evaluationContent.match(/Business Model.*?(\d+)/i)?.[1] || 0),
        market: parseInt(evaluationContent.match(/Market Opportunity.*?(\d+)/i)?.[1] || 0),
        financials: parseInt(evaluationContent.match(/Financial.*?(\d+)/i)?.[1] || 0),
        passion: parseInt(evaluationContent.match(/Communication.*?(\d+)/i)?.[1] || 0),
      };

      setEvaluation({
        overall: overallScore,
        scores,
        content: evaluationContent,
      });
      setShowEvaluation(true);

      const evalMessage = {
        role: 'assistant',
        content: `🦈 **SHARK AI EVALUATION**\n\n${evaluationContent}`,
        timestamp: new Date().toISOString(),
        isEvaluation: true,
      };
      setMessages(prev => [...prev, evalMessage]);

      // Speak summary
      const summaryText = overallScore >= 70 
        ? `Great pitch! You scored ${overallScore} out of 100. Keep up the good work!`
        : `Your pitch scored ${overallScore} out of 100. There's room for improvement. Check my detailed feedback.`;
      
      speakText(language === 'hindi'
        ? `आपका स्कोर ${overallScore} है। विस्तृत प्रतिक्रिया देखें।`
        : summaryText);

    } catch (error) {
      console.error('Evaluation error:', error);
      const errorMessage = {
        role: 'assistant',
        content: '❌ **Evaluation Error**\n\nSorry, I couldn\'t evaluate your pitch. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    if (isPitchMode) {
      setPitchTranscript(prev => prev + ' ' + inputMessage);
      setInputMessage('');
      return;
    }

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const systemPrompt = `You are Viva AI, an expert business pitch coach and investor advisor. Help entrepreneurs:
- Create compelling pitch decks
- Improve their presentation skills
- Understand what investors look for
- Refine their business models
- Practice their pitches

Be encouraging but honest. Provide actionable advice. Keep responses concise and helpful.`;

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
            ...messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: inputMessage }
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) throw new Error('API request failed');

      const data = await response.json();
      const assistantMessage = {
        role: 'assistant',
        content: data.choices[0].message.content,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Chat error:', error);
      Alert.alert('Error', 'Failed to get response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStarterPrompt = (prompt) => {
    setInputMessage(prompt);
  };

  return (
    <ThemedView style={styles.container}>
      <Header
        title="Viva AI"
        onMenuPress={openSideNav}
      />

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Top Bar */}
        <View style={styles.topBar}>
          <LanguageSelector
            language={language}
            onLanguageChange={setLanguage}
            disabled={isPitchMode}
          />
          {isPitchMode && (
            <PitchTimer
              timeLeft={pitchTimer}
              totalTime={PITCH_DURATION}
            />
          )}
        </View>

        {/* Avatar Section */}
        <VivaAvatar
          isListening={isRecording}
          isSpeaking={isSpeaking}
          isPitchMode={isPitchMode}
          onStopSpeaking={stopSpeaking}
        />

        {/* File Upload Card */}
        {!uploadedFile ? (
          <FileUploadCard onUpload={handleFileUpload} />
        ) : (
          <View style={styles.uploadedFileCard}>
            <View style={styles.uploadedFileInfo}>
              <IconSymbol name="doc.fill" size={24} color="#4f46e5" />
              <Text style={styles.uploadedFileName} numberOfLines={1}>
                {uploadedFile.name}
              </Text>
            </View>
            <TouchableOpacity onPress={removeFile} style={styles.removeFileBtn}>
              <IconSymbol name="xmark.circle.fill" size={22} color="#ef4444" />
            </TouchableOpacity>
          </View>
        )}

        {/* Evaluation Score Card */}
        {showEvaluation && evaluation && (
          <ScoreCard
            overall={evaluation.overall}
            scores={evaluation.scores}
            criteria={EVALUATION_CRITERIA}
          />
        )}

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message, index) => (
            <MessageBubble
              key={index}
              message={message}
              isUser={message.role === 'user'}
            />
          ))}
          {isLoading && (
            <View style={styles.loadingBubble}>
              <ActivityIndicator size="small" color="#4f46e5" />
              <Text style={styles.loadingText}>Thinking...</Text>
            </View>
          )}
        </ScrollView>

        {/* Starter Prompts */}
        {messages.length <= 1 && !isPitchMode && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.starterPromptsContainer}
            contentContainerStyle={styles.starterPromptsContent}
          >
            {STARTER_PROMPTS.map((prompt, index) => (
              <TouchableOpacity
                key={index}
                style={styles.starterPrompt}
                onPress={() => handleStarterPrompt(prompt)}
              >
                <Text style={styles.starterPromptText}>{prompt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Input Section */}
        <View style={styles.inputSection}>
          {!isPitchMode ? (
            <>
              <TouchableOpacity
                style={[styles.pitchButton, !uploadedFile && styles.pitchButtonDisabled]}
                onPress={startPitchMode}
                disabled={!uploadedFile}
              >
                <IconSymbol name="mic.fill" size={18} color="#fff" />
                <Text style={styles.pitchButtonText}>Start Pitch</Text>
              </TouchableOpacity>
              
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ask me anything about pitching..."
                  placeholderTextColor="#7a8b9c"
                  value={inputMessage}
                  onChangeText={setInputMessage}
                  multiline
                  maxLength={2000}
                />
                <TouchableOpacity
                  style={[styles.sendButton, !inputMessage.trim() && styles.sendButtonDisabled]}
                  onPress={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                >
                  <IconSymbol name="paperplane.fill" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.pitchInputContainer}>
                <TextInput
                  style={styles.pitchInput}
                  placeholder="Type your pitch here..."
                  placeholderTextColor="#7a8b9c"
                  value={inputMessage}
                  onChangeText={setInputMessage}
                  multiline
                  maxLength={5000}
                />
              </View>
              <View style={styles.pitchActions}>
                <TouchableOpacity
                  style={styles.cancelPitchBtn}
                  onPress={() => {
                    setIsPitchMode(false);
                    setPitchTranscript('');
                  }}
                >
                  <Text style={styles.cancelPitchText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitPitchBtn}
                  onPress={handlePitchComplete}
                >
                  <IconSymbol name="checkmark.circle.fill" size={20} color="#fff" />
                  <Text style={styles.submitPitchText}>Submit Pitch</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f8ff",
  },
  content: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#ffffff",
    padding: 12,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  loadingText: {
    color: "#12305c",
    marginLeft: 8,
    fontSize: 14,
  },
  uploadedFileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 12,
    borderRadius: 12,
  },
  uploadedFileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  uploadedFileName: {
    color: "#12305c",
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
  removeFileBtn: {
    padding: 4,
  },
  starterPromptsContainer: {
    maxHeight: 50,
    marginBottom: 8,
  },
  starterPromptsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  starterPrompt: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  starterPromptText: {
    color: "#4f46e5",
    fontSize: 13,
  },
  inputSection: {
    padding: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#d9e3f3",
  },
  pitchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  pitchButtonDisabled: {
    backgroundColor: '#4a5568',
    opacity: 0.6,
  },
  pitchButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: "#12305c",
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#4f46e5",
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#4a5568',
  },
  pitchInputContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  pitchInput: {
    color: "#12305c",
    fontSize: 15,
    minHeight: 80,
    maxHeight: 150,
    textAlignVertical: 'top',
  },
  pitchActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelPitchBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#374151',
    alignItems: 'center',
  },
  cancelPitchText: {
    color: "#12305c",
    fontSize: 15,
    fontWeight: '500',
  },
  submitPitchBtn: {
    flex: 2,
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitPitchText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
