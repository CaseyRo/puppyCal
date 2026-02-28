import { describe, expect, it } from 'vitest';
import type { FoodEntry } from './types';
import {
  MIXED_DEFAULT_WET_PERCENT,
  MIXED_MIN_TOTAL_GRAMS,
  canApplyMixedSplit,
  clampWetPercent,
  findDefaultSecondFood,
  isValidWetDryPair,
  splitDailyGrams,
} from './mixed';

const wetFood: FoodEntry = {
  id: 'wet-1',
  supplier: 'supplier-a',
  brand: 'WetBrand',
  productName: 'Wet Formula',
  isPuppy: true,
  lifeStage: 'puppy',
  breedSizeTarget: 'all',
  foodType: 'wet',
  packageSize: '100g',
  ingredients: ['chicken'],
  guaranteedAnalysis: {
    proteinMinPercent: 10,
    fatMinPercent: 5,
    fiberMaxPercent: 2,
    moistureMaxPercent: 80,
  },
  feedingGuide: { reference: 'guide' },
  calories: { kcalPerKg: 1200 },
  sourceUrl: 'https://example.com/wet',
  sourceDate: '2026-01-01',
};

const dryFood: FoodEntry = {
  ...wetFood,
  id: 'dry-1',
  brand: 'DryBrand',
  productName: 'Dry Formula',
  foodType: 'dry',
  calories: { kcalPerKg: 3800 },
  sourceUrl: 'https://example.com/dry',
};

describe('mixed feeding helpers', () => {
  it('clamps wet percent to 1-99 with safe default', () => {
    expect(clampWetPercent(NaN)).toBe(MIXED_DEFAULT_WET_PERCENT);
    expect(clampWetPercent(0)).toBe(1);
    expect(clampWetPercent(100)).toBe(99);
    expect(clampWetPercent(74.6)).toBe(75);
  });

  it('finds opposite-type second food by default', () => {
    const foods = [wetFood, dryFood];
    const second = findDefaultSecondFood(wetFood, foods);
    expect(second).toBeTruthy();
    expect(second?.foodType).not.toBe(wetFood.foodType);
    expect(second?.id).not.toBe(wetFood.id);
  });

  it('validates wet+dry pairs and blocks duplicates', () => {
    expect(isValidWetDryPair(wetFood, dryFood)).toBe(true);
    expect(isValidWetDryPair(wetFood, wetFood)).toBe(false);
    expect(isValidWetDryPair(wetFood, null)).toBe(false);
  });

  it('applies mixed threshold at 10g minimum', () => {
    expect(canApplyMixedSplit(MIXED_MIN_TOTAL_GRAMS - 1)).toBe(false);
    expect(canApplyMixedSplit(MIXED_MIN_TOTAL_GRAMS)).toBe(true);
  });

  it('splits grams with per-food ceiling', () => {
    expect(splitDailyGrams(100, 75)).toEqual({ wetGrams: 75, dryGrams: 25 });
    expect(splitDailyGrams(10, 99)).toEqual({ wetGrams: 10, dryGrams: 1 });
    expect(splitDailyGrams(101, 50)).toEqual({ wetGrams: 51, dryGrams: 51 });
  });
});
