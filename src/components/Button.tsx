import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
}) => {
  const getContainerStyle = (): ViewStyle[] => {
    const base: ViewStyle[] = [styles.container, styles[`container_${size}`]];

    switch (variant) {
      case 'primary':
        base.push(styles.containerPrimary);
        break;
      case 'secondary':
        base.push(styles.containerSecondary);
        break;
      case 'outline':
        base.push(styles.containerOutline);
        break;
      case 'ghost':
        base.push(styles.containerGhost);
        break;
    }

    if (disabled) {
      base.push(styles.containerDisabled);
    }

    return base;
  };

  const getTextStyle = (): TextStyle[] => {
    const base: TextStyle[] = [styles.text, styles[`text_${size}`]];

    switch (variant) {
      case 'primary':
        base.push(styles.textPrimary);
        break;
      case 'secondary':
        base.push(styles.textSecondary);
        break;
      case 'outline':
        base.push(styles.textOutline);
        break;
      case 'ghost':
        base.push(styles.textGhost);
        break;
    }

    if (disabled) {
      base.push(styles.textDisabled);
    }

    return base;
  };

  return (
    <TouchableOpacity
      style={[...getContainerStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.white : colors.primary}
          size="small"
        />
      ) : (
        <>
          {icon}
          <Text style={[...getTextStyle(), textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  container_sm: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  container_md: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  container_lg: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  containerPrimary: {
    backgroundColor: colors.primary,
    ...shadows.md,
  },
  containerSecondary: {
    backgroundColor: colors.surfaceSecondary,
  },
  containerOutline: {
    backgroundColor: colors.transparent,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  containerGhost: {
    backgroundColor: colors.transparent,
  },
  containerDisabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: fontWeight.semibold,
  },
  text_sm: {
    fontSize: fontSize.sm,
  },
  text_md: {
    fontSize: fontSize.md,
  },
  text_lg: {
    fontSize: fontSize.lg,
  },
  textPrimary: {
    color: colors.white,
  },
  textSecondary: {
    color: colors.text,
  },
  textOutline: {
    color: colors.primary,
  },
  textGhost: {
    color: colors.primary,
  },
  textDisabled: {
    color: colors.textMuted,
  },
});
