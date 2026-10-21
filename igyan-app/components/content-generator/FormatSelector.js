/**
 * Content Generator - Format Selector Component
 */

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { IconSymbol } from '../IconSymbol';
import { useThemeColor } from '../../hooks/useThemeColor';

const formats = [
  {
    id: 'ppt',
    name: 'PowerPoint',
    description: 'Presentation slides',
    icon: 'rectangle.stack.fill',
    color: '#FF6B35',
  },
  {
    id: 'pdf',
    name: 'PDF Document',
    description: 'Text document',
    icon: 'doc.text.fill',
    color: '#E74C3C',
  },
  {
    id: 'shark-ppt',
    name: 'Shark Pitch',
    description: 'Investor deck',
    icon: 'briefcase.fill',
    color: "#4f46e5",
    isNew: true,
  },
];

export default function FormatSelector({ selected, onSelect }) {
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'icon');

  return (
    <View style={styles.container}>
      {formats.map((format) => (
        <TouchableOpacity
          key={format.id}
          style={[
            styles.formatCard,
            {
              backgroundColor: selected === format.id ? `${format.color}15` : 'transparent',
              borderColor: selected === format.id ? format.color : borderColor,
            },
          ]}
          onPress={() => onSelect(format.id)}
          activeOpacity={0.7}
          accessibilityRole="radio"
          accessibilityState={{ checked: selected === format.id }}
          accessibilityLabel={`${format.name}. ${format.description}`}
        >
          <View style={[styles.iconContainer, { backgroundColor: `${format.color}20` }]}>
            <IconSymbol name={format.icon} size={24} color={format.color} />
          </View>

          <View style={styles.formatInfo}>
            <View style={styles.formatHeader}>
              <Text style={[styles.formatName, { color: textColor }]}>{format.name}</Text>
              {format.isNew && (
                <View style={styles.newBadge}>
                  <Text style={styles.newText}>NEW</Text>
                </View>
              )}
            </View>
            <Text style={[styles.formatDesc, { color: mutedColor }]}>{format.description}</Text>
          </View>

          <View
            style={[
              styles.radioOuter,
              {
                borderColor: selected === format.id ? format.color : borderColor,
              },
            ]}
          >
            {selected === format.id && (
              <View style={[styles.radioInner, { backgroundColor: format.color }]} />
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  formatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  formatInfo: {
    flex: 1,
  },
  formatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  formatName: {
    fontSize: 15,
    fontWeight: '600',
  },
  newBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newText: {
    color: "#12305c",
    fontSize: 9,
    fontWeight: '700',
  },
  formatDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
