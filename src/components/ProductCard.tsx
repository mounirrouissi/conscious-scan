import React from 'react';
import { TouchableOpacity, View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../types';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../constants/theme';
import { getGradeColor } from '../constants/theme';
import { ScoreCircle } from './ScoreCircle';

interface ProductCardProps {
  product: Product;
  onPress?: () => void;
  onComparePress?: () => void;
  isInComparison?: boolean;
  compact?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  onComparePress,
  isInComparison = false,
  compact = false,
}) => {
  const gradeColor = getGradeColor(product.letterGrade);

  if (compact) {
    return (
      <TouchableOpacity
        style={styles.compactContainer}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {product.imageUri ? (
          <Image source={{ uri: product.imageUri }} style={styles.compactImage} />
        ) : (
          <View style={[styles.compactImage, styles.placeholderImage]}>
            <Ionicons name="cube-outline" size={24} color={colors.textMuted} />
          </View>
        )}
        
        <View style={styles.compactContent}>
          <Text style={styles.compactBrand} numberOfLines={1}>
            {product.brand}
          </Text>
          <Text style={styles.compactName} numberOfLines={1}>
            {product.name}
          </Text>
        </View>
        
        <View style={[styles.gradeBadge, { backgroundColor: gradeColor }]}>
          <Text style={styles.gradeBadgeText}>{product.letterGrade}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        {product.imageUri ? (
          <Image source={{ uri: product.imageUri }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.placeholderImage]}>
            <Ionicons name="cube-outline" size={32} color={colors.textMuted} />
          </View>
        )}
        
        <View style={styles.info}>
          <Text style={styles.brand}>{product.brand}</Text>
          <Text style={styles.name} numberOfLines={2}>
            {product.name}
          </Text>
          <Text style={styles.category}>{product.category}</Text>
        </View>
        
        <ScoreCircle
          score={product.overallScore}
          letterGrade={product.letterGrade}
          size="sm"
        />
      </View>

      {product.personalizedWarnings.length > 0 && (
        <View style={styles.warningContainer}>
          <Ionicons name="warning" size={16} color={colors.warning} />
          <Text style={styles.warningText} numberOfLines={1}>
            {product.personalizedWarnings[0]}
          </Text>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.ingredientCount}>
          {product.ingredients.length} ingredients
        </Text>
        
        {onComparePress && (
          <TouchableOpacity
            style={[
              styles.compareButton,
              isInComparison && styles.compareButtonActive,
            ]}
            onPress={onComparePress}
          >
            <Ionicons
              name={isInComparison ? 'checkmark' : 'add'}
              size={16}
              color={isInComparison ? colors.white : colors.primary}
            />
            <Text
              style={[
                styles.compareButtonText,
                isInComparison && styles.compareButtonTextActive,
              ]}
            >
              {isInComparison ? 'Added' : 'Compare'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: borderRadius.md,
    marginRight: spacing.md,
  },
  placeholderImage: {
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginRight: spacing.sm,
  },
  brand: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginTop: 2,
  },
  category: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 4,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.warning}15`,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginTop: spacing.md,
  },
  warningText: {
    fontSize: fontSize.xs,
    color: colors.warning,
    marginLeft: spacing.xs,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  ingredientCount: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  compareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  compareButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  compareButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  compareButtonTextActive: {
    color: colors.white,
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  compactImage: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.sm,
    marginRight: spacing.sm,
  },
  compactContent: {
    flex: 1,
  },
  compactBrand: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  compactName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  gradeBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradeBadgeText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
});
