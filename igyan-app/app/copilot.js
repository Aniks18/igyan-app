/**
 * iGyan App - AI Copilot
 * Personal AI tutor with chat, memory, and notes integration
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  ScrollView,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedView } from '../components/ThemedView';
import { ThemedText } from '../components/ThemedText';
import { IconSymbol } from '../components/IconSymbol';
import { useThemeColor } from '../hooks/useThemeColor';
import notesData from '../data/copilot/notes.json';
import { copilotStyles as styles } from '../styles/pages/copilotStyles';
import CopilotSidebar from '../components/copilot/Sidebar';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

export default function AICopilotScreen() {
  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const scrollViewRef = useRef(null);

  // State management
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionMemories, setSessionMemories] = useState([]);
  const [overallMemories, setOverallMemories] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [sidebarView, setSidebarView] = useState('chats'); // chats, memory, profile, notes
  const [selectedNotes, setSelectedNotes] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Load data from AsyncStorage
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [chats, profile, sessionMem, overallMem] = await Promise.all([
        AsyncStorage.getItem('copilot_chat_history'),
        AsyncStorage.getItem('copilot_student_profile'),
        AsyncStorage.getItem('copilot_session_memories'),
        AsyncStorage.getItem('copilot_overall_memories'),
      ]);

      if (chats) {
        const parsedChats = JSON.parse(chats);
        setChatHistory(parsedChats);
        if (parsedChats.length > 0) {
          setCurrentChatId(parsedChats[0].id);
          setMessages(parsedChats[0].messages);
        }
      }

      if (profile) {
        setStudentProfile(JSON.parse(profile));
      } else {
        setShowProfileSetup(true);
      }

      if (sessionMem) setSessionMemories(JSON.parse(sessionMem));
      if (overallMem) setOverallMemories(JSON.parse(overallMem));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // Save chat
  const saveChat = async (chatId, updatedMessages, chatTitle = null) => {
    try {
      const chatIndex = chatHistory.findIndex((chat) => chat.id === chatId);
      let updatedChatHistory;

      if (chatIndex !== -1) {
        updatedChatHistory = [...chatHistory];
        updatedChatHistory[chatIndex] = {
          ...updatedChatHistory[chatIndex],
          messages: updatedMessages,
          updatedAt: new Date().toISOString(),
          ...(chatTitle && { title: chatTitle }),
        };
      } else {
        const newChat = {
          id: chatId,
          title: chatTitle || 'New Chat',
          messages: updatedMessages,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        updatedChatHistory = [newChat, ...chatHistory];
      }

      setChatHistory(updatedChatHistory);
      await AsyncStorage.setItem('copilot_chat_history', JSON.stringify(updatedChatHistory));
    } catch (error) {
      console.error('Error saving chat:', error);
    }
  };

  // Save memory
  const saveMemory = async (summary, type = 'overall') => {
    try {
      const newMemory = {
        id: Date.now().toString(),
        summary,
        chatId: currentChatId,
        createdAt: new Date().toISOString(),
      };

      if (type === 'session') {
        const updatedMemories = [newMemory, ...sessionMemories];
        setSessionMemories(updatedMemories);
        await AsyncStorage.setItem('copilot_session_memories', JSON.stringify(updatedMemories));
      } else {
        const updatedMemories = [newMemory, ...overallMemories];
        setOverallMemories(updatedMemories);
        await AsyncStorage.setItem('copilot_overall_memories', JSON.stringify(updatedMemories));
      }
    } catch (error) {
      console.error('Error saving memory:', error);
    }
  };

  // Call OpenAI API
  const callOpenAI = async (conversationMessages) => {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: conversationMessages,
          temperature: 0.7,
          max_tokens: 1500,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from OpenAI');
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw error;
    }
  };

  // Build context prompt
  const buildContextPrompt = () => {
    let context = '';

    if (studentProfile) {
      context = `You are ${studentProfile.aiName || 'Sudarshan AI'}, helping ${studentProfile.name}`;
      if (studentProfile.class) context += `, a Class ${studentProfile.class} student`;
      if (studentProfile.school?.name) context += ` from ${studentProfile.school.name}`;
      context += '. ';

      if (studentProfile.interests?.length > 0) {
        context += `Interests: ${studentProfile.interests.join(', ')}. `;
      }
    }

    if (selectedNotes) {
      context += `\n\nCurrent topic: ${selectedNotes.subject} - ${selectedNotes.chapter} - ${selectedNotes.topic}. `;
    }

    return context;
  };

  // Generate chat title
  const generateChatTitle = async (firstMessage) => {
    try {
      const titlePrompt = [
        {
          role: 'system',
          content:
            'Create a 3-5 word title for this question. Be concise. Return ONLY the title.',
        },
        {
          role: 'user',
          content: `Title for: "${firstMessage}"`,
        },
      ];

      const title = await callOpenAI(titlePrompt);
      return title.trim().replace(/['"]/g, '');
    } catch (_error) {
      return firstMessage.slice(0, 40);
    }
  };

  // Generate memory summary
  const generateMemorySummary = async (conversationMessages, type = 'overall') => {
    try {
      const summaryPrompt = [
        {
          role: 'system',
          content:
            type === 'session'
              ? 'Create a 2-line summary of this recent exchange.'
              : 'Create a 4-line summary of the entire conversation.',
        },
        {
          role: 'user',
          content: `Summarize:\n\n${conversationMessages
            .map((msg) => `${msg.role}: ${msg.content}`)
            .join('\n')}`,
        },
      ];

      const summary = await callOpenAI(summaryPrompt);
      await saveMemory(summary, type);
    } catch (error) {
      console.error('Failed to generate summary:', error);
    }
  };

  // Handle send message
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isTyping) return;

    if (!OPENAI_API_KEY) {
      Alert.alert('Error', 'OpenAI API key not configured');
      return;
    }

    const userMessage = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    const chatId = currentChatId || Date.now().toString();
    if (!currentChatId) {
      setCurrentChatId(chatId);
    }

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputMessage('');
    setIsTyping(true);

    await saveChat(chatId, updatedMessages);

    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const conversationMessages = updatedMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const contextPrompt = buildContextPrompt();
      conversationMessages.unshift({
        role: 'system',
        content: `You are a helpful, friendly AI assistant for iGyanAI. ${contextPrompt}\n\nBe warm, encouraging, and use emojis. Break down complex concepts. Keep language simple and relatable.`,
      });

      const aiResponse = await callOpenAI(conversationMessages);

      const assistantMessage = {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString(),
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);

      if (!currentChatId || messages.length === 0) {
        const aiTitle = await generateChatTitle(userMessage.content);
        await saveChat(chatId, finalMessages, aiTitle);
      } else {
        await saveChat(chatId, finalMessages);
      }

      // Generate summaries
      await generateMemorySummary(
        finalMessages.slice(-2).map((msg) => ({ role: msg.role, content: msg.content })),
        'session'
      );

      await generateMemorySummary(
        finalMessages.map((msg) => ({ role: msg.role, content: msg.content })),
        'overall'
      );

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (_error) {
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
        isError: true,
      };
      const errorMessages = [...updatedMessages, errorMessage];
      setMessages(errorMessages);
      await saveChat(chatId, errorMessages);
    } finally {
      setIsTyping(false);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
    setSessionMemories([]);
    setSelectedNotes(null);
  };

  const loadChat = (chat) => {
    setCurrentChatId(chat.id);
    setMessages(chat.messages);
  };

  const deleteChat = async (chatId) => {
    const updatedChats = chatHistory.filter((chat) => chat.id !== chatId);
    setChatHistory(updatedChats);
    await AsyncStorage.setItem('copilot_chat_history', JSON.stringify(updatedChats));

    if (chatId === currentChatId) {
      startNewChat();
    }
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const renderMessage = (msg, index) => {
    const isUser = msg.role === 'user';
    return (
      <View key={index} style={[styles.messageContainer, isUser && styles.userMessageContainer]}>
        {!isUser && (
          <View style={styles.aiAvatar}>
            <ThemedText style={styles.aiAvatarText}>🤖</ThemedText>
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            { backgroundColor: isUser ? '#8B5CF6' : cardColor },
            isUser && styles.userBubble,
          ]}
        >
          <ThemedText style={[styles.messageText, isUser && styles.userMessageText]}>
            {msg.content}
          </ThemedText>
        </View>
      </View>
    );
  };

  const renderSidebarContent = () => {
    switch (sidebarView) {
      case 'chats':
        return (
          <ScrollView style={styles.sidebarScroll}>
            {chatHistory.length === 0 ? (
              <ThemedText style={styles.emptyText}>No chats yet</ThemedText>
            ) : (
              chatHistory.map((chat) => (
                <TouchableOpacity
                  key={chat.id}
                  style={[
                    styles.chatItem,
                    { backgroundColor: cardColor },
                    chat.id === currentChatId && styles.activeChatItem,
                  ]}
                  onPress={() => loadChat(chat)}
                >
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.chatTitle} numberOfLines={1}>
                      {chat.title}
                    </ThemedText>
                    <ThemedText style={styles.chatDate}>
                      {new Date(chat.updatedAt).toLocaleDateString()}
                    </ThemedText>
                  </View>
                  <TouchableOpacity
                    onPress={() => deleteChat(chat.id)}
                    style={styles.deleteButton}
                  >
                    <IconSymbol name="trash.fill" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        );

      case 'memory':
        return (
          <ScrollView style={styles.sidebarScroll}>
            <ThemedText style={styles.sidebarSectionTitle}>Recent Memory</ThemedText>
            {sessionMemories.slice(0, 3).map((mem) => (
              <View key={mem.id} style={[styles.memoryItem, { backgroundColor: cardColor }]}>
                <ThemedText style={styles.memoryText}>{mem.summary}</ThemedText>
              </View>
            ))}

            <ThemedText style={[styles.sidebarSectionTitle, { marginTop: 16 }]}>
              Overall Memory
            </ThemedText>
            {overallMemories.slice(0, 3).map((mem) => (
              <View key={mem.id} style={[styles.memoryItem, { backgroundColor: cardColor }]}>
                <ThemedText style={styles.memoryText}>{mem.summary}</ThemedText>
              </View>
            ))}
          </ScrollView>
        );

      case 'notes':
        return (
          <ScrollView style={styles.sidebarScroll}>
            {notesData.subjects.map((subject, idx) => (
              <View key={idx}>
                <ThemedText style={styles.notesSubject}>{subject.name}</ThemedText>
                {subject.chapters.slice(0, 2).map((chapter, chIdx) => (
                  <View key={chIdx}>
                    <ThemedText style={styles.notesChapter}>{chapter.name}</ThemedText>
                    {chapter.topics.slice(0, 3).map((topic, topicIdx) => (
                      <TouchableOpacity
                        key={topicIdx}
                        style={[styles.notesTopic, { backgroundColor: cardColor }]}
                        onPress={() =>
                          setSelectedNotes({
                            subject: subject.name,
                            chapter: chapter.name,
                            topic: topic,
                          })
                        }
                      >
                        <ThemedText style={styles.notesTopicText}>{topic}</ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>
        );

      case 'profile':
        return (
          <ScrollView style={styles.sidebarScroll}>
            {!studentProfile ? (
              <TouchableOpacity
                style={styles.setupProfileButton}
                onPress={() => setShowProfileSetup(true)}
              >
                <ThemedText style={styles.setupProfileText}>Setup Profile</ThemedText>
              </TouchableOpacity>
            ) : (
              <View>
                <View style={styles.profileAvatar}>
                  <ThemedText style={styles.profileAvatarText}>
                    {studentProfile.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </ThemedText>
                </View>
                <ThemedText style={styles.profileName}>{studentProfile.name}</ThemedText>
                {studentProfile.class && (
                  <ThemedText style={styles.profileDetail}>Class {studentProfile.class}</ThemedText>
                )}
                {studentProfile.school?.name && (
                  <ThemedText style={styles.profileDetail}>{studentProfile.school.name}</ThemedText>
                )}
                {studentProfile.interests?.length > 0 && (
                  <View style={styles.interestsContainer}>
                    {studentProfile.interests.map((interest, idx) => (
                      <View key={idx} style={styles.interestTag}>
                        <ThemedText style={styles.interestText}>{interest}</ThemedText>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        );

      default:
        return null;
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardColor }]}>
        <View style={styles.headerInfo}>
          <ThemedText style={styles.headerTitle}>AI Copilot 🤖</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            {studentProfile?.aiName || 'Your Personal AI Tutor'}
          </ThemedText>
        </View>
      </View>

      <View style={styles.mainContent}>
        {/* Left Sidebar */}
        <CopilotSidebar
          sidebarView={sidebarView}
          isCollapsed={isSidebarCollapsed}
          toggleSidebar={toggleSidebar}
          setSidebarView={setSidebarView}
          startNewChat={startNewChat}
          renderSidebarContent={renderSidebarContent}
          cardColor={cardColor}
        />

        {/* Chat Area */}
        <View style={styles.chatArea}>
          {selectedNotes && (
            <View style={styles.notesAlert}>
              <ThemedText style={styles.notesAlertText}>
                📚 Studying: {selectedNotes.topic}
              </ThemedText>
              <TouchableOpacity onPress={() => setSelectedNotes(null)}>
                <IconSymbol name="xmark.circle.fill" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          )}

          <ScrollView ref={scrollViewRef} style={styles.messagesScroll} contentContainerStyle={styles.messagesContainer}>
            {messages.length === 0 ? (
              <View style={styles.emptyState}>
                <ThemedText style={styles.emptyStateIcon}>🤖✨</ThemedText>
                <ThemedText style={styles.emptyStateTitle}>
                  Welcome to AI Copilot!
                </ThemedText>
                <ThemedText style={styles.emptyStateText}>
                  Your personal AI tutor with memory and context. Ask me anything!
                </ThemedText>
                <View style={styles.suggestionsContainer}>
                  {[
                    '📚 Explain a concept',
                    '💡 Solve a problem',
                    '🎯 Create study plan',
                    '✨ Get motivated',
                  ].map((suggestion, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.suggestionChip}
                      onPress={() => setInputMessage(suggestion.split(' ').slice(1).join(' '))}
                    >
                      <ThemedText style={styles.suggestionText}>{suggestion}</ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : (
              messages.map((msg, idx) => renderMessage(msg, idx))
            )}

            {isTyping && (
              <View style={styles.typingIndicator}>
                <View style={styles.aiAvatar}>
                  <ThemedText style={styles.aiAvatarText}>🤖</ThemedText>
                </View>
                <View style={[styles.messageBubble, { backgroundColor: cardColor }]}>
                  <View style={styles.typingDots}>
                    <View style={styles.typingDot} />
                    <View style={styles.typingDot} />
                    <View style={styles.typingDot} />
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Input Area */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={90}
          >
            <View style={[styles.inputContainer, { backgroundColor: cardColor }]}>
              <TextInput
                style={[styles.input, { color: textColor }]}
                value={inputMessage}
                onChangeText={setInputMessage}
                placeholder="Ask me anything..."
                placeholderTextColor="#999"
                multiline
                maxLength={1000}
              />
              <TouchableOpacity
                style={[styles.sendButton, !inputMessage.trim() && styles.sendButtonDisabled]}
                onPress={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping}
              >
                {isTyping ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <IconSymbol name="arrow.up.circle.fill" size={36} color="#8B5CF6" />
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </View>

      {/* Profile Setup Modal */}
      {showProfileSetup && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardColor }]}>
            <ThemedText style={styles.modalTitle}>Setup Your Profile</ThemedText>
            <TextInput
              style={[styles.modalInput, { color: textColor, borderColor: '#8B5CF6' }]}
              placeholder="Your Name"
              placeholderTextColor="#999"
              onChangeText={(text) => setStudentProfile({ ...studentProfile, name: text })}
            />
            <TextInput
              style={[styles.modalInput, { color: textColor, borderColor: '#8B5CF6' }]}
              placeholder="AI Assistant Name (e.g., Sudarshan AI)"
              placeholderTextColor="#999"
              onChangeText={(text) => setStudentProfile({ ...studentProfile, aiName: text })}
            />
            <TextInput
              style={[styles.modalInput, { color: textColor, borderColor: '#8B5CF6' }]}
              placeholder="Class/Grade"
              placeholderTextColor="#999"
              onChangeText={(text) => setStudentProfile({ ...studentProfile, class: text })}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setShowProfileSetup(false)}
              >
                <ThemedText style={styles.modalButtonSecondaryText}>Skip</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonPrimary}
                onPress={async () => {
                  await AsyncStorage.setItem(
                    'copilot_student_profile',
                    JSON.stringify(studentProfile)
                  );
                  setShowProfileSetup(false);
                }}
              >
                <ThemedText style={styles.modalButtonPrimaryText}>Save</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ThemedView>
  );
}

