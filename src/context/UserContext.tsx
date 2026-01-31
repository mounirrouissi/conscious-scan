import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, Product } from '../types';

interface UserContextType {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  scannedProducts: Product[];
  addScannedProduct: (product: Product) => void;
  removeScannedProduct: (productId: string) => void;
  comparisonList: Product[];
  addToComparison: (product: Product) => void;
  removeFromComparison: (productId: string) => void;
  clearComparison: () => void;
  isLoading: boolean;
}

const defaultProfile: UserProfile = {
  allergies: [],
  sensitivities: [],
  dietaryPreferences: [],
  priorities: [],
  avoidList: [],
  seekList: [],
  onboardingComplete: false,
};

const UserContext = createContext<UserContextType | undefined>(undefined);

const PROFILE_KEY = '@purePick_profile';
const PRODUCTS_KEY = '@purePick_products';

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [scannedProducts, setScannedProducts] = useState<Product[]>([]);
  const [comparisonList, setComparisonList] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [savedProfile, savedProducts] = await Promise.all([
        AsyncStorage.getItem(PROFILE_KEY),
        AsyncStorage.getItem(PRODUCTS_KEY),
      ]);

      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
      }
      if (savedProducts) {
        setScannedProducts(JSON.parse(savedProducts));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProfile = async (newProfile: UserProfile) => {
    try {
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(newProfile));
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const saveProducts = async (products: Product[]) => {
    try {
      await AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    } catch (error) {
      console.error('Error saving products:', error);
    }
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    const newProfile = { ...profile, ...updates };
    setProfile(newProfile);
    saveProfile(newProfile);
  };

  const addScannedProduct = (product: Product) => {
    const newProducts = [product, ...scannedProducts.slice(0, 99)];
    setScannedProducts(newProducts);
    saveProducts(newProducts);
  };

  const removeScannedProduct = (productId: string) => {
    const newProducts = scannedProducts.filter((p) => p.id !== productId);
    setScannedProducts(newProducts);
    saveProducts(newProducts);
  };

  const addToComparison = (product: Product) => {
    if (comparisonList.length < 5 && !comparisonList.find((p) => p.id === product.id)) {
      setComparisonList((prev) => [...prev, product]);
    }
  };

  const removeFromComparison = (productId: string) => {
    setComparisonList((prev) => prev.filter((p) => p.id !== productId));
  };

  const clearComparison = () => {
    setComparisonList([]);
  };

  return (
    <UserContext.Provider
      value={{
        profile,
        updateProfile,
        scannedProducts,
        addScannedProduct,
        removeScannedProduct,
        comparisonList,
        addToComparison,
        removeFromComparison,
        clearComparison,
        isLoading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
