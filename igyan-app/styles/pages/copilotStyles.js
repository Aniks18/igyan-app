import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 768;

export const copilotStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    opacity: 0.6,
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  
  // Sidebar Styles - Removed (now in component)
  
  // Chat Item Styles
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeChatItem: {
    borderColor: '#8B5CF6',
    backgroundColor: '#8B5CF610',
  },
  chatTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  chatDate: {
    fontSize: 11,
    opacity: 0.5,
  },
  deleteButton: {
    padding: 6,
    borderRadius: 8,
  },
  
  // Memory Styles
  memoryItem: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#8B5CF6',
  },
  memoryText: {
    fontSize: 13,
    lineHeight: 20,
    opacity: 0.8,
    color: '#374151',
  },
  
  // Notes Styles
  notesSubject: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 10,
    color: '#8B5CF6',
  },
  notesChapter: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 6,
    opacity: 0.7,
    color: '#4B5563',
  },
  notesTopic: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 6,
    borderLeftWidth: 2,
    borderLeftColor: '#8B5CF6',
  },
  notesTopicText: {
    fontSize: 12,
    color: '#1F2937',
  },
  
  // Profile Styles
  setupProfileButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  setupProfileText: {
    color: "#12305c",
    fontSize: 15,
    fontWeight: '700',
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  profileAvatarText: {
    fontSize: 40,
    color: '#FFF',
    fontWeight: '700',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1F2937',
  },
  profileDetail: {
    fontSize: 13,
    textAlign: 'center',
    opacity: 0.6,
    marginBottom: 4,
    color: '#6B7280',
  },
  chatDate: {
    fontSize: 11,
    opacity: 0.5,
    color: '#6B7280',
  },
  deleteButton: {
    padding: 6,
    borderRadius: 8,
  },
  
  // Memory Styles
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
    justifyContent: 'center',
  },
  interestTag: {
    backgroundColor: '#8B5CF615',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#8B5CF630',
  },
  interestText: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  
  // Chat Area Styles
  chatArea: {
    flex: 1,
  },
  notesAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDFB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#D1FAE5',
  },
  notesAlertText: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '600',
    flex: 1,
  },
  messagesScroll: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  messagesContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyStateIcon: {
    fontSize: 72,
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
    color: '#1F2937',
  },
  emptyStateText: {
    fontSize: 15,
    opacity: 0.6,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
    color: '#6B7280',
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    maxWidth: 400,
  },
  suggestionChip: {
    backgroundColor: '#8B5CF610',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#8B5CF630',
  },
  suggestionText: {
    fontSize: 13,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  
  // Message Styles
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    alignItems: 'flex-end',
    maxWidth: '80%',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
    alignSelf: 'flex-end',
  },
  aiAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  aiAvatarText: {
    fontSize: 22,
  },
  messageBubble: {
    maxWidth: '100%',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  userBubble: {
    borderBottomRightRadius: 6,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 24,
  },
  userMessageText: {
    color: "#12305c",
  },
  
  // Typing Indicator
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 10,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8B5CF6',
  },
  
  // Input Area
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
    backgroundColor: '#FAFBFC',
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 48,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 24,
    backgroundColor: '#FFF',
    fontSize: 15,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  
  // Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    padding: 28,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    fontSize: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  modalButtonSecondary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#8B5CF6',
    alignItems: 'center',
  },
  modalButtonSecondaryText: {
    color: '#8B5CF6',
    fontSize: 15,
    fontWeight: '700',
  },
  modalButtonPrimary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modalButtonPrimaryText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  sidebarSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 12,
    opacity: 0.8,
    color: '#374151',
  },
  
  // Empty Text
  emptyText: {
    textAlign: 'center',
    opacity: 0.5,
    marginTop: 32,
    fontSize: 14,
    color: '#9CA3AF',
  },
});
