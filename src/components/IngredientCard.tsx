import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Ingredient } from '../types';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../constants/theme';
import { getRatingColor } from '../constants/theme';

interface IngredientCardProps {
  ingredient: Ingredient;
  onPress?: () => void;
  showDetails?: boolean;
}

export const IngredientCard: React.FC<IngredientCardProps> = ({
  ingredient,
  onPress,
  showDetails = false,
}) => {
  const ratingColor = getRatingColor(ingredient.healthRating);

  const getRatingIcon = () => {
    switch (ingredient.healthRating) {
      case 'safe':
        return 'checkmark-circle';
      case 'caution':
        return 'alert-circle';
      case 'warning':
        return 'warning';
      case 'danger':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={[styles.indicator, { backgroundColor: ratingColor }]} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>
            {ingredient.name}
          </Text>
          <Ionicons name={getRatingIcon()} size={20} color={ratingColor} />
        </View>
        
        <Text style={styles.category}>{ingredient.category}</Text>
        
        {showDetails && (
          <>
            <Text style={styles.description} numberOfLines={2}>
              {ingredient.description}
            </Text>
            
            <View style={styles.tags}>
              {ingredient.isNatural && (
                <View style={[styles.tag, styles.tagNatural]}>
                  <Text style={styles.tagText}>Natural</Text>
                </View>
              )}
              {ingredient.isVegan && (
                <View style={[styles.tag, styles.tagVegan]}>
                  <Text style={styles.tagText}>Vegan</Text>
                </View>
              )}
            </View>
          </>
        )}
      </View>
      
      {onPress && (
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  indicator: {
    width: 4,
    height: '100%',
    minHeight: 40,
    borderRadius: 2,
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  category: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  tags: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginRight: spacing.xs,
  },
  tagNatural: {
    backgroundColor: `${colors.safe}20`,
  },
  tagVegan: {
    backgroundColor: `${colors.primary}20`,
  },
  tagText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
});
