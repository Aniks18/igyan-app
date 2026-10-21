/**
 * iGyan App - Live Classroom
 * Video conferencing for live classes
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { WebView } from 'react-native-webview';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import { IconSymbol } from '../../components/IconSymbol';
import Header from '../../components/Header';
import { useAuth } from '../../utils/AuthContext';
import { useSideNav } from '../../utils/SideNavContext';

const API_BASE_URL = 'https://igyan-meets.onrender.com';
const API_KEY = 'zQgLY2TzzmgKA0Ge98sTWYaWkxfz3b1ltV_rcUqHSDw';

const ALLOWED_ROLES = ['super_admin', 'co_admin', 'faculty', 'student', 'b2c_student', 'b2c_mentor'];

export default function LiveClassroomPage() {
  const { user } = useAuth();
  const { openSideNav } = useSideNav();
  const [inMeeting, setInMeeting] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const [roomName, setRoomName] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showNativeView, setShowNativeView] = useState(true);
  const [createError, setCreateError] = useState('');
  const [joinError, setJoinError] = useState('');

  // Check access
  if (!user || !ALLOWED_ROLES.includes(user.role)) {
    return (
      <ThemedView style={styles.container}>
        <Header 
          title="Live Classroom" 
          onMenuPress={openSideNav} 
        />
        <View style={styles.accessDenied}>
          <IconSymbol name="xmark.circle.fill" size={64} color="#ef4444" />
          <Text style={styles.accessDeniedTitle}>Access Denied</Text>
          <Text style={styles.accessDeniedText}>
            {"You don't have permission to access this feature."}
          </Text>
        </View>
      </ThemedView>
    );
  }

  // If in meeting, show the video conferencing interface
  if (inMeeting && currentRoomId) {
    const meetingUrl = `${API_BASE_URL}/join/${currentRoomId}?name=${encodeURIComponent(user?.full_name || 'Guest')}&apiKey=${API_KEY}`;

    return (
      <View style={styles.meetingContainer}>
        <View style={styles.meetingHeader}>
          <View style={styles.meetingHeaderContent}>
            <IconSymbol name="video.fill" size={24} color="#fff" />
            <View style={styles.meetingInfo}>
              <Text style={styles.meetingTitle}>i-Meet - Room: {currentRoomId}</Text>
              <Text style={styles.meetingSubtitle}>Powered by igyan-meets</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.leaveButton}
            onPress={() => {
              setInMeeting(false);
              setCurrentRoomId(null);
            }}
            accessibilityRole="button"
            accessibilityLabel="Leave meeting"
          >
            <Text style={styles.leaveButtonText}>Leave</Text>
          </TouchableOpacity>
        </View>
        <WebView
          source={{ uri: meetingUrl }}
          style={styles.webview}
          accessibilityLabel="Live meeting video view"
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback={true}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          scrollEnabled={true}
          bounces={true}
          allowsFullscreenVideo={true}
          allowFileAccess={true}
          geolocationEnabled={true}
          mediaPlaybackRequiresUserGesture={false}
          cacheEnabled={false}
          thirdPartyCookiesEnabled={true}
          sharedCookiesEnabled={true}
          mixedContentMode="always"
          onPermissionRequest={(request) => {
            if (request.nativeEvent.permission === 'camera' || 
                request.nativeEvent.permission === 'microphone' ||
                request.nativeEvent.permission === 'audio' ||
                request.nativeEvent.permission === 'video') {
              request.nativeEvent.request.grant();
            }
          }}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4f46e5" />
              <Text style={{ marginTop: 12, color: "#476b9c" }}>Loading meeting...</Text>
            </View>
          )}
        />
      </View>
    );
  }

  const handleCreateMeeting = async () => {
    if (isLoading) return;
    if (!roomName.trim()) {
      setCreateError('Enter a meeting name to start.');
      return;
    }
    setCreateError('');

    setIsLoading(true);

    try {
      const roomId = roomName.trim().toLowerCase().replace(/\s+/g, '-');
      
      const response = await fetch(`${API_BASE_URL}/api/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY
        },
        body: JSON.stringify({
          room_code: roomId,
          name: roomName.trim(),
          created_by: user?.id || 'guest',
          max_participants: 50
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to create room');
      }

      setCurrentRoomId(roomId);
      setInMeeting(true);
    } catch (err) {
      setCreateError(err.message || 'Could not create the meeting. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinMeeting = async () => {
    if (isLoading) return;
    if (!joinRoomId.trim()) {
      setJoinError('Enter the meeting code to join.');
      return;
    }
    setJoinError('');

    setIsLoading(true);

    try {
      const roomId = joinRoomId.trim().toLowerCase();
      
      const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}`, {
        headers: { 'X-API-Key': API_KEY }
      });

      if (!response.ok && response.status !== 404) {
        throw new Error('Failed to verify room');
      }

      setCurrentRoomId(roomId);
      setInMeeting(true);
    } catch (err) {
      setJoinError(err.message || 'Could not join the meeting. Check the code and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Main landing page
  if (showNativeView) {
    return (
      <ThemedView style={styles.container}>
        <Header 
          title="Live Classroom" 
          onMenuPress={openSideNav} 
        />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <IconSymbol name="video.fill" size={48} color="#4f46e5" />
            <Text style={styles.headerTitle}>i-Meet Video Conferencing</Text>
            <Text style={styles.headerSubtitle}>Secure • Fast • Reliable</Text>
          </View>

          {/* Cards Container */}
          <View style={styles.cardsContainer}>
            {/* Create Meeting Card */}
            <View style={styles.card}>
              <IconSymbol name="video.fill" size={40} color="#4f46e5" />
              <Text style={styles.cardTitle}>Create Meeting</Text>
              <Text style={styles.cardDescription}>Start a new video conference instantly</Text>
              <TextInput
                style={[styles.input, createError && styles.inputInvalid]}
                placeholder="Enter meeting name..."
                placeholderTextColor="#476b9c"
                value={roomName}
                onChangeText={value => { setRoomName(value); if (createError) setCreateError(''); }}
                editable={!isLoading}
                accessibilityLabel="Meeting name"
                returnKeyType="go"
                onSubmitEditing={handleCreateMeeting}
              />
              {createError ? <Text accessibilityLiveRegion="polite" style={styles.inlineError}>{createError}</Text> : null}
              <TouchableOpacity
                style={[styles.button, styles.createButton, (!roomName.trim() || isLoading) && styles.buttonDisabled]}
                onPress={handleCreateMeeting}
                disabled={!roomName.trim() || isLoading}
                accessibilityRole="button"
                accessibilityLabel="Create new meeting"
                accessibilityState={{ disabled: !roomName.trim() || isLoading, busy: isLoading }}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Create New Meeting</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Join Meeting Card */}
            <View style={styles.card}>
              <IconSymbol name="phone.fill" size={40} color="#4f46e5" />
              <Text style={styles.cardTitle}>Join Meeting</Text>
              <Text style={styles.cardDescription}>Enter a meeting code to join</Text>
              <TextInput
                style={[styles.input, joinError && styles.inputInvalid]}
                placeholder="Enter meeting code..."
                placeholderTextColor="#476b9c"
                value={joinRoomId}
                onChangeText={value => { setJoinRoomId(value); if (joinError) setJoinError(''); }}
                editable={!isLoading}
                accessibilityLabel="Meeting code"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="go"
                onSubmitEditing={handleJoinMeeting}
              />
              {joinError ? <Text accessibilityLiveRegion="polite" style={styles.inlineError}>{joinError}</Text> : null}
              <TouchableOpacity
                style={[styles.button, styles.joinButton, (!joinRoomId.trim() || isLoading) && styles.buttonDisabled]}
                onPress={handleJoinMeeting}
                disabled={!joinRoomId.trim() || isLoading}
                accessibilityRole="button"
                accessibilityLabel="Join meeting"
                accessibilityState={{ disabled: !joinRoomId.trim() || isLoading, busy: isLoading }}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Join Meeting</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>Features</Text>
            <View style={styles.featuresGrid}>
              <View style={styles.featureItem}>
                <IconSymbol name="lock.fill" size={16} color="#4f46e5" />
                <Text style={styles.featureText}>Secure & Private</Text>
              </View>
              <View style={styles.featureItem}>
                <IconSymbol name="bolt.fill" size={16} color="#4f46e5" />
                <Text style={styles.featureText}>Fast & Reliable</Text>
              </View>
              <View style={styles.featureItem}>
                <IconSymbol name="bubble.left.fill" size={16} color="#4f46e5" />
                <Text style={styles.featureText}>Chat & Screen Share</Text>
              </View>
              <View style={styles.featureItem}>
                <IconSymbol name="mic.fill" size={16} color="#4f46e5" />
                <Text style={styles.featureText}>HD Audio/Video</Text>
              </View>
              <View style={styles.featureItem}>
                <IconSymbol name="record.circle" size={16} color="#4f46e5" />
                <Text style={styles.featureText}>Recording Available</Text>
              </View>
              <View style={styles.featureItem}>
                <IconSymbol name="globe" size={16} color="#4f46e5" />
                <Text style={styles.featureText}>Works Everywhere</Text>
              </View>
            </View>
          </View>

          {/* Web View Toggle */}
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setShowNativeView(false)}
            accessibilityRole="button"
            accessibilityLabel="Switch to web view"
          >
            <Text style={styles.toggleButtonText}>Switch to Web View</Text>
          </TouchableOpacity>
        </ScrollView>
      </ThemedView>
    );
  }

  // Web View - Embedded demo
  return (
    <View style={styles.webviewContainer}>
      <View style={styles.webviewHeader}>
        <Text style={styles.webviewTitle}>i-Meet Demo</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setShowNativeView(true)}
          accessibilityRole="button"
          accessibilityLabel="Back to native view"
        >
          <Text style={styles.backButtonText}>Native View</Text>
        </TouchableOpacity>
      </View>
      <WebView
        source={{ uri: `${API_BASE_URL}/demo` }}
        accessibilityLabel="i-Meet demo web view"
        style={styles.webview}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        scrollEnabled={true}
        bounces={true}
        allowsFullscreenVideo={true}
        allowFileAccess={true}
        geolocationEnabled={true}
        mediaPlaybackRequiresUserGesture={false}
        cacheEnabled={false}
        thirdPartyCookiesEnabled={true}
        sharedCookiesEnabled={true}
        mixedContentMode="always"
        onPermissionRequest={(request) => {
          if (request.nativeEvent.permission === 'camera' || 
              request.nativeEvent.permission === 'microphone' ||
              request.nativeEvent.permission === 'audio' ||
              request.nativeEvent.permission === 'video') {
            request.nativeEvent.request.grant();
          }
        }}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4f46e5" />
            <Text style={{ marginTop: 12, color: "#476b9c" }}>Loading demo...</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  accessDeniedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ef4444',
    marginTop: 16,
    marginBottom: 8,
  },
  accessDeniedText: {
    fontSize: 16,
    color: "#476b9c",
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: "#0f2444",
    marginTop: 12,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#476b9c",
    marginTop: 4,
  },
  cardsContainer: {
    paddingHorizontal: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: "#0f2444",
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: "#476b9c",
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#f0f5ff",
    borderWidth: 1,
    borderColor: "#d9e3f3",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: "#0f2444",
    marginBottom: 12,
  },
  inputInvalid: {
    borderColor: '#b3261e',
  },
  inlineError: {
    fontSize: 13,
    fontWeight: '500',
    color: '#b3261e',
    marginBottom: 12,
  },
  button: {
    paddingVertical: 14,
    minHeight: 52,
    justifyContent: 'center',
    borderRadius: 8,
    alignItems: 'center',
  },
  createButton: {
    backgroundColor: "#4f46e5",
  },
  joinButton: {
    backgroundColor: "#4f46e5",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  featuresContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: "#0f2444",
    marginBottom: 16,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  featureEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  featureText: {
    fontSize: 13,
    color: "#0f2444",
    flex: 1,
  },
  toggleButton: {
    marginTop: 24,
    marginHorizontal: 16,
    backgroundColor: "#4f46e5",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  meetingContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  meetingHeader: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  meetingHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  meetingInfo: {
    marginLeft: 12,
    flex: 1,
  },
  meetingTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: '600',
  },
  meetingSubtitle: {
    color: '#cbd5e1',
    fontSize: 12,
  },
  leaveButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 6,
  },
  leaveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  webviewContainer: {
    flex: 1,
  },
  webviewHeader: {
    backgroundColor: "#f5f8ff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  webviewTitle: {
    color: "#12305c",
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
