/**
 * iGyan App - Content Generator Page
 * AI-powered document and presentation creator
 */

import React, { useState, useRef } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { File, Paths } from 'expo-file-system/next';
import * as Sharing from 'expo-sharing';
import PptxGenJS from 'pptxgenjs';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import { IconSymbol } from '../../components/IconSymbol';
import Header from '../../components/Header';
import { useThemeColor } from '../../hooks/useThemeColor';
import { useSideNav } from '../../utils/SideNavContext';
import FormatSelector from '../../components/content-generator/FormatSelector';
import TemplateSelector from '../../components/content-generator/TemplateSelector';
import SlidePreview from '../../components/content-generator/SlidePreview';
import GeneratedContent from '../../components/content-generator/GeneratedContent';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Templates
const templates = [
  {
    id: 'professional',
    name: 'Professional',
    colors: {
      primary: '4472C4',
      secondary: '5B9BD5',
      text: '333333',
      background: 'FFFFFF',
      accent: 'ED7D31',
    },
  },
  {
    id: 'vibrant',
    name: 'Vibrant',
    colors: {
      primary: 'FF6B6B',
      secondary: '4ECDC4',
      text: '2C3E50',
      background: 'FFFFFF',
      accent: 'FFE66D',
    },
  },
];

export default function ContentGeneratorPage() {
  const { openSideNav } = useSideNav();
  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');
  const mutedColor = useThemeColor({}, 'icon');

  // State
  const [topic, setTopic] = useState('');
  const [generateError, setGenerateError] = useState('');
  const [contentType, setContentType] = useState('ppt'); // ppt, pdf, shark-ppt
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0]);
  const [editedSlides, setEditedSlides] = useState(null);
  const [editingSlideIndex, setEditingSlideIndex] = useState(null);

  // Get AI prompt based on content type
  const getPrompt = (type, topicText) => {
    if (type === 'shark-ppt') {
      return {
        system: `You are a distinguished startup pitch strategist specializing in the Indian entrepreneurial ecosystem. Create investor-ready pitch deck content.

IMPORTANT GUIDELINES:
- Use sophisticated vocabulary: "paradigm shift" not "change", "unprecedented" not "new", "catalyse" not "help", "burgeoning" not "growing", "democratise" not "make available"
- All monetary values MUST be in Indian notation: ₹ Crores and ₹ Lakhs
- Include realistic metrics for Indian market (TAM, SAM, ARPU, etc.)
- Create exactly 5 slides for a 5-minute pitch

Return JSON format:
{
  "title": "Company/Product Name",
  "tagline": "One-line description",
  "slides": [
    {
      "id": 1,
      "title": "Company Introduction",
      "timing": "1-2 minutes",
      "subtitle": "Subtitle here",
      "content": "- Bullet point 1\\n- Bullet point 2\\n- Bullet point 3",
      "tagline": "Slide tagline",
      "metrics": [{"value": "10L+", "label": "Users"}, {"value": "₹50Cr", "label": "Revenue"}]
    }
  ]
}`,
        user: `Create an investor pitch deck for: ${topicText}`,
      };
    } else if (type === 'pdf') {
      return {
        system: `You are a professional document writer. Create well-structured content for a PDF document.

Return JSON format:
{
  "title": "Document Title",
  "sections": [
    {
      "heading": "Section Heading",
      "content": "Section content with multiple paragraphs..."
    }
  ]
}`,
        user: `Create a comprehensive document about: ${topicText}`,
      };
    } else {
      return {
        system: `You are a professional presentation creator. Create educational presentation content with 5-7 slides.

Return JSON format:
{
  "title": "Presentation Title",
  "slides": [
    {
      "title": "Slide Title",
      "content": "- Bullet point 1\\n- Bullet point 2\\n- Bullet point 3"
    }
  ]
}`,
        user: `Create a presentation about: ${topicText}`,
      };
    }
  };

  // Generate content
  const handleGenerate = async () => {
    if (!topic.trim()) {
      setGenerateError('Enter a topic to generate content.');
      return;
    }
    setGenerateError('');

    setIsGenerating(true);
    setGeneratedContent(null);
    setEditedSlides(null);

    try {
      const prompt = getPrompt(contentType, topic);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: prompt.system },
            { role: 'user', content: prompt.user },
          ],
          temperature: 0.7,
          max_tokens: 3000,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const data = await response.json();
      const content = JSON.parse(data.choices[0].message.content);

      setGeneratedContent({
        type: contentType,
        ...content,
      });

      if (contentType === 'shark-ppt' && content.slides) {
        setEditedSlides(content.slides);
      }
    } catch (error) {
      console.error('Generation error:', error);
      setGenerateError('Content generation failed. Check your connection and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle slide edit
  const handleSlideEdit = (slideIndex, field, value) => {
    if (!editedSlides) return;
    
    const updated = [...editedSlides];
    updated[slideIndex] = {
      ...updated[slideIndex],
      [field]: value,
    };
    setEditedSlides(updated);
  };

  // Handle metric edit
  const handleMetricEdit = (slideIndex, metricIndex, field, value) => {
    if (!editedSlides) return;
    
    const updated = [...editedSlides];
    const metrics = [...(updated[slideIndex].metrics || [])];
    metrics[metricIndex] = {
      ...metrics[metricIndex],
      [field]: value,
    };
    updated[slideIndex] = {
      ...updated[slideIndex],
      metrics,
    };
    setEditedSlides(updated);
  };

  // Reset
  const handleReset = () => {
    setTopic('');
    setGeneratedContent(null);
    setEditedSlides(null);
    setEditingSlideIndex(null);
  };

  // Generate PowerPoint using PptxGenJS with professional templates
  const generatePPTX = async () => {
    const pptx = new PptxGenJS();
    const template = selectedTemplate;
    const primaryColor = template.colors.primary;
    const secondaryColor = template.colors.secondary;
    const accentColor = template.colors.accent;
    const textColor = template.colors.text;
    const bgColor = template.colors.background;
    
    // Set presentation properties
    pptx.author = 'iGyan App';
    pptx.title = generatedContent?.title || 'Presentation';
    pptx.subject = topic;
    pptx.company = 'iGyan Education';
    pptx.layout = 'LAYOUT_16x9';

    // ============ TITLE SLIDE ============
    const titleSlide = pptx.addSlide();
    
    // Background gradient effect with shapes
    titleSlide.addShape(pptx.shapes.RECTANGLE, {
      x: 0, y: 0, w: '100%', h: '100%',
      fill: { color: primaryColor },
    });
    
    // Decorative circles
    titleSlide.addShape(pptx.shapes.OVAL, {
      x: -1, y: -1, w: 4, h: 4,
      fill: { color: secondaryColor, transparency: 70 },
      line: { color: secondaryColor, transparency: 70 },
    });
    titleSlide.addShape(pptx.shapes.OVAL, {
      x: 8, y: 4, w: 3, h: 3,
      fill: { color: accentColor, transparency: 80 },
      line: { color: accentColor, transparency: 80 },
    });
    titleSlide.addShape(pptx.shapes.OVAL, {
      x: 7, y: -0.5, w: 2, h: 2,
      fill: { color: 'FFFFFF', transparency: 90 },
      line: { color: 'FFFFFF', transparency: 90 },
    });
    
    // Diagonal accent stripe
    titleSlide.addShape(pptx.shapes.RECTANGLE, {
      x: 0, y: 5, w: '100%', h: 0.15,
      fill: { color: accentColor },
      rotate: -2,
    });
    
    // Title text with shadow effect
    titleSlide.addText(generatedContent?.title || 'Presentation', {
      x: 0.5, y: 2, w: 9, h: 1.5,
      fontSize: 48, fontFace: 'Arial', color: 'FFFFFF', 
      align: 'center', bold: true,
      shadow: { type: 'outer', blur: 8, offset: 3, angle: 45, color: '000000', opacity: 0.3 },
    });
    
    // Tagline
    if (generatedContent?.tagline) {
      titleSlide.addText(generatedContent.tagline, {
        x: 1, y: 3.6, w: 8, h: 0.8,
        fontSize: 22, fontFace: 'Arial', color: 'FFFFFF', 
        align: 'center', italic: true, transparency: 10,
      });
    }
    
    // Bottom bar with branding
    titleSlide.addShape(pptx.shapes.RECTANGLE, {
      x: 0, y: 6.6, w: '100%', h: 0.9,
      fill: { color: '000000', transparency: 70 },
    });
    titleSlide.addText('Powered by iGyan AI', {
      x: 0.5, y: 6.75, w: 4, h: 0.5,
      fontSize: 12, fontFace: 'Arial', color: 'FFFFFF', transparency: 30,
    });
    titleSlide.addText(new Date().toLocaleDateString(), {
      x: 5.5, y: 6.75, w: 4, h: 0.5,
      fontSize: 12, fontFace: 'Arial', color: 'FFFFFF', align: 'right', transparency: 30,
    });

    // ============ CONTENT SLIDES ============
    const slidesData = editedSlides || generatedContent?.slides || [];
    const totalSlides = slidesData.length || generatedContent?.sections?.length || 0;
    
    const addContentSlide = (title, content, slideNum, extras = {}) => {
      const slide = pptx.addSlide();
      
      // Background
      slide.addShape(pptx.shapes.RECTANGLE, {
        x: 0, y: 0, w: '100%', h: '100%',
        fill: { color: bgColor },
      });
      
      // Header bar with gradient effect
      slide.addShape(pptx.shapes.RECTANGLE, {
        x: 0, y: 0, w: '100%', h: 1.2,
        fill: { color: primaryColor },
      });
      
      // Accent line under header
      slide.addShape(pptx.shapes.RECTANGLE, {
        x: 0, y: 1.2, w: '100%', h: 0.08,
        fill: { color: accentColor },
      });
      
      // Decorative corner element
      slide.addShape(pptx.shapes.RIGHT_TRIANGLE, {
        x: 8.5, y: 0, w: 1.5, h: 1.2,
        fill: { color: secondaryColor, transparency: 50 },
        rotate: 180,
      });
      
      // Slide number badge
      slide.addShape(pptx.shapes.OVAL, {
        x: 0.3, y: 0.25, w: 0.7, h: 0.7,
        fill: { color: 'FFFFFF' },
        line: { color: 'FFFFFF' },
      });
      slide.addText(String(slideNum), {
        x: 0.3, y: 0.35, w: 0.7, h: 0.5,
        fontSize: 18, fontFace: 'Arial', color: primaryColor, align: 'center', bold: true,
      });
      
      // Title
      slide.addText(title, {
        x: 1.2, y: 0.3, w: 7.5, h: 0.7,
        fontSize: 28, fontFace: 'Arial', color: 'FFFFFF', bold: true,
        valign: 'middle',
      });
      
      // Timing badge if exists
      if (extras.timing) {
        slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
          x: 8.2, y: 0.35, w: 1.3, h: 0.5,
          fill: { color: accentColor },
          rectRadius: 0.1,
        });
        slide.addText(extras.timing, {
          x: 8.2, y: 0.4, w: 1.3, h: 0.4,
          fontSize: 11, fontFace: 'Arial', color: textColor, align: 'center', bold: true,
        });
      }
      
      // Subtitle if exists
      let yPos = 1.5;
      if (extras.subtitle) {
        slide.addText(extras.subtitle, {
          x: 0.5, y: yPos, w: 9, h: 0.5,
          fontSize: 16, fontFace: 'Arial', color: primaryColor, italic: true,
        });
        yPos += 0.6;
      }
      
      // Content with bullet points
      const contentLines = content.split('\n').filter(line => line.trim());
      const bulletRows = contentLines.map(line => {
        const cleanLine = line.replace(/^[•\-]\s*/, '').trim();
        return [{ text: cleanLine, options: { bullet: { type: 'bullet', color: primaryColor }, color: textColor } }];
      });
      
      if (bulletRows.length > 0) {
        slide.addTable(bulletRows, {
          x: 0.5, y: yPos, w: 9, h: 3.5,
          fontFace: 'Arial', fontSize: 16,
          color: textColor,
          valign: 'top',
          border: { type: 'none' },
          margin: [0.1, 0, 0.1, 0.3],
        });
      }
      
      // Metrics section for Shark Tank pitches
      if (extras.metrics && extras.metrics.length > 0) {
        const metricsY = 5.2;
        const metricsWidth = 2.2;
        const startX = (10 - (extras.metrics.length * metricsWidth + (extras.metrics.length - 1) * 0.3)) / 2;
        
        extras.metrics.forEach((metric, mIdx) => {
          const xPos = startX + (mIdx * (metricsWidth + 0.3));
          
          // Metric card background
          slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
            x: xPos, y: metricsY, w: metricsWidth, h: 1.1,
            fill: { color: primaryColor, transparency: 90 },
            line: { color: primaryColor, width: 2 },
            rectRadius: 0.1,
          });
          
          // Metric value
          slide.addText(metric.value, {
            x: xPos, y: metricsY + 0.1, w: metricsWidth, h: 0.55,
            fontSize: 24, fontFace: 'Arial', color: primaryColor, align: 'center', bold: true,
          });
          
          // Metric label
          slide.addText(metric.label, {
            x: xPos, y: metricsY + 0.65, w: metricsWidth, h: 0.35,
            fontSize: 11, fontFace: 'Arial', color: '666666', align: 'center',
          });
        });
      }
      
      // Tagline/tip box
      if (extras.tagline) {
        slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
          x: 0.5, y: 6.4, w: 9, h: 0.5,
          fill: { color: accentColor, transparency: 85 },
          line: { color: accentColor, width: 1 },
          rectRadius: 0.05,
        });
        slide.addText(`💡 ${extras.tagline}`, {
          x: 0.6, y: 6.45, w: 8.8, h: 0.4,
          fontSize: 13, fontFace: 'Arial', color: textColor, italic: true,
        });
      }
      
      // Footer with slide progress
      slide.addShape(pptx.shapes.RECTANGLE, {
        x: 0, y: 7.3, w: '100%', h: 0.2,
        fill: { color: 'EEEEEE' },
      });
      slide.addShape(pptx.shapes.RECTANGLE, {
        x: 0, y: 7.3, w: `${(slideNum / totalSlides) * 100}%`, h: 0.2,
        fill: { color: primaryColor },
      });
      
      return slide;
    };
    
    // Generate content slides based on type
    if (contentType === 'shark-ppt' && slidesData.length > 0) {
      slidesData.forEach((slide, index) => {
        addContentSlide(slide.title, slide.content, index + 1, {
          timing: slide.timing,
          subtitle: slide.subtitle,
          metrics: slide.metrics,
          tagline: slide.tagline,
        });
      });
    } else if (contentType === 'pdf' && generatedContent?.sections) {
      generatedContent.sections.forEach((section, index) => {
        addContentSlide(section.heading, section.content, index + 1, {});
      });
    } else if (generatedContent?.slides) {
      generatedContent.slides.forEach((slide, index) => {
        addContentSlide(slide.title, slide.content, index + 1, {});
      });
    }

    // ============ THANK YOU SLIDE ============
    const endSlide = pptx.addSlide();
    
    // Background
    endSlide.addShape(pptx.shapes.RECTANGLE, {
      x: 0, y: 0, w: '100%', h: '100%',
      fill: { color: primaryColor },
    });
    
    // Decorative elements
    endSlide.addShape(pptx.shapes.OVAL, {
      x: -2, y: 3, w: 5, h: 5,
      fill: { color: secondaryColor, transparency: 70 },
      line: { color: secondaryColor, transparency: 70 },
    });
    endSlide.addShape(pptx.shapes.OVAL, {
      x: 7, y: -1, w: 4, h: 4,
      fill: { color: accentColor, transparency: 75 },
      line: { color: accentColor, transparency: 75 },
    });
    endSlide.addShape(pptx.shapes.OVAL, {
      x: 8, y: 5, w: 2.5, h: 2.5,
      fill: { color: 'FFFFFF', transparency: 85 },
      line: { color: 'FFFFFF', transparency: 85 },
    });
    
    // Thank you text
    endSlide.addText('Thank You!', {
      x: 0.5, y: 2.3, w: 9, h: 1.2,
      fontSize: 56, fontFace: 'Arial', color: 'FFFFFF', 
      align: 'center', bold: true,
      shadow: { type: 'outer', blur: 8, offset: 3, angle: 45, color: '000000', opacity: 0.3 },
    });
    
    // Divider line
    endSlide.addShape(pptx.shapes.RECTANGLE, {
      x: 3.5, y: 3.7, w: 3, h: 0.06,
      fill: { color: accentColor },
    });
    
    // Subtitle
    endSlide.addText('Questions & Discussion', {
      x: 1, y: 4, w: 8, h: 0.6,
      fontSize: 24, fontFace: 'Arial', color: 'FFFFFF', align: 'center',
    });
    
    // Branding
    endSlide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 3, y: 5.5, w: 4, h: 0.7,
      fill: { color: 'FFFFFF', transparency: 80 },
      rectRadius: 0.1,
    });
    endSlide.addText('Created with iGyan AI', {
      x: 3, y: 5.6, w: 4, h: 0.5,
      fontSize: 14, fontFace: 'Arial', color: 'FFFFFF', align: 'center', bold: true,
    });

    return pptx;
  };

  // Handle download
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!generatedContent) {
      Alert.alert('Error', 'No content to download');
      return;
    }

    setIsDownloading(true);

    try {
      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      
      // Generate PowerPoint
      const pptx = await generatePPTX();
      
      // Create filename
      const timestamp = new Date().getTime();
      const sanitizedTitle = (generatedContent.title || 'presentation')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .substring(0, 30);
      const fileName = `${sanitizedTitle}_${timestamp}.pptx`;
      
      // Generate base64 data
      const pptxBase64 = await pptx.write({ outputType: 'base64' });
      
      // Write file using expo-file-system
      const file = new File(Paths.cache, fileName);
      file.create();
      
      // Convert base64 to binary and write
      const binaryString = atob(pptxBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      file.write(bytes);
      
      const filePath = file.uri;

      if (isAvailable) {
        // Share the file
        await Sharing.shareAsync(filePath, {
          mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          dialogTitle: 'Save your PowerPoint presentation',
          UTI: 'org.openxmlformats.presentationml.presentation',
        });
        
        Alert.alert(
          'Success!',
          'Your PowerPoint presentation has been exported!\n\nOpen it with Microsoft PowerPoint, Google Slides, or any compatible app.',
          [{ text: 'Got it!' }]
        );
      } else {
        Alert.alert(
          'File Saved',
          `File saved to: ${filePath}\n\nSharing is not available on this device.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', `Failed to generate PowerPoint: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Header
        title="Content Generator"
        onMenuPress={openSideNav}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroIconContainer}>
            <IconSymbol name="doc.richtext.fill" size={32} color="#fff" />
          </View>
          <ThemedText style={styles.heroTitle}>AI Content Generator</ThemedText>
          <ThemedText style={styles.heroSubtitle}>
            Create professional presentations & documents instantly
          </ThemedText>
        </View>

        {!generatedContent ? (
          <>
            {/* Format Selection */}
            <View style={[styles.section, { backgroundColor: cardColor }]}>
              <ThemedText style={styles.sectionTitle}>Select Format</ThemedText>
              <FormatSelector
                selected={contentType}
                onSelect={setContentType}
              />
            </View>

            {/* Template Selection */}
            <View style={[styles.section, { backgroundColor: cardColor }]}>
              <ThemedText style={styles.sectionTitle}>Choose Template</ThemedText>
              <TemplateSelector
                templates={templates}
                selected={selectedTemplate}
                onSelect={setSelectedTemplate}
              />
            </View>

            {/* Topic Input */}
            <View style={[styles.section, { backgroundColor: cardColor }]}>
              <ThemedText style={styles.sectionTitle}>
                {contentType === 'shark-ppt' ? 'Your Startup/Idea' : 'Enter Topic'}
              </ThemedText>
              <TextInput
                style={[styles.input, { borderColor, color: textColor }, generateError && styles.inputInvalid]}
                placeholder={
                  contentType === 'shark-ppt'
                    ? 'e.g., AI-powered EdTech platform for rural India'
                    : 'e.g., Climate Change and Its Impact'
                }
                placeholderTextColor={mutedColor}
                value={topic}
                onChangeText={value => { setTopic(value); if (generateError) setGenerateError(''); }}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                accessibilityLabel={contentType === 'shark-ppt' ? 'Describe your startup or idea' : 'Enter topic'}
              />
              {generateError ? (
                <View style={styles.errorBox}>
                  <ThemedText accessibilityLiveRegion="polite" style={styles.errorText}>{generateError}</ThemedText>
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={handleGenerate}
                    disabled={isGenerating || !topic.trim()}
                    accessibilityRole="button"
                    accessibilityLabel="Try generating content again"
                  >
                    <Text style={styles.retryButtonText}>Try again</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>

            {/* Generate Button */}
            <TouchableOpacity
              style={[
                styles.generateButton,
                (!topic.trim() || isGenerating) && styles.buttonDisabled,
              ]}
              onPress={handleGenerate}
              disabled={!topic.trim() || isGenerating}
              accessibilityRole="button"
              accessibilityLabel="Generate content"
              accessibilityState={{ disabled: !topic.trim() || isGenerating, busy: isGenerating }}
            >
              {isGenerating ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.generateButtonText}>Generating...</Text>
                </View>
              ) : (
                <View style={styles.loadingRow}>
                  <IconSymbol name="sparkles" size={20} color="#fff" />
                  <Text style={styles.generateButtonText}>Generate Content</Text>
                </View>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Generated Content */}
            {contentType === 'shark-ppt' && editedSlides ? (
              <View style={styles.slidesContainer}>
                <View style={styles.contentHeader}>
                  <ThemedText style={styles.contentTitle}>
                    {generatedContent.title}
                  </ThemedText>
                  {generatedContent.tagline && (
                    <ThemedText style={styles.contentTagline}>
                      {generatedContent.tagline}
                    </ThemedText>
                  )}
                </View>

                {editedSlides.map((slide, index) => (
                  <SlidePreview
                    key={slide.id}
                    slide={slide}
                    index={index}
                    isEditing={editingSlideIndex === index}
                    onEdit={() => setEditingSlideIndex(index)}
                    onSave={() => setEditingSlideIndex(null)}
                    onCancel={() => setEditingSlideIndex(null)}
                    onSlideChange={(field, value) => handleSlideEdit(index, field, value)}
                    onMetricChange={(metricIdx, field, value) =>
                      handleMetricEdit(index, metricIdx, field, value)
                    }
                    template={selectedTemplate}
                  />
                ))}
              </View>
            ) : (
              <GeneratedContent
                content={generatedContent}
                template={selectedTemplate}
              />
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.downloadButton, isDownloading && styles.disabledButton]}
                onPress={handleDownload}
                disabled={isDownloading}
                accessibilityRole="button"
                accessibilityLabel="Download presentation"
                accessibilityState={{ disabled: isDownloading, busy: isDownloading }}
              >
                {isDownloading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <IconSymbol name="arrow.down.circle.fill" size={20} color="#fff" />
                )}
                <Text style={styles.actionButtonText}>
                  {isDownloading ? 'Exporting...' : 'Download'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.resetButton]}
                onPress={handleReset}
                accessibilityRole="button"
                accessibilityLabel="Start over with new content"
              >
                <IconSymbol name="arrow.counterclockwise" size={20} color="#4f46e5" />
                <Text style={[styles.actionButtonText, { color: "#4f46e5" }]}>
                  Start Over
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Features Info */}
        {!generatedContent && (
          <View style={styles.featuresSection}>
            <ThemedText style={styles.featuresTitle}>Features</ThemedText>
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <IconSymbol name="sparkles" size={14} color="#4f46e5" />
                <Text style={styles.featureText}>AI-powered content</Text>
              </View>
              <View style={styles.featureItem}>
                <IconSymbol name="rectangle.stack.fill" size={14} color="#4f46e5" />
                <Text style={styles.featureText}>Multiple formats</Text>
              </View>
              <View style={styles.featureItem}>
                <IconSymbol name="pencil" size={14} color="#4f46e5" />
                <Text style={styles.featureText}>Live editing</Text>
              </View>
              <View style={styles.featureItem}>
                <IconSymbol name="briefcase.fill" size={14} color="#4f46e5" />
                <Text style={styles.featureText}>Investor pitch mode</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 20,
  },
  heroIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "#4f46e5",
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: "#476b9c",
    textAlign: 'center',
  },
  section: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    minHeight: 80,
  },
  generateButton: {
    backgroundColor: "#4f46e5",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  slidesContainer: {
    marginBottom: 16,
  },
  contentHeader: {
    marginBottom: 16,
  },
  contentTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  contentTagline: {
    fontSize: 14,
    color: "#4f46e5",
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  downloadButton: {
    backgroundColor: '#10b981',
  },
  disabledButton: {
    opacity: 0.6,
  },
  resetButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: "#4f46e5",
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  featuresSection: {
    marginTop: 8,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  featuresList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 171, 244, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  featureText: {
    fontSize: 13,
    color: "#4f46e5",
    fontWeight: '500',
  },
  inputInvalid: {
    borderColor: '#b3261e',
  },
  errorBox: {
    marginTop: 12,
    backgroundColor: '#fdecea',
    borderWidth: 1,
    borderColor: '#b3261e',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  errorText: {
    fontSize: 14,
    lineHeight: 20,
  },
  retryButton: {
    alignSelf: 'flex-start',
    backgroundColor: "#4f46e5",
    borderRadius: 10,
    paddingHorizontal: 16,
    minHeight: 44,
    justifyContent: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
