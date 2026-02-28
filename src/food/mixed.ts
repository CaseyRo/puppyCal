import type { FoodEntry } from './types';

export const MIXED_MIN_TOTAL_GRAMS = 10;
export const MIXED_DEFAULT_WET_PERCENT = 75;
export const MIXED_MIN_WET_PERCENT = 1;
export const MIXED_MAX_WET_PERCENT = 99;

export interface MixedSplitResult {
  wetGrams: number;
  dryGrams: number;
}

export function clampWetPercent(value: number): number {
  if (!Number.isFinite(value)) {
    return MIXED_DEFAULT_WET_PERCENT;
  }
  return Math.max(MIXED_MIN_WET_PERCENT, Math.min(MIXED_MAX_WET_PERCENT, Math.round(value)));
}

export function findDefaultSecondFood(
  primaryFood: FoodEntry | null | undefined,
  allFoods: FoodEntry[]
): FoodEntry | null {
  if (!primaryFood) {
    return null;
  }
  const oppositeType = primaryFood.foodType === 'wet' ? 'dry' : 'wet';
  return (
    allFoods.find((food) => food.foodType === oppositeType && food.id !== primaryFood.id) ?? null
  );
}

export function isValidWetDryPair(
  primaryFood: FoodEntry | null | undefined,
  secondFood: FoodEntry | null | undefined
): boolean {
  if (!primaryFood || !secondFood) {
    return false;
  }
  if (primaryFood.id === secondFood.id) {
    return false;
  }
  return (
    (primaryFood.foodType === 'wet' && secondFood.foodType === 'dry') ||
    (primaryFood.foodType === 'dry' && secondFood.foodType === 'wet')
  );
}

export function canApplyMixedSplit(totalGrams: number): boolean {
  return Number.isFinite(totalGrams) && totalGrams >= MIXED_MIN_TOTAL_GRAMS;
}

export function splitDailyGrams(totalGrams: number, wetPercent: number): MixedSplitResult {
  const safeWetPercent = clampWetPercent(wetPercent);
  const dryPercent = 100 - safeWetPercent;
  return {
    wetGrams: Math.ceil((totalGrams * safeWetPercent) / 100),
    dryGrams: Math.ceil((totalGrams * dryPercent) / 100),
  };
}
