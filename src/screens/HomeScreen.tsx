import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { ProductCard } from '../components/ProductCard';
import { Button } from '../components/Button';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '../constants/theme';

interface HomeScreenProps {
  onNavigate: (screen: string, params?: any) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  const { profile, scannedProducts, comparisonList, addToComparison, removeFromComparison } = useUser();

  const recentProducts = scannedProducts.slice(0, 5);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello there! 👋</Text>
            <Text style={styles.title}>ConsciousScan</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => onNavigate('Profile')}
          >
            <Ionicons name="person-circle-outline" size={40} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => onNavigate('Scan')}
            activeOpacity={0.8}
          >
            <View style={styles.scanButtonContent}>
              <Ionicons name="scan" size={32} color={colors.white} />
              <Text style={styles.scanButtonText}>Scan Product</Text>
              <Text style={styles.scanButtonSubtext}>
                Take a photo or scan barcode
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => onNavigate('History')}
            >
              <Ionicons name="time-outline" size={24} color={colors.primary} />
              <Text style={styles.actionCardText}>History</Text>
              <Text style={styles.actionCardCount}>{scannedProducts.length}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => onNavigate('Compare')}
            >
              <Ionicons name="git-compare-outline" size={24} color={colors.secondary} />
              <Text style={styles.actionCardText}>Compare</Text>
              <Text style={styles.actionCardCount}>{comparisonList.length}/5</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Summary */}
        {profile.onboardingComplete && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Profile</Text>
            <View style={styles.profileSummary}>
              {profile.allergies.length > 0 && (
                <View style={styles.profileItem}>
                  <Ionicons name="alert-circle" size={16} color={colors.danger} />
                  <Text style={styles.profileItemText}>
                    {profile.allergies.length} allergies tracked
                  </Text>
                </View>
              )}
              {profile.sensitivities.length > 0 && (
                <View style={styles.profileItem}>
                  <Ionicons name="heart" size={16} color={colors.warning} />
                  <Text style={styles.profileItemText}>
                    {profile.sensitivities.length} sensitivities
                  </Text>
                </View>
              )}
              {profile.dietaryPreferences.length > 0 && (
                <View style={styles.profileItem}>
                  <Ionicons name="leaf" size={16} color={colors.safe} />
                  <Text style={styles.profileItemText}>
                    {profile.dietaryPreferences.join(', ')}
                  </Text>
                </View>
              )}
              {profile.priorities.length > 0 && (
                <View style={styles.profileItem}>
                  <Ionicons name="flag" size={16} color={colors.primary} />
                  <Text style={styles.profileItemText}>
                    {profile.priorities.length} priorities set
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Recent Scans */}
        {recentProducts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Scans</Text>
              <TouchableOpacity onPress={() => onNavigate('History')}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>

            {recentProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onPress={() => onNavigate('ProductDetail', { productId: product.id })}
                onComparePress={() => {
                  if (comparisonList.find((p) => p.id === product.id)) {
                    removeFromComparison(product.id);
                  } else {
                    addToComparison(product);
                  }
                }}
                isInComparison={comparisonList.some((p) => p.id === product.id)}
              />
            ))}
          </View>
        )}

        {/* Empty State */}
        {scannedProducts.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="scan-outline" size={64} color={colors.textMuted} />
            <Text style={styles.emptyStateTitle}>No products scanned yet</Text>
            <Text style={styles.emptyStateText}>
              Start by scanning a product to see personalized ingredient analysis
            </Text>
            <Button
              title="Scan Your First Product"
              onPress={() => onNavigate('Scan')}
              icon={<Ionicons name="camera" size={20} color={colors.white} />}
            />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  greeting: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  profileButton: {
    padding: spacing.xs,
  },
  quickActions: {
    paddingHorizontal: spacing.lg,
  },
  scanButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.md,
    ...shadows.lg,
  },
  scanButtonContent: {
    alignItems: 'center',
  },
  scanButtonText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginTop: spacing.sm,
  },
  scanButtonSubtext: {
    fontSize: fontSize.sm,
    color: colors.white,
    opacity: 0.8,
    marginTop: spacing.xs,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  actionCardText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
    marginTop: spacing.xs,
  },
  actionCardCount: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  section: {
    padding: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  seeAll: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  profileSummary: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  profileItemText: {
    fontSize: fontSize.sm,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyStateTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginTop: spacing.md,
  },
  emptyStateText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
});
