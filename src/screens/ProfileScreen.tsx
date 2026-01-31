import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { SelectionChip } from '../components/SelectionChip';
import { Button } from '../components/Button';
import {
  allergyOptions,
  sensitivityOptions,
  dietaryOptions,
  priorityOptions,
} from '../data/ingredientDatabase';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '../constants/theme';

interface ProfileScreenProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

type EditSection = 'allergies' | 'sensitivities' | 'dietary' | 'priorities' | 'avoid' | 'seek' | null;

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onBack, onNavigate }) => {
  const { profile, updateProfile, scannedProducts } = useUser();
  const [editSection, setEditSection] = useState<EditSection>(null);
  const [tempSelections, setTempSelections] = useState<string[]>([]);
  const [newItem, setNewItem] = useState('');

  const startEditing = (section: EditSection) => {
    if (!section) return;
    
    switch (section) {
      case 'allergies':
        setTempSelections(profile.allergies.map(a => a.name));
        break;
      case 'sensitivities':
        setTempSelections(profile.sensitivities);
        break;
      case 'dietary':
        setTempSelections(profile.dietaryPreferences);
        break;
      case 'priorities':
        setTempSelections(profile.priorities);
        break;
      case 'avoid':
        setTempSelections(profile.avoidList);
        break;
      case 'seek':
        setTempSelections(profile.seekList);
        break;
    }
    setEditSection(section);
  };

  const saveEditing = () => {
    if (!editSection) return;

    switch (editSection) {
      case 'allergies':
        updateProfile({
          allergies: tempSelections.map(name => ({ name, severity: 'moderate' })),
        });
        break;
      case 'sensitivities':
        updateProfile({ sensitivities: tempSelections });
        break;
      case 'dietary':
        updateProfile({ dietaryPreferences: tempSelections });
        break;
      case 'priorities':
        updateProfile({ priorities: tempSelections });
        break;
      case 'avoid':
        updateProfile({ avoidList: tempSelections });
        break;
      case 'seek':
        updateProfile({ seekList: tempSelections });
        break;
    }
    setEditSection(null);
    setTempSelections([]);
  };

  const toggleSelection = (item: string) => {
    setTempSelections(prev =>
      prev.includes(item)
        ? prev.filter(i => i !== item)
        : [...prev, item]
    );
  };

  const addCustomItem = () => {
    if (newItem.trim() && !tempSelections.includes(newItem.trim())) {
      setTempSelections(prev => [...prev, newItem.trim()]);
      setNewItem('');
    }
  };

  const getOptions = () => {
    switch (editSection) {
      case 'allergies': return allergyOptions;
      case 'sensitivities': return sensitivityOptions;
      case 'dietary': return dietaryOptions;
      case 'priorities': return priorityOptions;
      default: return [];
    }
  };

  const getSectionTitle = () => {
    switch (editSection) {
      case 'allergies': return 'Edit Allergies';
      case 'sensitivities': return 'Edit Sensitivities';
      case 'dietary': return 'Edit Dietary Preferences';
      case 'priorities': return 'Edit Priorities';
      case 'avoid': return 'Edit Avoid List';
      case 'seek': return 'Edit Seek List';
      default: return '';
    }
  };

  const handleResetProfile = () => {
    Alert.alert(
      'Reset Profile',
      'This will clear all your preferences. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            updateProfile({
              allergies: [],
              sensitivities: [],
              dietaryPreferences: [],
              priorities: [],
              avoidList: [],
              seekList: [],
            });
          },
        },
      ]
    );
  };

  // Stats
  const avgScore = scannedProducts.length > 0
    ? Math.round(scannedProducts.reduce((sum, p) => sum + p.overallScore, 0) / scannedProducts.length)
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      {editSection ? (
        // Edit Mode
        <View style={styles.editContainer}>
          <Text style={styles.editTitle}>{getSectionTitle()}</Text>
          
          {(editSection === 'avoid' || editSection === 'seek') ? (
            // Custom list editing
            <View>
              <View style={styles.addItemRow}>
                <TextInput
                  style={styles.addItemInput}
                  value={newItem}
                  onChangeText={setNewItem}
                  placeholder="Add ingredient..."
                  placeholderTextColor={colors.textMuted}
                  onSubmitEditing={addCustomItem}
                />
                <TouchableOpacity style={styles.addItemButton} onPress={addCustomItem}>
                  <Ionicons name="add" size={24} color={colors.white} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.chipContainer}>
                {tempSelections.map(item => (
                  <SelectionChip
                    key={item}
                    label={item}
                    selected={true}
                    onPress={() => toggleSelection(item)}
                  />
                ))}
              </View>
            </View>
          ) : (
            // Predefined options
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.chipContainer}>
                {getOptions().map(option => (
                  <SelectionChip
                    key={option}
                    label={option}
                    selected={tempSelections.includes(option)}
                    onPress={() => toggleSelection(option)}
                  />
                ))}
              </View>
            </ScrollView>
          )}

          <View style={styles.editActions}>
            <Button
              title="Cancel"
              onPress={() => setEditSection(null)}
              variant="outline"
              style={{ flex: 1, marginRight: spacing.sm }}
            />
            <Button
              title="Save"
              onPress={saveEditing}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      ) : (
        // View Mode
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Stats Card */}
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{scannedProducts.length}</Text>
              <Text style={styles.statLabel}>Products Scanned</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{avgScore}</Text>
              <Text style={styles.statLabel}>Avg Score</Text>
            </View>
          </View>

          {/* Allergies */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="alert-circle" size={20} color={colors.danger} />
                <Text style={styles.sectionTitle}>Allergies</Text>
              </View>
              <TouchableOpacity onPress={() => startEditing('allergies')}>
                <Ionicons name="pencil" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.chipContainer}>
              {profile.allergies.length > 0 ? (
                profile.allergies.map(allergy => (
                  <View key={allergy.name} style={styles.viewChip}>
                    <Text style={styles.viewChipText}>{allergy.name}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No allergies set</Text>
              )}
            </View>
          </View>

          {/* Sensitivities */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="heart" size={20} color={colors.warning} />
                <Text style={styles.sectionTitle}>Sensitivities</Text>
              </View>
              <TouchableOpacity onPress={() => startEditing('sensitivities')}>
                <Ionicons name="pencil" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.chipContainer}>
              {profile.sensitivities.length > 0 ? (
                profile.sensitivities.map(item => (
                  <View key={item} style={styles.viewChip}>
                    <Text style={styles.viewChipText}>{item}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No sensitivities set</Text>
              )}
            </View>
          </View>

          {/* Dietary Preferences */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="leaf" size={20} color={colors.safe} />
                <Text style={styles.sectionTitle}>Dietary Preferences</Text>
              </View>
              <TouchableOpacity onPress={() => startEditing('dietary')}>
                <Ionicons name="pencil" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.chipContainer}>
              {profile.dietaryPreferences.length > 0 ? (
                profile.dietaryPreferences.map(item => (
                  <View key={item} style={[styles.viewChip, styles.viewChipGreen]}>
                    <Text style={[styles.viewChipText, styles.viewChipTextGreen]}>{item}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No dietary preferences set</Text>
              )}
            </View>
          </View>

          {/* Priorities */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="flag" size={20} color={colors.primary} />
                <Text style={styles.sectionTitle}>Priorities</Text>
              </View>
              <TouchableOpacity onPress={() => startEditing('priorities')}>
                <Ionicons name="pencil" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.chipContainer}>
              {profile.priorities.length > 0 ? (
                profile.priorities.map(item => (
                  <View key={item} style={[styles.viewChip, styles.viewChipPrimary]}>
                    <Text style={[styles.viewChipText, styles.viewChipTextPrimary]}>{item}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No priorities set</Text>
              )}
            </View>
          </View>

          {/* Avoid List */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="close-circle" size={20} color={colors.danger} />
                <Text style={styles.sectionTitle}>Avoid List</Text>
              </View>
              <TouchableOpacity onPress={() => startEditing('avoid')}>
                <Ionicons name="pencil" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.chipContainer}>
              {profile.avoidList.length > 0 ? (
                profile.avoidList.map(item => (
                  <View key={item} style={[styles.viewChip, styles.viewChipDanger]}>
                    <Text style={[styles.viewChipText, styles.viewChipTextDanger]}>{item}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No ingredients to avoid</Text>
              )}
            </View>
          </View>

          {/* Seek List */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="search" size={20} color={colors.safe} />
                <Text style={styles.sectionTitle}>Seek List</Text>
              </View>
              <TouchableOpacity onPress={() => startEditing('seek')}>
                <Ionicons name="pencil" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.chipContainer}>
              {profile.seekList.length > 0 ? (
                profile.seekList.map(item => (
                  <View key={item} style={[styles.viewChip, styles.viewChipGreen]}>
                    <Text style={[styles.viewChipText, styles.viewChipTextGreen]}>{item}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No ingredients to seek</Text>
              )}
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionsSection}>
            <Button
              title="Re-run Onboarding"
              onPress={() => {
                updateProfile({ onboardingComplete: false });
                onNavigate('Onboarding');
              }}
              variant="outline"
              icon={<Ionicons name="refresh" size={20} color={colors.primary} />}
            />
            <Button
              title="Reset Profile"
              onPress={handleResetProfile}
              variant="ghost"
              textStyle={{ color: colors.danger }}
              style={{ marginTop: spacing.sm }}
            />
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
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
    paddingTop: spacing.lg, // Lower the header icons
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: spacing.xs,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: spacing.md,
  },
  section: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  viewChip: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  viewChipText: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  viewChipGreen: {
    backgroundColor: colors.safe + '20',
  },
  viewChipTextGreen: {
    color: colors.safe,
  },
  viewChipPrimary: {
    backgroundColor: colors.primary + '20',
  },
  viewChipTextPrimary: {
    color: colors.primary,
  },
  viewChipDanger: {
    backgroundColor: colors.danger + '20',
  },
  viewChipTextDanger: {
    color: colors.danger,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  actionsSection: {
    padding: spacing.md,
    marginTop: spacing.md,
  },
  editContainer: {
    flex: 1,
    padding: spacing.md,
  },
  editTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  addItemRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  addItemInput: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
    marginRight: spacing.sm,
  },
  addItemButton: {
    backgroundColor: colors.primary,
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editActions: {
    flexDirection: 'row',
    marginTop: 'auto',
    paddingTop: spacing.lg,
  },
});
