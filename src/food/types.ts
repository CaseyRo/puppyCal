export type ActivityLevel = 'low' | 'moderate' | 'high';
export type BreedSize = 'small' | 'medium' | 'large' | 'giant';
export type WeightGoal = 'maintain' | 'lose';
export type FoodType = 'dry' | 'wet';

export interface GuaranteedAnalysis {
  proteinMinPercent: number;
  fatMinPercent: number;
  fiberMaxPercent: number;
  moistureMaxPercent: number;
}

export interface Calories {
  kcalPerKg?: number;
  kcalPerCup?: number;
  note?: string;
}

export interface FeedingGuide {
  reference: string;
}

export interface FoodEntry {
  id: string;
  supplier: string;
  brand: string;
  productName: string;
  isPuppy: boolean;
  lifeStage: string;
  breedSizeTarget: string;
  foodType: FoodType;
  packageSize: string;
  ingredients: string[];
  guaranteedAnalysis: GuaranteedAnalysis;
  feedingGuide: FeedingGuide;
  calories?: Calories;
  sourceUrl: string;
  sourceDate: string;
}

export interface PortionInputs {
  ageMonths: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  neutered: boolean;
  breedSize: BreedSize;
  weightGoal: WeightGoal;
}

export interface PortionResult {
  gramsPerDay: number;
  estimatedKcalPerDay: number;
  assumptions: string[];
  densityKcalPerKg: number;
  usedFallbackKcal: boolean;
}
