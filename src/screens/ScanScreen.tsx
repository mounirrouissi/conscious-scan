import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Modal,
} from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { analyzeProductImage } from '../services/visionService';
import { createProductFromScan } from '../services/analysisService';
import { lookupBarcode } from '../services/barcodeService';
import { productCategories } from '../data/ingredientDatabase';
import { Button } from '../components/Button';
import { SelectionChip } from '../components/SelectionChip';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadows } from '../constants/theme';

interface ScanScreenProps {
  onNavigate: (screen: string, params?: any) => void;
  onBack: () => void;
}

type ScanMode = 'camera' | 'barcode' | 'gallery';
type ScanStep = 'capture' | 'category' | 'review' | 'processing';

export const ScanScreen: React.FC<ScanScreenProps> = ({ onNavigate, onBack }) => {
  const { profile, addScannedProduct } = useUser();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [scanMode, setScanMode] = useState<ScanMode>('camera');
  const [scanStep, setScanStep] = useState<ScanStep>('capture');
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [suggestedCategory, setSuggestedCategory] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [productName, setProductName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualIngredients, setManualIngredients] = useState('');

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      setIsProcessing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (photo?.uri) {
        setCapturedImage(photo.uri);
        await processImage(photo.uri);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsProcessing(true);
        setCapturedImage(result.assets[0].uri);
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const processImage = async (imageUri: string) => {
    try {
      setScanStep('processing');
      
      // Use Google Cloud Vision API
      const result = await analyzeProductImage(imageUri);
      
      setExtractedText(result.extractedText);
      setSuggestedCategory(result.suggestedCategory);
      setSelectedCategory(result.suggestedCategory);
      
      // Try to extract product name and brand from text
      const lines = result.extractedText.split('\n').filter(l => l.trim());
      if (lines.length > 0) {
        setProductName(lines[0].substring(0, 50));
      }
      if (lines.length > 1) {
        setBrandName(lines[1].substring(0, 30));
      }
      
      setScanStep('category');
    } catch (error) {
      console.error('Error processing image:', error);
      Alert.alert(
        'Processing Error',
        'Could not analyze the image. Would you like to enter ingredients manually?',
        [
          { text: 'Cancel', onPress: () => resetScan() },
          { text: 'Enter Manually', onPress: () => setShowManualInput(true) },
        ]
      );
      setScanStep('capture');
    }
  };

  const handleBarcodeScan = async (result: BarcodeScanningResult) => {
    if (result.data && !scannedBarcode && !isProcessing) {
      setScannedBarcode(result.data);
      setIsProcessing(true);
      setScanStep('processing');

      try {
        const barcodeProduct = await lookupBarcode(result.data);

        if (barcodeProduct.found && barcodeProduct.ingredients) {
          // Product found with ingredients
          setProductName(barcodeProduct.name);
          setBrandName(barcodeProduct.brand);
          setSelectedCategory(barcodeProduct.category);
          setSuggestedCategory(barcodeProduct.category);
          setExtractedText(barcodeProduct.ingredients);
          if (barcodeProduct.imageUrl) {
            setCapturedImage(barcodeProduct.imageUrl);
          }
          setScanStep('category');
        } else if (barcodeProduct.found) {
          // Product found but no ingredients
          setProductName(barcodeProduct.name);
          setBrandName(barcodeProduct.brand);
          setSelectedCategory(barcodeProduct.category);
          setSuggestedCategory(barcodeProduct.category);
          if (barcodeProduct.imageUrl) {
            setCapturedImage(barcodeProduct.imageUrl);
          }
          Alert.alert(
            'Product Found',
            `${barcodeProduct.name}\n\nNo ingredient list available in database. Please take a photo of the ingredients.`,
            [
              { text: 'Take Photo', onPress: () => {
                setScanStep('capture');
                setScanMode('camera');
              }},
              { text: 'Enter Manually', onPress: () => {
                setShowManualInput(true);
                setScanStep('capture');
              }},
            ]
          );
        } else {
          // Product not found
          Alert.alert(
            'Product Not Found',
            `Barcode: ${result.data}\n\nThis product is not in our database. Please take a photo of the ingredient list.`,
            [
              { text: 'Take Photo', onPress: () => {
                setScanStep('capture');
                setScanMode('camera');
              }},
              { text: 'Enter Manually', onPress: () => {
                setShowManualInput(true);
                setScanStep('capture');
              }},
            ]
          );
        }
      } catch (error) {
        console.error('Barcode lookup error:', error);
        Alert.alert(
          'Lookup Failed',
          'Could not look up barcode. Please take a photo of the ingredient list.',
          [
            { text: 'OK', onPress: () => {
              setScanStep('capture');
              setScanMode('camera');
            }}
          ]
        );
      } finally {
        setIsProcessing(false);
        setScannedBarcode(null);
      }
    }
  };

  const confirmCategory = () => {
    setScanStep('review');
  };

  const createProduct = async () => {
    try {
      setIsProcessing(true);
      
      const ingredientText = manualIngredients || extractedText;
      
      if (!ingredientText.trim()) {
        Alert.alert('Error', 'No ingredients found. Please enter ingredients manually.');
        setShowManualInput(true);
        setIsProcessing(false);
        return;
      }

      // createProductFromScan is now async (uses LLM)
      const product = await createProductFromScan(
        {
          name: productName || 'Unknown Product',
          brand: brandName || 'Unknown Brand',
          category: selectedCategory || 'Uncategorized',
          barcode: scannedBarcode || undefined,
          ingredientText,
          imageUri: capturedImage || undefined,
        },
        profile
      );

      addScannedProduct(product);
      
      Alert.alert(
        'Product Analyzed!',
        `${product.name} has been analyzed by AI.\nScore: ${product.overallScore}/100 (${product.letterGrade})`,
        [
          { text: 'View Details', onPress: () => onNavigate('ProductDetail', { productId: product.id }) },
          { text: 'Scan Another', onPress: resetScan },
        ]
      );
    } catch (error) {
      console.error('Error creating product:', error);
      Alert.alert('Error', 'Failed to analyze product. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetScan = () => {
    setCapturedImage(null);
    setExtractedText('');
    setSuggestedCategory('');
    setSelectedCategory('');
    setProductName('');
    setBrandName('');
    setScannedBarcode(null);
    setManualIngredients('');
    setShowManualInput(false);
    setScanStep('capture');
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color={colors.textMuted} />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            ConsciousScan needs camera access to scan product barcodes and ingredient lists.
          </Text>
          <Button title="Grant Permission" onPress={requestPermission} />
          <Button title="Go Back" onPress={onBack} variant="ghost" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {scanStep === 'capture' ? 'Scan Product' : 
           scanStep === 'category' ? 'Confirm Category' :
           scanStep === 'review' ? 'Review Details' : 'Processing...'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Capture Step */}
      {scanStep === 'capture' && (
        <>
          {/* Mode Selector */}
          <View style={styles.modeSelector}>
            <TouchableOpacity
              style={[styles.modeButton, scanMode === 'camera' && styles.modeButtonActive]}
              onPress={() => setScanMode('camera')}
            >
              <Ionicons name="camera" size={20} color={scanMode === 'camera' ? colors.white : colors.text} />
              <Text style={[styles.modeButtonText, scanMode === 'camera' && styles.modeButtonTextActive]}>
                Photo
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeButton, scanMode === 'barcode' && styles.modeButtonActive]}
              onPress={() => setScanMode('barcode')}
            >
              <Ionicons name="barcode" size={20} color={scanMode === 'barcode' ? colors.white : colors.text} />
              <Text style={[styles.modeButtonText, scanMode === 'barcode' && styles.modeButtonTextActive]}>
                Barcode
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeButton, scanMode === 'gallery' && styles.modeButtonActive]}
              onPress={() => { setScanMode('gallery'); pickImage(); }}
            >
              <Ionicons name="images" size={20} color={scanMode === 'gallery' ? colors.white : colors.text} />
              <Text style={[styles.modeButtonText, scanMode === 'gallery' && styles.modeButtonTextActive]}>
                Gallery
              </Text>
            </TouchableOpacity>
          </View>

          {/* Camera View */}
          <View style={styles.cameraContainer}>
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing="back"
              barcodeScannerSettings={scanMode === 'barcode' ? {
                barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
              } : undefined}
              onBarcodeScanned={scanMode === 'barcode' ? handleBarcodeScan : undefined}
            >
              <View style={styles.overlay}>
                <View style={styles.scanFrame}>
                  <View style={[styles.corner, styles.cornerTL]} />
                  <View style={[styles.corner, styles.cornerTR]} />
                  <View style={[styles.corner, styles.cornerBL]} />
                  <View style={[styles.corner, styles.cornerBR]} />
                </View>
                <Text style={styles.scanHint}>
                  {scanMode === 'barcode' 
                    ? 'Point at barcode to scan'
                    : 'Position ingredient list in frame'}
                </Text>
              </View>
            </CameraView>
          </View>

          {/* Capture Button */}
          {scanMode === 'camera' && (
            <View style={styles.captureContainer}>
              <TouchableOpacity
                style={styles.captureButton}
                onPress={takePicture}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color={colors.white} size="large" />
                ) : (
                  <View style={styles.captureButtonInner} />
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Manual Input Button */}
          <TouchableOpacity
            style={styles.manualButton}
            onPress={() => setShowManualInput(true)}
          >
            <Ionicons name="create-outline" size={20} color={colors.primary} />
            <Text style={styles.manualButtonText}>Enter ingredients manually</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Processing Step */}
      {scanStep === 'processing' && (
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.processingText}>Analyzing image...</Text>
          <Text style={styles.processingSubtext}>Using Google Cloud Vision AI</Text>
        </View>
      )}

      {/* Category Step */}
      {scanStep === 'category' && (
        <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.stepTitle}>Confirm Product Category</Text>
          <Text style={styles.stepSubtitle}>
            We detected: <Text style={styles.highlight}>{suggestedCategory}</Text>
          </Text>

          <View style={styles.categoryGrid}>
            {productCategories.map((category) => (
              <SelectionChip
                key={category}
                label={category}
                selected={selectedCategory === category}
                onPress={() => setSelectedCategory(category)}
              />
            ))}
          </View>

          <Button
            title="Continue"
            onPress={confirmCategory}
            style={{ marginTop: spacing.lg }}
          />
        </ScrollView>
      )}

      {/* Review Step */}
      {scanStep === 'review' && (
        <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.stepTitle}>Review Product Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Product Name</Text>
            <TextInput
              style={styles.input}
              value={productName}
              onChangeText={setProductName}
              placeholder="Enter product name"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Brand</Text>
            <TextInput
              style={styles.input}
              value={brandName}
              onChangeText={setBrandName}
              placeholder="Enter brand name"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Category</Text>
            <Text style={styles.categoryDisplay}>{selectedCategory}</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Extracted Ingredients</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={manualIngredients || extractedText}
              onChangeText={setManualIngredients}
              placeholder="Ingredients will appear here..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={6}
            />
          </View>

          <View style={styles.buttonRow}>
            <Button
              title="Back"
              onPress={() => setScanStep('category')}
              variant="outline"
              style={{ flex: 1, marginRight: spacing.sm }}
            />
            <Button
              title="Analyze"
              onPress={createProduct}
              loading={isProcessing}
              style={{ flex: 1 }}
            />
          </View>
        </ScrollView>
      )}

      {/* Manual Input Modal */}
      <Modal visible={showManualInput} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enter Ingredients</Text>
              <TouchableOpacity onPress={() => setShowManualInput(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, styles.textArea, { height: 200 }]}
              value={manualIngredients}
              onChangeText={setManualIngredients}
              placeholder="Paste or type ingredients here, separated by commas..."
              placeholderTextColor={colors.textMuted}
              multiline
            />

            <Button
              title="Continue"
              onPress={() => {
                setShowManualInput(false);
                setExtractedText(manualIngredients);
                setScanStep('category');
              }}
              disabled={!manualIngredients.trim()}
              style={{ marginTop: spacing.md }}
            />
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
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  permissionTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  permissionText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  modeSelector: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceSecondary,
    gap: spacing.xs,
  },
  modeButtonActive: {
    backgroundColor: colors.primary,
  },
  modeButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  modeButtonTextActive: {
    color: colors.white,
  },
  cameraContainer: {
    flex: 1,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  camera: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  scanFrame: {
    width: 280,
    height: 200,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: colors.white,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  scanHint: {
    color: colors.white,
    fontSize: fontSize.sm,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  captureContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
  captureButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.white,
    borderWidth: 3,
    borderColor: colors.primary,
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  manualButtonText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginTop: spacing.lg,
  },
  processingSubtext: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  stepContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  stepTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  stepSubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  highlight: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  categoryDisplay: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: fontWeight.medium,
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
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
    paddingBottom: spacing.xxl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
});
