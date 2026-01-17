import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { Button } from '../components/Button';
import { SelectionChip } from '../components/SelectionChip';
import {
  allergyOptions,
  sensitivityOptions,
  dietaryOptions,
  priorityOptions,
} from '../data/ingredientDatabase';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../constants/theme';

const { width } = Dimensions.get('window');

interface OnboardingScreenProps {
  onComplete: () => void;
}

const steps = [
  {
    id: 'welcome',
    icon: 'sparkles',
    title: 'Welcome to ConsciousScan',
    subtitle: "Let's personalize your experience in just a few steps",
  },
  {
    id: 'allergies',
    icon: 'alert-circle',
    title: 'Any Allergies?',
    subtitle: "We'll alert you when products contain these",
    options: allergyOptions,
    field: 'allergies' as const,
  },
  {
    id: 'sensitivities',
    icon: 'heart',
    title: 'Sensitivities to Avoid',
    subtitle: 'Ingredients you prefer to steer clear of',
    options: sensitivityOptions,
    field: 'sensitivities' as const,
  },
  {
    id: 'dietary',
    icon: 'leaf',
    title: 'Dietary Preferences',
    subtitle: 'Your lifestyle and dietary choices',
    options: dietaryOptions,
    field: 'dietaryPreferences' as const,
  },
  {
    id: 'priorities',
    icon: 'flag',
    title: 'Your Priorities',
    subtitle: "What matters most to you in products?",
    options: priorityOptions,
    field: 'priorities' as const,
  },
];

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const { updateProfile } = useUser();
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState<{
    allergies: string[];
    sensitivities: string[];
    dietaryPreferences: string[];
    priorities: string[];
  }>({
    allergies: [],
    sensitivities: [],
    dietaryPreferences: [],
    priorities: [],
  });

  const step = steps[currentStep];
  const isWelcome = step.id === 'welcome';
  const isLastStep = currentStep === steps.length - 1;

  const toggleSelection = (field: keyof typeof selections, value: string) => {
    setSelections((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));
  };

  const handleNext = () => {
    if (isLastStep) {
      updateProfile({
        allergies: selections.allergies.map((name) => ({ name, severity: 'moderate' })),
        sensitivities: selections.sensitivities,
        dietaryPreferences: selections.dietaryPreferences,
        priorities: selections.priorities,
        onboardingComplete: true,
      });
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    updateProfile({ onboardingComplete: true });
    onComplete();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        {steps.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressBar,
              index <= currentStep && styles.progressBarActive,
            ]}
          />
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon */}
        <View style={[styles.iconContainer, isWelcome && styles.iconContainerPrimary]}>
          <Ionicons
            name={step.icon as any}
            size={48}
            color={isWelcome ? colors.white : colors.primary}
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.subtitle}>{step.subtitle}</Text>

        {/* Options */}
        {!isWelcome && step.options && step.field && (
          <View style={styles.optionsContainer}>
            <View style={styles.options}>
              {step.options.map((option) => (
                <SelectionChip
                  key={option}
                  label={option}
                  selected={selections[step.field].includes(option)}
                  onPress={() => toggleSelection(step.field, option)}
                />
              ))}
            </View>
            <Text style={styles.selectionCount}>
              Selected: {selections[step.field].length} / {step.options.length}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          title={isWelcome ? 'Get Started' : isLastStep ? 'Complete Setup' : 'Continue'}
          onPress={handleNext}
          size="lg"
          icon={<Ionicons name="arrow-forward" size={20} color={colors.white} />}
        />

        <View style={styles.secondaryActions}>
          {currentStep > 0 && (
            <Button
              title="Back"
              onPress={handleBack}
              variant="ghost"
              icon={<Ionicons name="arrow-back" size={16} color={colors.primary} />}
            />
          )}
          {!isWelcome && (
            <Button
              title="Skip for now"
              onPress={handleSkip}
              variant="ghost"
              textStyle={{ color: colors.textMuted }}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.xs,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  progressBarActive: {
    backgroundColor: colors.primary,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconContainerPrimary: {
    backgroundColor: colors.primary,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  optionsContainer: {
    width: '100%',
    maxWidth: 400,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  selectionCount: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  actions: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
});
