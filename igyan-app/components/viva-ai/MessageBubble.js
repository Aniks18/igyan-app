/**
 * Viva AI - Message Bubble Component
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IconSymbol } from '../IconSymbol';

export default function MessageBubble({ message, isUser }) {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Simple markdown-like formatting
  const formatContent = (content) => {
    // Bold text between ** **
    const parts = content.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <Text key={index} style={styles.boldText}>
            {part.slice(2, -2)}
          </Text>
        );
      }
      return part;
    });
  };

  return (
    <View style={[styles.container, isUser && styles.containerUser]}>
      {!isUser && (
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji}>🦈</Text>
        </View>
      )}
      
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        <Text style={[styles.content, isUser && styles.contentUser]}>
          {formatContent(message.content)}
        </Text>
        <Text style={[styles.timestamp, isUser && styles.timestampUser]}>
          {formatTime(message.timestamp)}
        </Text>
      </View>
      
      {isUser && (
        <View style={styles.avatarUser}>
          <IconSymbol name="person.fill" size={18} color="#fff" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  containerUser: {
    justifyContent: 'flex-end',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  avatarEmoji: {
    fontSize: 18,
  },
  avatarUser: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#4f46e5",
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  bubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  bubbleAssistant: {
    backgroundColor: "#ffffff",
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: "#4f46e5",
    borderBottomRightRadius: 4,
  },
  content: {
    color: "#12305c",
    fontSize: 14,
    lineHeight: 20,
  },
  contentUser: {
    color: '#fff',
  },
  boldText: {
    fontWeight: '700',
  },
  timestamp: {
    color: '#7a8b9c',
    fontSize: 10,
    marginTop: 6,
  },
  timestampUser: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
});
