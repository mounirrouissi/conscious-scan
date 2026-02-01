import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Share,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { useUser } from '../context/UserContext';
import { Ingredient } from '../types';
import { ScoreCircle } from '../components/ScoreCircle';
import { IngredientCard } from '../components/IngredientCard';
import { Button } from '../components/Button';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadows, getRatingColor } from '../constants/theme';

interface ProductDetailScreenProps {
  productId: string;
  onBack: () => void;
}

export const ProductDetailScreen: React.FC<ProductDetailScreenProps> = ({
  productId,
  onBack,
}) => {
  const { scannedProducts, comparisonList, addToComparison, removeFromComparison } = useUser();
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);

  const product = scannedProducts.find((p) => p.id === productId);
  const isInComparison = product ? comparisonList.some((p) => p.id === product.id) : false;
  const { profile } = useUser();

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.textMuted} />
          <Text style={styles.errorTitle}>Product Not Found</Text>
          <Text style={styles.errorText}>This product may have been removed.</Text>
          <Button title="Go Back" onPress={onBack} />
        </View>
      </SafeAreaView>
    );
  }

  const safeIngredients = (product.ingredients || []).filter((i) => i.healthRating === 'safe');
  const cautionIngredients = (product.ingredients || []).filter((i) => i.healthRating === 'caution');
  const concernIngredients = (product.ingredients || []).filter((i) =>
    i.healthRating === 'warning' || i.healthRating === 'danger'
  );

  // Detect Allergies
  const matchedAllergies = (product.ingredients || []).filter(ingredient => {
    const ingredientName = ingredient.name.toLowerCase();
    return profile.allergies.some(allergy =>
      ingredientName.includes(allergy.name.toLowerCase()) ||
      (ingredient.contains && ingredient.contains.some((c: string) => c.toLowerCase().includes(allergy.name.toLowerCase())))
    );
  });

  const handleCompareToggle = () => {
    if (isInComparison) {
      removeFromComparison(product.id);
    } else if (comparisonList.length >= 5) {
      Alert.alert('Limit Reached', 'You can compare up to 5 products at a time.');
    } else {
      addToComparison(product);
    }
  };

  const handleShare = async () => {
    try {
      const warnings = product.personalizedWarnings || [];
      const message = `Check out ${product.name} by ${product.brand}!\n\nScore: ${product.overallScore}/100 (${product.letterGrade})\n\n${warnings.length > 0 ? 'Warnings:\n' + warnings.join('\n') : 'No warnings!'}\n\nAnalyzed with PurePick`;

      await Share.share({
        message,
        title: `${product.name} Analysis`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleExportPDF = async () => {
    try {
      const warnings = product.personalizedWarnings || [];
      const advice = product.personalizedAdvice || [];
      const ingredients = product.ingredients || [];

      const html = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #10B981; }
              .score { font-size: 48px; font-weight: bold; color: #10B981; }
              .warning { background: #FEF3C7; padding: 10px; border-radius: 8px; margin: 10px 0; }
              .ingredient { padding: 8px 0; border-bottom: 1px solid #E5E7EB; }
              .safe { color: #10B981; }
              .caution { color: #F59E0B; }
              .warning-text { color: #F97316; }
              .danger { color: #EF4444; }
            </style>
          </head>
          <body>
            <h1>${product.name}</h1>
            <p><strong>Brand:</strong> ${product.brand}</p>
            <p><strong>Category:</strong> ${product.category}</p>
            <p class="score">${product.letterGrade} - ${product.overallScore}/100</p>
            
            ${warnings.length > 0 ? `
              <h2>⚠️ Warnings</h2>
              ${warnings.map(w => `<div class="warning">${w}</div>`).join('')}
            ` : ''}
            
            ${advice.length > 0 ? `
              <h2>✓ Advice</h2>
              ${advice.map(a => `<p>${a}</p>`).join('')}
            ` : ''}
            
            <h2>Ingredients (${ingredients.length})</h2>
            ${ingredients.map(i => `
              <div class="ingredient">
                <strong class="${i.healthRating}">${i.name}</strong>
                <span> - ${i.category}</span>
              </div>
            `).join('')}
            
            <p style="margin-top: 40px; color: #9CA3AF; font-size: 12px;">
              Generated by PurePick on ${new Date().toLocaleDateString()}
            </p>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Success', 'PDF saved to: ' + uri);
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      Alert.alert('Error', 'Failed to export PDF');
    }
  };

  const handleExportJSON = async () => {
    try {
      const jsonData = JSON.stringify(product, null, 2);
      const fileName = `${product.name.replace(/\s+/g, '_')}_analysis.json`;
      const file = new FileSystem.File(FileSystem.Paths.cache, fileName);

      await file.write(jsonData);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri);
      } else {
        Alert.alert('Success', 'JSON saved to: ' + file.uri);
      }
    } catch (error) {
      console.error('Error exporting JSON:', error);
      Alert.alert('Error', 'Failed to export JSON');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
            <Ionicons name="share-outline" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => Alert.alert(
              'Export',
              'Choose export format',
              [
                { text: 'PDF', onPress: handleExportPDF },
                { text: 'JSON', onPress: handleExportJSON },
                { text: 'Cancel', style: 'cancel' },
              ]
            )}
            style={styles.headerButton}
          >
            <Ionicons name="download-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Product Hero */}
        <View style={styles.heroCard}>
          <View style={styles.heroContent}>
            {product.imageUri ? (
              <Image source={{ uri: product.imageUri }} style={styles.productImage} />
            ) : (
              <View style={[styles.productImage, styles.placeholderImage]}>
                <Ionicons name="cube-outline" size={40} color={colors.textMuted} />
              </View>
            )}
            <View style={styles.productInfo}>
              <Text style={styles.brand}>{product.brand}</Text>
              <Text style={styles.name}>{product.name}</Text>
              <Text style={styles.category}>{product.category}</Text>
              {product.barcode && (
                <Text style={styles.barcode}>Barcode: {product.barcode}</Text>
              )}
            </View>
          </View>

          <View style={styles.scoreContainer}>
            <ScoreCircle
              score={product.overallScore}
              letterGrade={product.letterGrade}
              size="lg"
            />
          </View>

          <Button
            title={isInComparison ? 'Added to Compare' : 'Add to Compare'}
            onPress={handleCompareToggle}
            variant={isInComparison ? 'primary' : 'outline'}
            icon={<Ionicons name={isInComparison ? 'checkmark' : 'add'} size={20} color={isInComparison ? colors.white : colors.primary} />}
            style={{ marginTop: spacing.lg }}
          />
        </View>

        {/* CRITICAL: Allergy Alert Banner */}
        {matchedAllergies.length > 0 && (
          <View style={styles.allergyBanner}>
            <View style={styles.allergyHeader}>
              <Ionicons name="alert-circle" size={24} color={colors.white} />
              <Text style={styles.allergyTitle}>ALLERGY WARNING</Text>
            </View>
            <Text style={styles.allergyText}>
              This product contains ingredients you are allergic to:
            </Text>
            <View style={styles.allergyList}>
              {matchedAllergies.map((item, index) => (
                <View key={index} style={styles.allergyChip}>
                  <Text style={styles.allergyChipText}>{item.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Warnings */}
        {(product.personalizedWarnings || []).length > 0 && (
          <View style={styles.warningsCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="warning" size={20} color={colors.warning} />
              <Text style={[styles.cardTitle, { color: colors.warning }]}>
                Personalized Warnings
              </Text>
            </View>
            {(product.personalizedWarnings || []).map((warning, index) => (
              <View key={index} style={styles.warningItem}>
                <Text style={styles.warningText}>• {warning}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Advice */}
        {(product.personalizedAdvice || []).length > 0 && (
          <View style={styles.adviceCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="checkmark-circle" size={20} color={colors.safe} />
              <Text style={[styles.cardTitle, { color: colors.safe }]}>Advice</Text>
            </View>
            {(product.personalizedAdvice || []).map((advice, index) => (
              <View key={index} style={styles.adviceItem}>
                <Text style={styles.adviceText}>• {advice}</Text>
              </View>
            ))}
          </View>
        )}

        {/* AI Disclaimer */}
        <View style={styles.disclaimerCard}>
          <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
          <Text style={styles.disclaimerText}>
            This information is educational and not medical or professional advice. Analysis powered by AI.
          </Text>
        </View>

        {/* Ingredients */}
        <View style={styles.ingredientsSection}>
          <Text style={styles.sectionTitle}>
            Ingredients ({(product.ingredients || []).length})
          </Text>
          <Text style={styles.sectionSubtitle}>Tap any ingredient for details</Text>

          {concernIngredients.length > 0 && (
            <View style={[styles.ingredientGroup, styles.groupDanger]}>
              <View style={styles.groupHeader}>
                <Ionicons name="warning-outline" size={20} color={colors.danger} />
                <Text style={[styles.groupTitle, { color: colors.danger }]}>
                  Ingredients of Concern ({concernIngredients.length})
                </Text>
              </View>
              {concernIngredients.map((ingredient, index) => (
                <IngredientCard
                  key={index}
                  ingredient={ingredient}
                  onPress={() => setSelectedIngredient(ingredient)}
                />
              ))}
            </View>
          )}

          {cautionIngredients.length > 0 && (
            <View style={[styles.ingredientGroup, styles.groupCaution]}>
              <View style={styles.groupHeader}>
                <Ionicons name="alert-circle-outline" size={20} color={colors.warning} />
                <Text style={[styles.groupTitle, { color: colors.warning }]}>
                  Use with Caution ({cautionIngredients.length})
                </Text>
              </View>
              {cautionIngredients.map((ingredient, index) => (
                <IngredientCard
                  key={index}
                  ingredient={ingredient}
                  onPress={() => setSelectedIngredient(ingredient)}
                />
              ))}
            </View>
          )}

          {safeIngredients.length > 0 && (
            <View style={[styles.ingredientGroup, styles.groupSafe]}>
              <View style={styles.groupHeader}>
                <Ionicons name="checkmark-circle-outline" size={20} color={colors.safe} />
                <Text style={[styles.groupTitle, { color: colors.safe }]}>
                  Safe Ingredients ({safeIngredients.length})
                </Text>
              </View>
              {safeIngredients.map((ingredient, index) => (
                <IngredientCard
                  key={index}
                  ingredient={ingredient}
                  onPress={() => setSelectedIngredient(ingredient)}
                />
              ))}
            </View>
          )}
        </View>

        <View style={styles.bottomDisclaimer}>
          <Text style={styles.bottomDisclaimerText}>
            AI-generated insights. Consult a doctor for medical advice.
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Ingredient Detail Modal */}
      <Modal
        visible={!!selectedIngredient}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedIngredient(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedIngredient && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedIngredient.name}</Text>
                  <TouchableOpacity onPress={() => setSelectedIngredient(null)}>
                    <Ionicons name="close" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  <Text style={styles.modalDescription}>
                    {selectedIngredient.description}
                  </Text>

                  <View style={styles.tagRow}>
                    <View style={[styles.tag, { backgroundColor: getRatingColor(selectedIngredient.healthRating) + '20' }]}>
                      <Text style={[styles.tagText, { color: getRatingColor(selectedIngredient.healthRating) }]}>
                        {selectedIngredient.healthRating.toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>{selectedIngredient.category}</Text>
                    </View>
                    {selectedIngredient.isNatural && (
                      <View style={[styles.tag, { backgroundColor: colors.safe + '20' }]}>
                        <Text style={[styles.tagText, { color: colors.safe }]}>Natural</Text>
                      </View>
                    )}
                    {selectedIngredient.isVegan && (
                      <View style={[styles.tag, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[styles.tagText, { color: colors.primary }]}>Vegan</Text>
                      </View>
                    )}
                  </View>

                  {(selectedIngredient.concerns || []).length > 0 && (
                    <View style={styles.modalSection}>
                      <Text style={[styles.modalSectionTitle, { color: colors.warning }]}>
                        Concerns
                      </Text>
                      {(selectedIngredient.concerns || []).map((concern, index) => (
                        <Text key={index} style={styles.modalListItem}>• {concern}</Text>
                      ))}
                    </View>
                  )}

                  {(selectedIngredient.benefits || []).length > 0 && (
                    <View style={styles.modalSection}>
                      <Text style={[styles.modalSectionTitle, { color: colors.safe }]}>
                        Benefits
                      </Text>
                      {(selectedIngredient.benefits || []).map((benefit, index) => (
                        <Text key={index} style={styles.modalListItem}>• {benefit}</Text>
                      ))}
                    </View>
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    paddingTop: spacing.lg, // Lower the header icons
  },
  headerButton: {
    padding: spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.lg,
  },
  errorText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  heroCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.md,
  },
  heroContent: {
    flexDirection: 'row',
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.lg,
  },
  placeholderImage: {
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  brand: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  name: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: 2,
  },
  category: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  barcode: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  scoreContainer: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  warningsCard: {
    backgroundColor: colors.warning + '15',
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.warning + '30',
  },
  editActions: {
    flexDirection: 'row',
    marginTop: 'auto',
    paddingTop: spacing.lg,
  },
  allergyBanner: {
    backgroundColor: colors.danger,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.md,
  },
  allergyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  allergyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginLeft: spacing.sm,
  },
  allergyText: {
    fontSize: fontSize.md,
    color: colors.white,
    marginBottom: spacing.sm,
    opacity: 0.9,
  },
  allergyList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  allergyChip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  allergyChipText: {
    color: colors.white,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginLeft: spacing.sm,
  },
  warningItem: {
    paddingVertical: spacing.xs,
  },
  warningText: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  adviceCard: {
    backgroundColor: colors.safe + '15',
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.safe + '30',
  },
  adviceItem: {
    paddingVertical: spacing.xs,
  },
  adviceText: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceSecondary,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  disclaimerText: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    lineHeight: 16,
  },
  ingredientsSection: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  ingredientGroup: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  groupDanger: {
    backgroundColor: colors.danger + '10',
    borderWidth: 1,
    borderColor: colors.danger + '20',
  },
  groupCaution: {
    backgroundColor: colors.warning + '10',
    borderWidth: 1,
    borderColor: colors.warning + '20',
  },
  groupSafe: {
    backgroundColor: colors.safe + '10',
    borderWidth: 1,
    borderColor: colors.safe + '20',
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  groupTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    marginLeft: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    flex: 1,
  },
  modalDescription: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceSecondary,
  },
  tagText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  modalSection: {
    marginBottom: spacing.lg,
  },
  modalSectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  modalListItem: {
    fontSize: fontSize.sm,
    color: colors.text,
    paddingVertical: spacing.xs,
  },
  bottomDisclaimer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
    alignItems: 'center',
  },
  bottomDisclaimerText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
