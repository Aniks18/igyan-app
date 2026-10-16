/**
 * Viva AI - Score Card Component
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ScoreCard({ overall, scores, criteria }) {
  const getScoreColor = (score, max) => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return '#22c55e';
    if (percentage >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getOverallColor = () => {
    if (overall >= 80) return '#22c55e';
    if (overall >= 60) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <View style={styles.container}>
      {/* Overall Score */}
      <View style={styles.overallSection}>
        <Text style={styles.overallLabel}>Overall Score</Text>
        <View style={[styles.overallScore, { borderColor: getOverallColor() }]}>
          <Text style={[styles.overallValue, { color: getOverallColor() }]}>
            {overall}
          </Text>
          <Text style={styles.overallMax}>/100</Text>
        </View>
      </View>

      {/* Category Scores */}
      <View style={styles.categoriesSection}>
        {criteria.map((criterion) => {
          const score = scores[criterion.id] || 0;
          const color = getScoreColor(score, criterion.maxScore);
          const percentage = (score / criterion.maxScore) * 100;

          return (
            <View key={criterion.id} style={styles.categoryItem}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryName} numberOfLines={1}>
                  {criterion.name}
                </Text>
                <Text style={[styles.categoryScore, { color }]}>
                  {score}/{criterion.maxScore}
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${percentage}%`, backgroundColor: color },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    padding: 16,
  },
  overallSection: {
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e6382',
  },
  overallLabel: {
    color: '#7a8b9c',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  overallScore: {
    flexDirection: 'row',
    alignItems: 'baseline',
    borderWidth: 3,
    borderRadius: 50,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  overallValue: {
    fontSize: 36,
    fontWeight: '800',
  },
  overallMax: {
    color: '#7a8b9c',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 2,
  },
  categoriesSection: {
    gap: 12,
  },
  categoryItem: {
    gap: 6,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryName: {
    color: "#12305c",
    fontSize: 13,
    flex: 1,
    marginRight: 8,
  },
  categoryScore: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
});
