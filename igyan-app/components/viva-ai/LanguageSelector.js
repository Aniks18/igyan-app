/**
 * Viva AI - Language Selector Component
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function LanguageSelector({ language, onLanguageChange, disabled }) {
  return (
    <View style={[styles.container, disabled && styles.disabled]}>
      <TouchableOpacity
        style={[
          styles.option,
          language === 'english' && styles.optionActive,
        ]}
        onPress={() => !disabled && onLanguageChange('english')}
        disabled={disabled}
      >
        <Text style={[
          styles.optionText,
          language === 'english' && styles.optionTextActive,
        ]}>
          🇬🇧 EN
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.option,
          language === 'hindi' && styles.optionActive,
        ]}
        onPress={() => !disabled && onLanguageChange('hindi')}
        disabled={disabled}
      >
        <Text style={[
          styles.optionText,
          language === 'hindi' && styles.optionTextActive,
        ]}>
          🇮🇳 हिं
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 3,
  },
  disabled: {
    opacity: 0.5,
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 17,
  },
  optionActive: {
    backgroundColor: "#4f46e5",
  },
  optionText: {
    color: '#7a8b9c',
    fontSize: 12,
    fontWeight: '500',
  },
  optionTextActive: {
    color: '#fff',
  },
});
