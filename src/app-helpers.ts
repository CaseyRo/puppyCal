import type { FoodPlannerState } from './config';
import type { BreedSize, FoodEntry } from './food/types';
import { MIXED_DEFAULT_WET_PERCENT } from './food/mixed';
import { clampWetPercent } from './food/mixed';

export const DEFAULT_WEIGHT_KG = 12;

/**
 * Percentage of adult weight reached at each age, by breed size.
 * Uses linear interpolation between anchor points for a smooth growth curve.
 * Source: Waltham growth charts; Hawthorne et al.; Royal Canin growth data.
 */
const GROWTH_PCT: Record<BreedSize, [number, number][]> = {
  small: [
    [2, 0.3],
    [3, 0.45],
    [4, 0.55],
    [5, 0.65],
    [6, 0.75],
    [8, 0.9],
    [10, 0.95],
    [12, 1.0],
  ],
  medium: [
    [2, 0.25],
    [3, 0.35],
    [4, 0.45],
    [5, 0.55],
    [6, 0.65],
    [8, 0.8],
    [10, 0.9],
    [12, 0.95],
    [14, 1.0],
  ],
  large: [
    [2, 0.2],
    [3, 0.28],
    [4, 0.35],
    [5, 0.42],
    [6, 0.5],
    [8, 0.65],
    [10, 0.78],
    [12, 0.88],
    [15, 0.97],
    [18, 1.0],
  ],
  giant: [
    [2, 0.15],
    [3, 0.22],
    [4, 0.28],
    [5, 0.33],
    [6, 0.4],
    [8, 0.52],
    [10, 0.65],
    [12, 0.75],
    [16, 0.88],
    [20, 0.95],
    [24, 1.0],
  ],
};

/** Typical adult weight midpoint per breed size category. */
const ADULT_WEIGHT: Record<BreedSize, number> = {
  small: 7,
  medium: 20,
  large: 35,
  giant: 55,
};

function interpolate(anchors: [number, number][], age: number): number {
  if (age <= anchors[0][0]) return anchors[0][1];
  if (age >= anchors[anchors.length - 1][0]) return anchors[anchors.length - 1][1];
  for (let i = 0; i < anchors.length - 1; i++) {
    const [a0, v0] = anchors[i];
    const [a1, v1] = anchors[i + 1];
    if (age >= a0 && age <= a1) {
      const t = (age - a0) / (a1 - a0);
      return v0 + t * (v1 - v0);
    }
  }
  return anchors[anchors.length - 1][1];
}

/**
 * Estimate puppy weight from age and breed size using growth curve interpolation.
 * Returns weight in kg rounded to 1 decimal place.
 */
export function estimateWeightFromAge(ageMonths: number, breedSize: BreedSize): number {
  const pct = interpolate(GROWTH_PCT[breedSize] ?? GROWTH_PCT.medium, ageMonths);
  const adultWeight = ADULT_WEIGHT[breedSize] ?? ADULT_WEIGHT.medium;
  return Math.round(adultWeight * pct * 10) / 10;
}

export function dobToAgeMonths(dob: string): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  const now = new Date();
  const diffMs = now.getTime() - birth.getTime();
  const weeks = diffMs / (7 * 24 * 60 * 60 * 1000);
  if (weeks < 20) {
    return Math.max(0.25, weeks / 4.345);
  }
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  return Math.max(1, months);
}

export function defaultFoodState(foods: FoodEntry[]): FoodPlannerState {
  const preferredId = 'purina-pro-plan-medium-puppy-chicken';
  const preferred = foods.find((f) => f.id === preferredId) ?? foods[0];
  return {
    selectedSupplier: preferred?.supplier ?? 'purina',
    selectedFoodId: preferred?.id ?? '',
    mixedMode: false,
    secondSupplier: preferred?.supplier ?? 'purina',
    secondFoodId: '',
    wetPercent: MIXED_DEFAULT_WET_PERCENT,
    ageMonths: 6,
    weightKg: 12,
    activityLevel: 'moderate',
    neutered: false,
    breedSize: 'medium',
    weightGoal: 'maintain',
  };
}

export function normalizeFoodSelection(
  foodState: FoodPlannerState,
  supplierCatalog: Record<string, FoodEntry[]>,
  fallbackFoodState: FoodPlannerState
): { state: FoodPlannerState; corrected: boolean } {
  let corrected = false;
  let selectedSupplier = foodState.selectedSupplier;

  if (!supplierCatalog[selectedSupplier]) {
    selectedSupplier = fallbackFoodState.selectedSupplier;
    corrected = true;
  }

  const foodsForSupplier = supplierCatalog[selectedSupplier] ?? [];
  let selectedFoodId = foodState.selectedFoodId;
  if (!foodsForSupplier.some((food) => food.id === selectedFoodId)) {
    selectedFoodId = foodsForSupplier[0]?.id ?? fallbackFoodState.selectedFoodId;
    corrected = true;
  }
  let secondSupplier = foodState.secondSupplier;
  if (!supplierCatalog[secondSupplier]) {
    secondSupplier = selectedSupplier;
    corrected = true;
  }
  const secondFoodsForSupplier = supplierCatalog[secondSupplier] ?? [];
  let secondFoodId = foodState.secondFoodId;
  if (secondFoodId && !secondFoodsForSupplier.some((food) => food.id === secondFoodId)) {
    secondFoodId = '';
    corrected = true;
  }
  const wetPercent = clampWetPercent(foodState.wetPercent);
  if (wetPercent !== foodState.wetPercent) {
    corrected = true;
  }

  return {
    state: {
      ...foodState,
      selectedSupplier,
      selectedFoodId,
      secondSupplier,
      secondFoodId,
      wetPercent,
    },
    corrected,
  };
}
