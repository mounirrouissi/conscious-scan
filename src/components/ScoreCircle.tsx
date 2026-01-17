import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontSize, fontWeight, shadows } from '../constants/theme';
import { getGradeColor } from '../constants/theme';

interface ScoreCircleProps {
  score: number;
  letterGrade: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ScoreCircle: React.FC<ScoreCircleProps> = ({
  score,
  letterGrade,
  size = 'md',
}) => {
  const gradeColor = getGradeColor(letterGrade);
  
  const dimensions = {
    sm: { container: 60, grade: 24, score: 12 },
    md: { container: 100, grade: 36, score: 14 },
    lg: { container: 140, grade: 48, score: 16 },
  };

  const dim = dimensions[size];

  return (
    <View
      style={[
        styles.container,
        {
          width: dim.container,
          height: dim.container,
          borderRadius: dim.container / 2,
          borderColor: gradeColor,
        },
      ]}
    >
      <Text style={[styles.grade, { fontSize: dim.grade, color: gradeColor }]}>
        {letterGrade}
      </Text>
      <Text style={[styles.score, { fontSize: dim.score }]}>{score}/100</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
    ...shadows.md,
  },
  grade: {
    fontWeight: fontWeight.bold,
  },
  score: {
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
});
