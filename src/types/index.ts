export type HealthRating = 'safe' | 'caution' | 'warning' | 'danger';
export type SeverityLevel = 'mild' | 'moderate' | 'severe';

export interface Ingredient {
  name: string;
  category: string;
  description: string;
  healthRating: HealthRating;
  concerns: string[];
  benefits: string[];
  isVegan: boolean;
  isNatural: boolean;
  isCrueltyFree?: boolean;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  imageUri?: string;
  barcode?: string;
  ingredients: Ingredient[];
  rawIngredientText?: string;
  overallScore: number;
  letterGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  personalizedWarnings: string[];
  personalizedAdvice: string[];
  scannedAt: Date;
}

export interface Allergy {
  name: string;
  severity: SeverityLevel;
}

export interface UserProfile {
  allergies: Allergy[];
  sensitivities: string[];
  dietaryPreferences: string[];
  priorities: string[];
  avoidList: string[];
  seekList: string[];
  onboardingComplete: boolean;
}

export interface ScanResult {
  productName?: string;
  brand?: string;
  category?: string;
  barcode?: string;
  ingredientText: string;
  imageUri?: string;
  confidence: number;
}

export interface ComparisonResult {
  products: Product[];
  rankedOrder: string[];
  summary: string;
  differingIngredients: {
    ingredient: string;
    presentIn: string[];
    rating: HealthRating;
  }[];
}
