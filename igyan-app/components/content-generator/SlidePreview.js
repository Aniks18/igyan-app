/**
 * Content Generator - Slide Preview Component (for Shark PPT)
 */

import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { IconSymbol } from '../IconSymbol';
import { useThemeColor } from '../../hooks/useThemeColor';

export default function SlidePreview({
  slide,
  index,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onSlideChange,
  onMetricChange,
  template,
}) {
  const cardColor = useThemeColor({}, 'card');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');

  const primaryColor = `#${template.colors.primary}`;

  return (
    <View style={[styles.slideCard, { backgroundColor: cardColor, borderColor }]}>
      {/* Slide Header */}
      <View style={styles.slideHeader}>
        <View style={[styles.slideNumber, { backgroundColor: primaryColor }]}>
          <Text style={styles.slideNumberText}>{index + 1}</Text>
        </View>
        <View style={styles.slideHeaderInfo}>
          {isEditing ? (
            <TextInput
              style={[styles.editInput, styles.titleInput, { color: textColor, borderColor }]}
              value={slide.title}
              onChangeText={(val) => onSlideChange('title', val)}
              accessibilityLabel="Slide title"
            />
          ) : (
            <Text style={[styles.slideTitle, { color: textColor }]}>
              {slide.title}
            </Text>
          )}
          {slide.timing && (
            <Text style={styles.timing}>{slide.timing}</Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.editButton}
          onPress={isEditing ? onSave : onEdit}
          accessibilityRole="button"
          accessibilityLabel={isEditing ? 'Save slide title' : 'Edit slide title'}
          hitSlop={8}
        >
          <IconSymbol
            name={isEditing ? 'checkmark' : 'pencil'}
            size={16}
            color={primaryColor}
          />
        </TouchableOpacity>
      </View>

      {/* Subtitle */}
      {slide.subtitle && (
        <View style={styles.subtitleContainer}>
          {isEditing ? (
            <TextInput
              style={[styles.editInput, { color: textColor, borderColor }]}
              value={slide.subtitle}
              onChangeText={(val) => onSlideChange('subtitle', val)}
              placeholder="Subtitle"
              placeholderTextColor="#476b9c"
            />
          ) : (
            <Text style={[styles.subtitle, { color: primaryColor }]}>{slide.subtitle}</Text>
          )}
        </View>
      )}

      {/* Content */}
      <View style={styles.contentContainer}>
        {isEditing ? (
          <TextInput
            style={[styles.editInput, styles.contentInput, { color: textColor, borderColor }]}
            value={slide.content}
            onChangeText={(val) => onSlideChange('content', val)}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            placeholder="Bullet points..."
            placeholderTextColor="#476b9c"
          />
        ) : (
          <Text style={[styles.content, { color: textColor }]}>{slide.content}</Text>
        )}
      </View>

      {/* Metrics */}
      {slide.metrics && slide.metrics.length > 0 && (
        <View style={styles.metricsContainer}>
          {slide.metrics.map((metric, metricIdx) => (
            <View
              key={metricIdx}
              style={[styles.metricCard, { backgroundColor: `${primaryColor}15` }]}
            >
              {isEditing ? (
                <>
                  <TextInput
                    style={[styles.metricInput, { color: primaryColor }]}
                    value={metric.value}
                    onChangeText={(val) => onMetricChange(metricIdx, 'value', val)}
                    placeholder="Value"
                    placeholderTextColor="#476b9c"
                  />
                  <TextInput
                    style={[styles.metricLabelInput, { color: textColor }]}
                    value={metric.label}
                    onChangeText={(val) => onMetricChange(metricIdx, 'label', val)}
                    placeholder="Label"
                    placeholderTextColor="#476b9c"
                  />
                </>
              ) : (
                <>
                  <Text style={[styles.metricValue, { color: primaryColor }]}>
                    {metric.value}
                  </Text>
                  <Text style={styles.metricLabel}>{metric.label}</Text>
                </>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Tagline */}
      {slide.tagline && !isEditing && (
        <Text style={[styles.tagline, { borderTopColor: borderColor }]}>
          {slide.tagline}
        </Text>
      )}

      {/* Edit Actions */}
      {isEditing && (
        <View style={styles.editActions}>
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel} accessibilityRole="button" accessibilityLabel="Cancel slide edits">
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: primaryColor }]}
            onPress={onSave}
            accessibilityRole="button"
            accessibilityLabel="Save slide changes"
          >
            <Text style={styles.saveText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  slideCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  slideHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  slideNumber: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  slideNumberText: {
    color: "#12305c",
    fontSize: 16,
    fontWeight: '700',
  },
  slideHeaderInfo: {
    flex: 1,
  },
  slideTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  timing: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  editButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitleContainer: {
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  contentContainer: {
    marginBottom: 12,
  },
  content: {
    fontSize: 14,
    lineHeight: 22,
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  metricCard: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 80,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  metricLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  metricInput: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    minWidth: 60,
  },
  metricLabelInput: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
  tagline: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  editInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  titleInput: {
    fontSize: 16,
    fontWeight: '600',
  },
  contentInput: {
    minHeight: 100,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#d9e3f3",
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 44,
    justifyContent: 'center',
  },
  cancelText: {
    color: "#476b9c",
    fontSize: 14,
    fontWeight: '500',
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  saveText: {
    color: "#12305c",
    fontSize: 14,
    fontWeight: '600',
  },
});
