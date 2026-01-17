# ConsciousScan - Personalized Ingredient Navigator

A React Native (Expo) app that empowers users to make informed purchasing decisions by analyzing product ingredients for health, ethical, and personal relevance.

## Features

### 🔍 Intelligent Product Scan & Identification
- **Camera Capture**: Take photos of product ingredient lists
- **Barcode Scanning**: Scan EAN/UPC barcodes for quick product lookup
- **Gallery Import**: Select images from your photo library
- **Google Cloud Vision OCR**: Extract text from ingredient labels
- **Auto Category Detection**: AI-powered product category suggestion

### 📊 Personalized Ingredient Analysis
- **Health & Safety Checks**: Analyze ingredients against a curated knowledge base
- **Personalized Scoring**: Dynamic A-F rating based on your profile
- **Ingredient Glossary**: Tap any ingredient for detailed information
- **Warnings & Advice**: Personalized alerts based on your preferences

### 👤 User Profile & Preferences
- **Allergies**: Track allergies with severity levels
- **Sensitivities**: Mark ingredients to avoid
- **Dietary Preferences**: Vegan, Vegetarian, Halal, Kosher, etc.
- **Priorities**: Pregnancy-safe, Kid-safe, Cruelty-free, etc.
- **Custom Lists**: Add specific ingredients to avoid or seek

### ⚖️ Multi-Product Comparison
- Compare up to 5 products side-by-side
- Ranked summary with best choice highlighted
- Visual ingredient differences
- Personalized comparison based on your profile

### 💾 Save & Share
- Save scanned products to history
- Share results with friends
- Export to PDF or JSON

## Setup

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your device (for testing)

### Installation

```bash
cd conscious-scan-app
npm install
```

### Google Cloud Vision API Setup

1. Create a Google Cloud project
2. Enable the Cloud Vision API
3. Create an API key
4. Create a `.env` file in the project root:

```env
EXPO_PUBLIC_GOOGLE_VISION_API_KEY=your_api_key_here
```

### Running the App

```bash
# Start development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on web
npm run web
```

## Project Structure

```
conscious-scan-app/
├── App.tsx                 # Main app with navigation
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── IngredientCard.tsx
│   │   ├── ProductCard.tsx
│   │   ├── ScoreCircle.tsx
│   │   └── SelectionChip.tsx
│   ├── constants/
│   │   └── theme.ts        # Colors, spacing, typography
│   ├── context/
│   │   └── UserContext.tsx # Global state management
│   ├── data/
│   │   └── ingredientDatabase.ts # Ingredient knowledge base
│   ├── screens/
│   │   ├── HomeScreen.tsx
│   │   ├── OnboardingScreen.tsx
│   │   ├── ScanScreen.tsx
│   │   ├── ProductDetailScreen.tsx
│   │   ├── HistoryScreen.tsx
│   │   ├── CompareScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── services/
│   │   ├── analysisService.ts  # Ingredient analysis logic
│   │   └── visionService.ts    # Google Cloud Vision API
│   └── types/
│       └── index.ts        # TypeScript interfaces
└── assets/                 # App icons and images
```

## Key Technologies

- **Expo SDK 54**: React Native framework
- **TypeScript**: Type-safe development
- **AsyncStorage**: Local data persistence
- **expo-camera**: Camera and barcode scanning
- **expo-image-picker**: Gallery image selection
- **expo-print**: PDF export
- **expo-sharing**: Share functionality
- **Google Cloud Vision AI**: OCR and image classification

## Ingredient Database

The app includes a curated database of common ingredients with:
- Health ratings (safe, caution, warning, danger)
- Concerns and benefits
- Vegan/Natural indicators
- Category classification

You can extend the database in `src/data/ingredientDatabase.ts`.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License
