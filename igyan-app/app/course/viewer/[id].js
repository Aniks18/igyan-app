/**
 * iGyan App - Course Viewer with PDF and Video Player
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Video, ResizeMode } from 'expo-av';
import { ThemedView } from '../../../components/ThemedView';
import { ThemedText } from '../../../components/ThemedText';
import { IconSymbol } from '../../../components/IconSymbol';
import { useThemeColor } from '../../../hooks/useThemeColor';
import { fetchCourseById, extractDriveFileId } from '../../../services/coursesService';

const { width } = Dimensions.get('window');

export default function CourseViewerScreen() {
  const { id, lang = 'english' } = useLocalSearchParams();
  const [course, setCourse] = useState(null);
  const [currentModule, setCurrentModule] = useState(1);
  const [selectedLanguage, setSelectedLanguage] = useState(lang);
  const [showModules, setShowModules] = useState(false);
  const videoRef = useRef(null);

  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');

  const loadCourse = useCallback(async () => {
    const courseData = await fetchCourseById(id);
    setCourse(courseData);
  }, [id]);

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  // The lang query param is read once into state above; re-sync when the
  // param itself changes so deep links update the language toggle.
  useEffect(() => {
    setSelectedLanguage(lang);
  }, [lang]);

  if (!course) {
    return (
      <ThemedView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ThemedText>Loading...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const getModuleUrl = (moduleNum) => {
    const moduleKey = `module${moduleNum}${selectedLanguage === 'hindi' ? 'Hindi' : 'English'}`;
    const url = course.modules[moduleKey];
    if (!url) return null;
    
    const fileId = extractDriveFileId(url);
    return fileId ? `https://drive.google.com/file/d/${fileId}/preview` : url;
  };

  const getCurrentModuleUrl = () => getModuleUrl(currentModule);

  const moduleUrl = getCurrentModuleUrl();
  // expo-av cannot play Drive preview pages (HTML). Drive-hosted video
  // falls back to the WebView player, which can.
  const useWebPlayer = currentModule !== 3 || (moduleUrl?.includes('drive.google.com') ?? false);

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardColor }]}>
        <View style={styles.headerTop}>
          
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.courseTitle} numberOfLines={1}>
              {course.title}
            </ThemedText>
            <ThemedText style={styles.moduleInfo}>
              Module {currentModule} • {selectedLanguage === 'hindi' ? 'हिंदी' : 'English'}
            </ThemedText>
          </View>

          <TouchableOpacity 
            onPress={() => setShowModules(!showModules)}
            style={[styles.menuButton, { backgroundColor: backgroundColor }]}
          >
            <IconSymbol name="list.bullet" size={20} color={textColor} />
          </TouchableOpacity>
        </View>

        {/* Language Toggle */}
        <View style={styles.languageToggle}>
          <TouchableOpacity
            style={[
              styles.langButton,
              selectedLanguage === 'english' && { backgroundColor: "#4f46e5" }
            ]}
            onPress={() => setSelectedLanguage('english')}
          >
            <ThemedText style={[
              styles.langText,
              selectedLanguage === 'english' && { color: '#FFF' }
            ]}>
              🇬🇧 EN
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.langButton,
              selectedLanguage === 'hindi' && { backgroundColor: "#4f46e5" }
            ]}
            onPress={() => setSelectedLanguage('hindi')}
          >
            <ThemedText style={[
              styles.langText,
              selectedLanguage === 'hindi' && { color: '#FFF' }
            ]}>
              🇮🇳 HI
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Module Selector Overlay */}
      {showModules && (
        <View style={styles.overlay}>
          <TouchableOpacity 
            style={styles.overlayBackground}
            onPress={() => setShowModules(false)}
            activeOpacity={1}
          />
          <View style={[styles.modulePanel, { backgroundColor: cardColor }]}>
            <View style={styles.modulePanelHeader}>
              <ThemedText style={styles.modulePanelTitle}>Course Modules</ThemedText>
              <TouchableOpacity onPress={() => setShowModules(false)}>
                <IconSymbol name="xmark" size={24} color={textColor} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.moduleList}>
              {[1, 2, 3].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.moduleItem,
                    { backgroundColor: backgroundColor },
                    currentModule === num && { borderColor: "#4f46e5", borderWidth: 2 }
                  ]}
                  onPress={() => {
                    setCurrentModule(num);
                    setShowModules(false);
                  }}
                >
                  <View style={[
                    styles.moduleIcon,
                    { backgroundColor: currentModule === num ? "#4f46e5" : '#E0E0E0' }
                  ]}>
                    <ThemedText style={{ fontSize: 24 }}>
                      {num === 1 ? '📄' : num === 2 ? '🗺️' : '🎥'}
                    </ThemedText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.moduleItemTitle}>
                      Module {num}
                    </ThemedText>
                    <ThemedText style={styles.moduleItemSubtitle}>
                      {num === 1 ? 'Main Content PDF' : num === 2 ? 'Mind Map PDF' : 'Video Lecture'}
                    </ThemedText>
                  </View>
                  {currentModule === num && (
                    <View style={styles.activeDot} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Content Area */}
      <View style={styles.contentArea}>
        {!moduleUrl ? (
          <View style={styles.loadingContainer}>
            <ThemedText>Content is not available for this module yet.</ThemedText>
          </View>
        ) : useWebPlayer ? (
          <WebView
            source={{ uri: moduleUrl }}
            style={styles.webview}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ThemedText>Loading PDF...</ThemedText>
              </View>
            )}
          />
        ) : (
          <View style={styles.videoContainer}>
            <Video
              ref={videoRef}
              source={{ uri: moduleUrl }}
              style={styles.video}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              isLooping={false}
            />
          </View>
        )}
      </View>

      {/* Module Navigation */}
      <View style={[styles.footer, { backgroundColor: cardColor }]}>
        <TouchableOpacity
          style={[styles.navButton, currentModule === 1 && styles.navButtonDisabled]}
          onPress={() => currentModule > 1 && setCurrentModule(currentModule - 1)}
          disabled={currentModule === 1}
        >
          <IconSymbol name="chevron.left" size={20} color={currentModule === 1 ? '#CCC' : textColor} />
          <ThemedText style={[styles.navButtonText, currentModule === 1 && { color: '#CCC' }]}>
            Previous
          </ThemedText>
        </TouchableOpacity>

        <View style={styles.moduleIndicator}>
          {[1, 2, 3].map((num) => (
            <View
              key={num}
              style={[
                styles.dot,
                { backgroundColor: currentModule === num ? "#4f46e5" : '#E0E0E0' }
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.navButton, currentModule === 3 && styles.navButtonDisabled]}
          onPress={() => currentModule < 3 && setCurrentModule(currentModule + 1)}
          disabled={currentModule === 3}
        >
          <ThemedText style={[styles.navButtonText, currentModule === 3 && { color: '#CCC' }]}>
            Next
          </ThemedText>
          <IconSymbol name="chevron.right" size={20} color={currentModule === 3 ? '#CCC' : textColor} />
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  moduleInfo: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  menuButton: {
    padding: 8,
    borderRadius: 8,
  },
  languageToggle: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  langButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  langText: {
    fontSize: 13,
    fontWeight: '600',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  overlayBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modulePanel: {
    position: 'absolute',
    top: 120,
    right: 16,
    width: width * 0.85,
    maxWidth: 350,
    borderRadius: 20,
    maxHeight: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modulePanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modulePanelTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  moduleList: {
    padding: 12,
  },
  moduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
    gap: 12,
  },
  moduleIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  moduleItemSubtitle: {
    fontSize: 12,
    opacity: 0.6,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4f46e5",
  },
  contentArea: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  navButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  moduleIndicator: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
