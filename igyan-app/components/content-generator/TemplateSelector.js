/**
 * Content Generator - Template Selector Component
 */

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { IconSymbol } from '../IconSymbol';
import { useThemeColor } from '../../hooks/useThemeColor';

export default function TemplateSelector({ templates, selected, onSelect }) {
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');

  return (
    <View style={styles.container}>
      {templates.map((template) => (
        <TouchableOpacity
          key={template.id}
          style={[
            styles.templateCard,
            {
              borderColor: selected.id === template.id ? `#${template.colors.primary}` : borderColor,
              backgroundColor: selected.id === template.id ? `#${template.colors.primary}10` : 'transparent',
            },
          ]}
          onPress={() => onSelect(template)}
          activeOpacity={0.7}
          accessibilityRole="radio"
          accessibilityState={{ checked: selected.id === template.id }}
          accessibilityLabel={`${template.name} template`}
        >
          {/* Color Preview */}
          <View style={styles.colorPreview}>
            <View style={[styles.colorDot, { backgroundColor: `#${template.colors.primary}` }]} />
            <View style={[styles.colorDot, { backgroundColor: `#${template.colors.secondary}` }]} />
            <View style={[styles.colorDot, { backgroundColor: `#${template.colors.accent}` }]} />
          </View>

          <Text style={[styles.templateName, { color: textColor }]}>{template.name}</Text>

          {selected.id === template.id && (
            <View style={[styles.checkmark, { backgroundColor: `#${template.colors.primary}` }]}>
              <IconSymbol name="checkmark" size={12} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
  },
  templateCard: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    position: 'relative',
  },
  colorPreview: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  colorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  templateName: {
    fontSize: 14,
    fontWeight: '600',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
