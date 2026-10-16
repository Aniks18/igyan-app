/**
 * Content Generator - Generated Content Component (for PPT/PDF)
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useThemeColor } from '../../hooks/useThemeColor';

export default function GeneratedContent({ content, template }) {
  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');

  const primaryColor = `#${template.colors.primary}`;

  // For PDF content (sections format)
  if (content.type === 'pdf' && content.sections) {
    return (
      <View style={styles.container}>
        <View style={[styles.titleCard, { backgroundColor: primaryColor }]}>
          <Text style={styles.documentTitle}>{content.title}</Text>
        </View>

        {content.sections.map((section, index) => (
          <View
            key={index}
            style={[styles.sectionCard, { backgroundColor: cardColor, borderColor }]}
          >
            <Text style={[styles.sectionHeading, { color: primaryColor }]}>
              {section.heading}
            </Text>
            <Text style={[styles.sectionContent, { color: textColor }]}>
              {section.content}
            </Text>
          </View>
        ))}
      </View>
    );
  }

  // For PPT content (slides format)
  if (content.slides) {
    return (
      <View style={styles.container}>
        <View style={[styles.titleCard, { backgroundColor: primaryColor }]}>
          <Text style={styles.documentTitle}>{content.title}</Text>
        </View>

        {content.slides.map((slide, index) => (
          <View
            key={index}
            style={[styles.slideCard, { backgroundColor: cardColor, borderColor }]}
          >
            <View style={styles.slideHeader}>
              <View style={[styles.slideNumber, { backgroundColor: `${primaryColor}20` }]}>
                <Text style={[styles.slideNumberText, { color: primaryColor }]}>
                  {index + 1}
                </Text>
              </View>
              <Text style={[styles.slideTitle, { color: textColor }]}>{slide.title}</Text>
            </View>
            <Text style={[styles.slideContent, { color: textColor }]}>{slide.content}</Text>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={[styles.noContent, { backgroundColor: cardColor }]}>
      <Text style={{ color: textColor }}>No content generated</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  titleCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  documentTitle: {
    color: "#12305c",
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  sectionCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  sectionContent: {
    fontSize: 14,
    lineHeight: 22,
  },
  slideCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  slideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  slideNumber: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  slideNumberText: {
    fontSize: 14,
    fontWeight: '700',
  },
  slideTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  slideContent: {
    fontSize: 14,
    lineHeight: 22,
  },
  noContent: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
});
