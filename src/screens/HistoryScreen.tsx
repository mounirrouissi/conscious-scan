import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { ProductCard } from '../components/ProductCard';
import { Button } from '../components/Button';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../constants/theme';

interface HistoryScreenProps {
  onNavigate: (screen: string, params?: any) => void;
  onBack: () => void;
}

type SortOption = 'recent' | 'score-high' | 'score-low' | 'name';

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ onNavigate, onBack }) => {
  const { scannedProducts, removeScannedProduct, comparisonList, addToComparison, removeFromComparison } = useUser();
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const sortedProducts = [...scannedProducts].sort((a, b) => {
    switch (sortBy) {
      case 'score-high':
        return b.overallScore - a.overallScore;
      case 'score-low':
        return a.overallScore - b.overallScore;
      case 'name':
        return a.name.localeCompare(b.name);
      case 'recent':
      default:
        return new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime();
    }
  });

  const handleDelete = (productId: string, productName: string) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to remove "${productName}" from your history?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => removeScannedProduct(productId),
        },
      ]
    );
  };

  const getSortLabel = () => {
    switch (sortBy) {
      case 'score-high': return 'Highest Score';
      case 'score-low': return 'Lowest Score';
      case 'name': return 'Name A-Z';
      default: return 'Most Recent';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan History</Text>
        <TouchableOpacity onPress={() => setShowSortMenu(!showSortMenu)} style={styles.sortButton}>
          <Ionicons name="filter" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Sort Menu */}
      {showSortMenu && (
        <View style={styles.sortMenu}>
          <Text style={styles.sortMenuTitle}>Sort by</Text>
          {(['recent', 'score-high', 'score-low', 'name'] as SortOption[]).map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.sortOption, sortBy === option && styles.sortOptionActive]}
              onPress={() => {
                setSortBy(option);
                setShowSortMenu(false);
              }}
            >
              <Text style={[styles.sortOptionText, sortBy === option && styles.sortOptionTextActive]}>
                {option === 'recent' ? 'Most Recent' :
                 option === 'score-high' ? 'Highest Score' :
                 option === 'score-low' ? 'Lowest Score' : 'Name A-Z'}
              </Text>
              {sortBy === option && (
                <Ionicons name="checkmark" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{scannedProducts.length}</Text>
          <Text style={styles.statLabel}>Products</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {scannedProducts.filter(p => p.letterGrade === 'A' || p.letterGrade === 'B').length}
          </Text>
          <Text style={styles.statLabel}>Good Choices</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{comparisonList.length}</Text>
          <Text style={styles.statLabel}>Comparing</Text>
        </View>
      </View>

      {/* Sort indicator */}
      <View style={styles.sortIndicator}>
        <Text style={styles.sortIndicatorText}>Sorted by: {getSortLabel()}</Text>
      </View>

      {/* Product List */}
      {sortedProducts.length > 0 ? (
        <FlatList
          data={sortedProducts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.productWrapper}>
              <ProductCard
                product={item}
                onPress={() => onNavigate('ProductDetail', { productId: item.id })}
                onComparePress={() => {
                  if (comparisonList.find((p) => p.id === item.id)) {
                    removeFromComparison(item.id);
                  } else {
                    addToComparison(item);
                  }
                }}
                isInComparison={comparisonList.some((p) => p.id === item.id)}
              />
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(item.id, item.name)}
              >
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </TouchableOpacity>
            </View>
          )}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={64} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No Products Yet</Text>
          <Text style={styles.emptyText}>
            Start scanning products to build your history
          </Text>
          <Button
            title="Scan Product"
            onPress={() => onNavigate('Scan')}
            icon={<Ionicons name="scan" size={20} color={colors.white} />}
          />
        </View>
      )}
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
  sortButton: {
    padding: spacing.xs,
  },
  sortMenu: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sortMenuTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  sortOptionActive: {
    backgroundColor: colors.primary + '10',
    marginHorizontal: -spacing.md,
    paddingHorizontal: spacing.md,
  },
  sortOptionText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  sortOptionTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  sortIndicator: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  sortIndicatorText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  productWrapper: {
    position: 'relative',
  },
  deleteButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    padding: spacing.xs,
    backgroundColor: colors.danger + '15',
    borderRadius: borderRadius.full,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.lg,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
});
