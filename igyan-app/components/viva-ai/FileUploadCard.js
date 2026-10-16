/**
 * Viva AI - File Upload Card Component
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { IconSymbol } from '../IconSymbol';

export default function FileUploadCard({ onUpload }) {
  return (
    <TouchableOpacity style={styles.container} onPress={onUpload} activeOpacity={0.7}>
      <View style={styles.iconContainer}>
        <IconSymbol name="doc.badge.plus" size={32} color="#4f46e5" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>Upload Business Document</Text>
        <Text style={styles.subtitle}>PDF, PPT, DOC, or TXT</Text>
      </View>
      <IconSymbol name="chevron.right" size={20} color="#7a8b9c" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e6382',
    borderStyle: 'dashed',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 171, 244, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: "#12305c",
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitle: {
    color: '#7a8b9c',
    fontSize: 12,
  },
});
