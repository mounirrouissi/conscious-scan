export const colors = {
  primary: '#10B981',
  primaryDark: '#059669',
  primaryLight: '#34D399',
  
  secondary: '#6366F1',
  secondaryDark: '#4F46E5',
  
  background: '#F9FAFB',
  surface: '#FFFFFF',
  surfaceSecondary: '#F3F4F6',
  
  text: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  
  // Rating colors
  safe: '#10B981',
  caution: '#F59E0B',
  warning: '#F97316',
  danger: '#EF4444',
  
  // Grade colors
  gradeA: '#10B981',
  gradeB: '#34D399',
  gradeC: '#F59E0B',
  gradeD: '#F97316',
  gradeF: '#EF4444',
  
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
};

export const getGradeColor = (grade: string): string => {
  switch (grade) {
    case 'A': return colors.gradeA;
    case 'B': return colors.gradeB;
    case 'C': return colors.gradeC;
    case 'D': return colors.gradeD;
    case 'F': return colors.gradeF;
    default: return colors.textMuted;
  }
};

export const getRatingColor = (rating: string): string => {
  switch (rating) {
    case 'safe': return colors.safe;
    case 'caution': return colors.caution;
    case 'warning': return colors.warning;
    case 'danger': return colors.danger;
    default: return colors.textMuted;
  }
};
