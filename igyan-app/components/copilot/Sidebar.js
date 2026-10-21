import React from 'react';
import { View, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { ThemedText } from '../ThemedText';
import { IconSymbol } from '../IconSymbol';

export default function CopilotSidebar({
  sidebarView,
  setSidebarView,
  startNewChat,
  renderSidebarContent,
  cardColor,
  isCollapsed,
  toggleSidebar,
}) {
  const tabs = [
    { id: 'chats', icon: 'message.fill', label: 'Chats' },
    { id: 'memory', icon: 'brain.head.profile', label: 'Memory' },
    { id: 'notes', icon: 'book.fill', label: 'Notes' },
    { id: 'profile', icon: 'person.fill', label: 'Profile' },
  ];

  return (
    <View style={[styles.sidebar, isCollapsed && styles.sidebarCollapsed]}>
      {/* Toggle Button */}
      <TouchableOpacity style={styles.toggleButton} onPress={toggleSidebar}>
        <IconSymbol 
          name={isCollapsed ? 'chevron.right' : 'chevron.left'} 
          size={20} 
          color="#8B5CF6" 
        />
      </TouchableOpacity>

      {/* New Chat Button */}
      <TouchableOpacity 
        style={[styles.newChatButton, isCollapsed && styles.newChatButtonCollapsed]} 
        onPress={startNewChat}
      >
        <IconSymbol name="plus.circle.fill" size={22} color="#FFF" />
        {!isCollapsed && <ThemedText style={styles.newChatButtonText}>New Chat</ThemedText>}
      </TouchableOpacity>

      {/* Sidebar Navigation Tabs */}
      <View style={styles.sidebarNav}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.navTab,
              isCollapsed && styles.navTabCollapsed,
              { backgroundColor: cardColor },
              sidebarView === tab.id && styles.navTabActive,
            ]}
            onPress={() => setSidebarView(tab.id)}
          >
            <IconSymbol
              name={tab.icon}
              size={22}
              color={sidebarView === tab.id ? '#8B5CF6' : '#6B7280'}
            />
            {!isCollapsed && (
              <ThemedText
                style={[
                  styles.navTabText,
                  sidebarView === tab.id && styles.navTabTextActive,
                ]}
              >
                {tab.label}
              </ThemedText>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Sidebar Content - Only show when expanded */}
      {!isCollapsed && (
        <ScrollView style={styles.sidebarContent} showsVerticalScrollIndicator={false}>
          {renderSidebarContent()}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 280,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    padding: 16,
    flexDirection: 'column',
    position: 'relative',
  },
  sidebarCollapsed: {
    width: 80,
    alignItems: 'center',
  },
  toggleButton: {
    position: 'absolute',
    top: 12,
    right: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#8B5CF6',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 20,
    marginTop: 8,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  newChatButtonCollapsed: {
    paddingHorizontal: 14,
    borderRadius: 50,
  },
  newChatButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  sidebarNav: {
    gap: 8,
    marginBottom: 20,
  },
  navTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  navTabCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  navTabActive: {
    backgroundColor: '#8B5CF610',
    borderColor: '#8B5CF6',
  },
  navTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  navTabTextActive: {
    color: '#8B5CF6',
  },
  sidebarContent: {
    flex: 1,
  },
});
