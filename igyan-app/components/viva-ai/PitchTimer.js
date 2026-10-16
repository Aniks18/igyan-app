/**
 * Viva AI - Pitch Timer Component
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IconSymbol } from '../IconSymbol';

export default function PitchTimer({ timeLeft, totalTime }) {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (timeLeft / totalTime) * 100;
  const isLow = timeLeft <= 60;
  const isCritical = timeLeft <= 30;

  return (
    <View style={[
      styles.container,
      isLow && styles.containerLow,
      isCritical && styles.containerCritical,
    ]}>
      <IconSymbol
        name="timer"
        size={16}
        color={isCritical ? '#ef4444' : isLow ? '#f59e0b' : "#4f46e5"}
      />
      <Text style={[
        styles.time,
        isLow && styles.timeLow,
        isCritical && styles.timeCritical,
      ]}>
        {formatTime(timeLeft)}
      </Text>
      
      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${progress}%` },
            isLow && styles.progressLow,
            isCritical && styles.progressCritical,
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 171, 244, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  containerLow: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  containerCritical: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  time: {
    color: "#4f46e5",
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  timeLow: {
    color: '#f59e0b',
  },
  timeCritical: {
    color: '#ef4444',
  },
  progressBar: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: "#4f46e5",
    borderRadius: 2,
  },
  progressLow: {
    backgroundColor: '#f59e0b',
  },
  progressCritical: {
    backgroundColor: '#ef4444',
  },
});
