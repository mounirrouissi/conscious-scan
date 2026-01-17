import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { UserProvider, useUser } from './src/context/UserContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { ScanScreen } from './src/screens/ScanScreen';
import { ProductDetailScreen } from './src/screens/ProductDetailScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { CompareScreen } from './src/screens/CompareScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { colors } from './src/constants/theme';

type Screen = 
  | 'Home'
  | 'Onboarding'
  | 'Scan'
  | 'ProductDetail'
  | 'History'
  | 'Compare'
  | 'Profile';

interface NavigationState {
  screen: Screen;
  params?: Record<string, any>;
}

function AppContent() {
  const { profile, isLoading } = useUser();
  const [navigation, setNavigation] = useState<NavigationState>({ screen: 'Home' });
  const [history, setHistory] = useState<NavigationState[]>([]);

  useEffect(() => {
    if (!isLoading && !profile.onboardingComplete) {
      setNavigation({ screen: 'Onboarding' });
    }
  }, [isLoading, profile.onboardingComplete]);

  const navigate = (screen: string, params?: Record<string, any>) => {
    setHistory(prev => [...prev, navigation]);
    setNavigation({ screen: screen as Screen, params });
  };

  const goBack = () => {
    if (history.length > 0) {
      const previousScreen = history[history.length - 1];
      setHistory(prev => prev.slice(0, -1));
      setNavigation(previousScreen);
    } else {
      setNavigation({ screen: 'Home' });
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const renderScreen = () => {
    switch (navigation.screen) {
      case 'Onboarding':
        return (
          <OnboardingScreen
            onComplete={() => setNavigation({ screen: 'Home' })}
          />
        );
      
      case 'Scan':
        return (
          <ScanScreen
            onNavigate={navigate}
            onBack={goBack}
          />
        );
      
      case 'ProductDetail':
        return (
          <ProductDetailScreen
            productId={navigation.params?.productId}
            onBack={goBack}
            onNavigate={navigate}
          />
        );
      
      case 'History':
        return (
          <HistoryScreen
            onNavigate={navigate}
            onBack={goBack}
          />
        );
      
      case 'Compare':
        return (
          <CompareScreen
            onNavigate={navigate}
            onBack={goBack}
          />
        );
      
      case 'Profile':
        return (
          <ProfileScreen
            onBack={goBack}
            onNavigate={(screen) => setNavigation({ screen: screen as Screen })}
          />
        );
      
      case 'Home':
      default:
        return (
          <HomeScreen
            onNavigate={navigate}
          />
        );
    }
  };

  return (
    <>
      <StatusBar style="dark" />
      {renderScreen()}
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <UserProvider>
        <AppContent />
      </UserProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
