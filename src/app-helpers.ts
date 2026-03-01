import type { FoodPlannerState } from './config';
import type { BreedSize, FoodEntry } from './food/types';
import { MIXED_DEFAULT_WET_PERCENT } from './food/mixed';
import { clampWetPercent } from './food/mixed';

export const DEFAULT_WEIGHT_KG = 12;

/**
 * Rough weight estimate for a puppy at a given age, scaled by breed size.
 * Used to auto-suggest weight when the user sets age but hasn't touched the weight field.
 * Base curve is for a medium breed (adult ~20 kg).
 */
export function estimateWeightFromAge(ageMonths: number, breedSize: BreedSize): number {
  const medium =
    ageMonths <= 2
      ? 3
      : ageMonths <= 3
        ? 5
        : ageMonths <= 4
          ? 7
          : ageMonths <= 5
            ? 9
            : ageMonths <= 6
              ? 11
              : ageMonths <= 8
                ? 14
                : ageMonths <= 12
                  ? 18
                  : 20;
  const scale = { small: 0.4, medium: 1, large: 1.75, giant: 2.75 }[breedSize] ?? 1;
  return Math.round(medium * scale * 10) / 10;
}

export function dobToAgeMonths(dob: string): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  const now = new Date();
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
