# PurePick 🔍

An AI-powered mobile app for analyzing product ingredients and making informed consumer choices. Built with React Native and Expo.

## Features ✨

### 🤖 AI-Powered Analysis
- **LLM Integration**: Uses Google Gemini AI for intelligent ingredient analysis
- **Personalized Warnings**: Tailored alerts based on your allergies, sensitivities, and preferences
- **Smart Scoring**: 0-100 rating system with letter grades (A-F)
- **Evidence-Based**: Non-alarmist, scientifically accurate ingredient assessments

### 📱 Smart Scanning
- **Camera Scanning**: OCR-powered ingredient list extraction using Google Cloud Vision
- **Barcode Lookup**: Instant product information via Open Food Facts database
- **Manual Input**: Fallback option for manual ingredient entry
- **Multi-Format Support**: Handles various product categories and formats

### 🔍 Product Analysis
- **Detailed Breakdowns**: Comprehensive ingredient-by-ingredient analysis
- **Health Ratings**: Safe, Caution, Warning, Danger classifications
- **Benefits & Concerns**: Balanced view of each ingredient
- **User Profiles**: Customizable dietary preferences and restrictions

### 📊 Comparison Tools
- **Side-by-Side**: Compare up to 5 products simultaneously
- **Smart Ranking**: AI-powered product recommendations
- **Key Differences**: Highlight varying ingredients between products
- **Export Options**: PDF and JSON export capabilities

## Tech Stack 🛠️

- **Frontend**: React Native with Expo
- **AI/ML**: Google Gemini API for ingredient analysis
- **Vision**: Google Cloud Vision API for OCR
- **Database**: Open Food Facts API for barcode lookup
- **Storage**: AsyncStorage for local data persistence
- **UI**: Custom design system with TypeScript

## Setup & Installation 🚀

### Prerequisites
- Node.js 18+
- Expo CLI
- Android Studio (for emulator) or Expo Go app

### Environment Variables
Create a `.env` file in the project root:

```env
EXPO_PUBLIC_LLM_API_KEY=your_gemini_api_key
EXPO_PUBLIC_GOOGLE_VISION_API_KEY=your_google_vision_api_key
EXPO_PUBLIC_LLM_MODEL=gemini-pro
```

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/mounirrouissi/conscious-scan.git
   cd conscious-scan/conscious-scan-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npx expo start
   ```

4. **Run on device**
   - **Mobile**: Scan QR code with Expo Go app
   - **Android Emulator**: Press `a` in terminal
   - **iOS Simulator**: Press `i` in terminal (macOS only)

## API Keys Setup 🔑

### Google Gemini API
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add to your `.env` file as `EXPO_PUBLIC_LLM_API_KEY`

### Google Cloud Vision API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Vision API
3. Create credentials (API key)
4. Add to your `.env` file as `EXPO_PUBLIC_GOOGLE_VISION_API_KEY`

## Project Structure 📁

```
conscious-scan-app/
├── src/
│   ├── components/          # Reusable UI components
│   ├── screens/            # App screens
│   ├── services/           # API and business logic
│   │   ├── llmService.ts   # Gemini AI integration
│   │   ├── visionService.ts # Google Vision OCR
│   │   ├── barcodeService.ts # Open Food Facts API
│   │   └── analysisService.ts # Product analysis logic
│   ├── context/            # React Context providers
│   ├── types/              # TypeScript type definitions
│   ├── constants/          # App constants and themes
│   └── data/               # Static data and configurations
├── assets/                 # Images and static assets
└── app.json               # Expo configuration
```

## Key Services 🔧

### LLM Service (`llmService.ts`)
- Integrates with Google Gemini API
- Processes ingredient analysis requests
- Returns structured JSON responses with ratings and advice

### Vision Service (`visionService.ts`)
- Google Cloud Vision API integration
- OCR for ingredient list extraction
- Product category classification

### Barcode Service (`barcodeService.ts`)
- Open Food Facts API integration
- Product lookup by barcode
- Ingredient data retrieval

### Analysis Service (`analysisService.ts`)
- Orchestrates LLM analysis
- Handles fallback scenarios
- Product comparison logic

## Usage Examples 📖

### Basic Scanning
1. Open the app
2. Tap "Scan Product"
3. Point camera at ingredient list or barcode
4. Review AI analysis and personalized warnings

### Setting Up Profile
1. Go to Profile tab
2. Add allergies, sensitivities, and dietary preferences
3. Set priorities (pregnancy-safe, kid-safe, etc.)
4. Save preferences for personalized analysis

### Comparing Products
1. Scan multiple products
2. Add them to comparison list
3. View side-by-side analysis
4. Get AI-powered recommendations

## Contributing 🤝

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License 📄

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments 🙏

- **Google Gemini**: AI-powered ingredient analysis
- **Google Cloud Vision**: OCR capabilities
- **Open Food Facts**: Open-source product database
- **Expo**: React Native development platform

## Support 💬

For support, email [your-email] or open an issue on GitHub.

---

Made with ❤️ for mindful consumers everywhere.