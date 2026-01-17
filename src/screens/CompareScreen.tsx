import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { compareProducts } from '../services/analysisService';
import { ProductCard } from '../components/ProductCard';
import { ScoreCircle } from '../components/ScoreCircle';
import { Button } from '../components/Button';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadows, getRatingColor } from '../constants/theme';

interface CompareScreenProps {
  onNavigate: (screen: string, params?: any) => void;
  onBack: () => void;
}

export const CompareScreen: React.FC<CompareScreenProps> = ({ onNavigate, onBack }) => {
  const { profile, comparisonList, removeFromComparison, clearComparison, scannedProducts } = useUser();

  const comparison = comparisonList.length >= 2 
    ? compareProducts(comparisonList, profile)
    : null;

  const handleClearAll = () => {
    Alert.alert(
      'Clear Comparison',
      'Remove all products from comparison?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clearComparison },
      ]
    );
  };

  const rankedProducts = comparison 
    ? comparison.rankedOrder.map(id => comparisonList.find(p => p.id === id)!)
    : comparisonList;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Compare Products</Text>
        {comparisonList.length > 0 && (
          <TouchableOpacity onPress={handleClearAll} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Status */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            {comparisonList.length}/5 products selected
          </Text>
          {comparisonList.length < 2 && (
            <Text style={styles.statusHint}>
              Add at least 2 products to compare
            </Text>
          )}
        </View>

        {/* Comparison Results */}
        {comparison && (
          <>
            {/* Winner Card */}
            <View style={styles.winnerCard}>
              <View style={styles.winnerBadge}>
                <Ionicons name="trophy" size={20} color={colors.white} />
                <Text style={styles.winnerBadgeText}>Best Choice</Text>
              </View>
              <Text style={styles.winnerName}>{rankedProducts[0].name}</Text>
              <Text style={styles.winnerBrand}>{rankedProducts[0].brand}</Text>
              <ScoreCircle
                score={rankedProducts[0].overallScore}
                letterGrade={rankedProducts[0].letterGrade}
                size="md"
              />
            </View>

            {/* Summary */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Summary</Text>
              <Text style={styles.summaryText}>{comparison.summary}</Text>
            </View>

            {/* Ranking */}
            <View style={styles.rankingSection}>
              <Text style={styles.sectionTitle}>Ranking</Text>
              {rankedProducts.map((product, index) => (
                <View key={product.id} style={styles.rankItem}>
                  <View style={[styles.rankBadge, index === 0 && styles.rankBadgeFirst]}>
                    <Text style={[styles.rankNumber, index === 0 && styles.rankNumberFirst]}>
                      #{index + 1}
                    </Text>
                  </View>
                  <View style={styles.rankInfo}>
                    <Text style={styles.rankName}>{product.name}</Text>
                    <Text style={styles.rankBrand}>{product.brand}</Text>
                  </View>
                  <View style={styles.rankScore}>
                    <Text style={[styles.rankGrade, { color: colors[`grade${product.letterGrade}` as keyof typeof colors] || colors.text }]}>
                      {product.letterGrade}
                    </Text>
                    <Text style={styles.rankScoreValue}>{product.overallScore}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Differing Ingredients */}
            {comparison.differingIngredients.length > 0 && (
              <View style={styles.differencesSection}>
                <Text style={styles.sectionTitle}>Key Differences</Text>
                <Text style={styles.sectionSubtitle}>
                  Ingredients that vary between products
                </Text>
                {comparison.differingIngredients.slice(0, 10).map((diff, index) => (
                  <View key={index} style={styles.diffItem}>
                    <View style={[styles.diffIndicator, { backgroundColor: getRatingColor(diff.rating) }]} />
                    <View style={styles.diffContent}>
                      <Text style={styles.diffIngredient}>{diff.ingredient}</Text>
                      <Text style={styles.diffPresent}>
                        Found in: {diff.presentIn.join(', ')}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* Selected Products */}
        <View style={styles.productsSection}>
          <Text style={styles.sectionTitle}>Selected Products</Text>
          {comparisonList.length > 0 ? (
            comparisonList.map((product) => (
              <View key={product.id} style={styles.productWrapper}>
                <ProductCard
                  product={product}
                  onPress={() => onNavigate('ProductDetail', { productId: product.id })}
                  compact
                />
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeFromComparison(product.id)}
                >
                  <Ionicons name="close-circle" size={24} color={colors.danger} />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={styles.emptyProducts}>
              <Text style={styles.emptyProductsText}>
                No products selected for comparison
              </Text>
            </View>
          )}
        </View>

        {/* Add More Products */}
        {comparisonList.length < 5 && (
          <View style={styles.addSection}>
            <Text style={styles.addTitle}>Add Products</Text>
            <Text style={styles.addSubtitle}>
              Select from your scan history
            </Text>
            {scannedProducts
              .filter(p => !comparisonList.find(c => c.id === p.id))
              .slice(0, 5)
              .map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onPress={() => onNavigate('ProductDetail', { productId: product.id })}
                  onComparePress={() => {
                    if (comparisonList.length < 5) {
                      // Add to comparison - need to use the context function
                    }
                  }}
                  isInComparison={false}
                  compact
                />
              ))}
            {scannedProducts.filter(p => !comparisonList.find(c => c.id === p.id)).length === 0 && (
              <View style={styles.noMoreProducts}>
                <Text style={styles.noMoreProductsText}>
                  Scan more products to compare
                </Text>
                <Button
                  title="Scan Product"
                  onPress={() => onNavigate('Scan')}
                  variant="outline"
                  size="sm"
                />
              </View>
            )}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  clearButton: {
    padding: spacing.xs,
  },
  clearButtonText: {
    fontSize: fontSize.sm,
    color: colors.danger,
    fontWeight: fontWeight.medium,
  },
  statusContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  statusText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  statusHint: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  winnerCard: {
    backgroundColor: colors.primary,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.lg,
  },
  winnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  winnerBadgeText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginLeft: spacing.xs,
  },
  winnerName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
    textAlign: 'center',
  },
  winnerBrand: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: spacing.md,
  },
  summaryCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  summaryTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  summaryText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  rankingSection: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  sectionSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  rankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  rankBadgeFirst: {
    backgroundColor: colors.primary,
  },
  rankNumber: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textSecondary,
  },
  rankNumberFirst: {
    color: colors.white,
  },
  rankInfo: {
    flex: 1,
  },
  rankName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  rankBrand: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  rankScore: {
    alignItems: 'center',
  },
  rankGrade: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  rankScoreValue: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  differencesSection: {
    padding: spacing.md,
  },
  diffItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  diffIndicator: {
    width: 4,
    height: '100%',
    minHeight: 40,
    borderRadius: 2,
    marginRight: spacing.md,
  },
  diffContent: {
    flex: 1,
  },
  diffIngredient: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  diffPresent: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  productsSection: {
    padding: spacing.md,
  },
  productWrapper: {
    position: 'relative',
  },
  removeButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  emptyProducts: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyProductsText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  addSection: {
    padding: spacing.md,
  },
  addTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  addSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  noMoreProducts: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  noMoreProductsText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
});
