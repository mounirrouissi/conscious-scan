import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    Dimensions,
    Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '../constants/theme';

const CONSENT_KEY = 'HAS_ACCEPTED_AI_CONSENT_V1';

export const AIConsentModal = () => {
    const [visible, setVisible] = useState(false);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        checkConsent();
    }, []);

    const checkConsent = async () => {
        try {
            const hasConsented = await AsyncStorage.getItem(CONSENT_KEY);
            if (hasConsented !== 'true') {
                setVisible(true);
            }
        } catch (error) {
            console.error('Error checking AI consent:', error);
        } finally {
            setChecking(false);
        }
    };

    const handleAgree = async () => {
        try {
            await AsyncStorage.setItem(CONSENT_KEY, 'true');
            setVisible(false);
        } catch (error) {
            console.error('Error saving AI consent:', error);
        }
    };

    if (checking) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="sparkles" size={32} color={colors.primary} />
                    </View>

                    <Text style={styles.title}>AI Analysis Consent</Text>

                    <Text style={styles.message}>
                        PurePick uses Google Gemini AI to analyze ingredient labels. By clicking "I Agree," you consent to sending ingredient text to Google for processing.
                    </Text>

                    <View style={styles.bulletPoints}>
                        <View style={styles.bulletRow}>
                            <Ionicons name="shield-checkmark-outline" size={20} color={colors.safe} />
                            <Text style={styles.bulletText}>We do not send personal info</Text>
                        </View>
                        <View style={styles.bulletRow}>
                            <Ionicons name="image-outline" size={20} color={colors.safe} />
                            <Text style={styles.bulletText}>Your photos are not stored</Text>
                        </View>
                    </View>

                    <Button
                        title="I Agree"
                        onPress={handleAgree}
                        size="lg"
                        style={styles.button}
                    />
                </View>
            </View>
        </Modal>
    );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    card: {
        backgroundColor: colors.white,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
        ...shadows.lg,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    title: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: colors.text,
        marginBottom: spacing.md,
        textAlign: 'center',
    },
    message: {
        fontSize: fontSize.md,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.xl,
        lineHeight: 22,
    },
    bulletPoints: {
        width: '100%',
        marginBottom: spacing.xl,
        gap: spacing.md,
    },
    bulletRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surfaceSecondary,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        gap: spacing.sm,
    },
    bulletText: {
        fontSize: fontSize.sm,
        color: colors.text,
        fontWeight: fontWeight.medium,
    },
    button: {
        width: '100%',
    },
});
