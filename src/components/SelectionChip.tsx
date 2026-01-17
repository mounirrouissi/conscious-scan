import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../constants/theme';

interface SelectionChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}

export const SelectionChip: React.FC<SelectionChipProps> = ({
  label,
  selected,
  onPress,
  disabled = false,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        selected && styles.chipSelected,
        disabled && styles.chipDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.label,
          selected && styles.labelSelected,
          disabled && styles.labelDisabled,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipDisabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  labelSelected: {
    color: colors.white,
  },
  labelDisabled: {
    color: colors.textMuted,
  },
});
