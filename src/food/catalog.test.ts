import { describe, expect, it, vi, beforeEach } from 'vitest';
import { findFoodById, getAllFoods, validateCatalog, getFoodsForPortionPlanner } from './catalog';
import type { FoodEntry } from './types';

const mockScannedFood: FoodEntry = {
  id: 'scan-test-food-123',
  supplier: 'open-food-facts',
  brand: 'Test Brand',
  productName: 'Scanned Dog Kibble',
  isPuppy: false,
  lifeStage: '',
  breedSizeTarget: '',
  foodType: 'dry',
  packageSize: '',
  ingredients: ['chicken', 'rice'],
  guaranteedAnalysis: {
    proteinMinPercent: 0,
    fatMinPercent: 0,
    fiberMaxPercent: 0,
    moistureMaxPercent: 0,
  },
  feedingGuide: { reference: '' },
  sourceUrl: 'https://world.openfoodfacts.org/product/1234567890',
  sourceDate: '2026-03-07',
  source: 'scan',
};

const mockScannedFoodComplete: FoodEntry = {
  ...mockScannedFood,
  id: 'scan-complete-food',
  productName: 'Complete Scanned Food',
  guaranteedAnalysis: {
    proteinMinPercent: 25,
    fatMinPercent: 12,
    fiberMaxPercent: 4,
    moistureMaxPercent: 10,
  },
};

function mockLocalStorage(items: Record<string, string>) {
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => items[key] ?? null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    length: Object.keys(items).length,
    key: () => null,
  });
}

describe('food catalog', () => {
  beforeEach(() => {
    mockLocalStorage({});
  });

  it('contains the canonical Purina medium puppy chicken entry', () => {
    const entry = findFoodById('purina-pro-plan-medium-puppy-chicken');
    expect(entry).toBeDefined();
    expect(entry?.brand).toContain('Purina');
  });

  it('catalog entries pass schema validation', () => {
    const result = validateCatalog();
    expect(result.entries.length).toBeGreaterThan(0);
    expect(result.errors).toEqual([]);
  });

  it('includes more than one supplier entry', () => {
    const suppliers = new Set(getAllFoods().map((food) => food.supplier));
    expect(suppliers.size).toBeGreaterThan(1);
  });
});

describe('catalog with scanned foods', () => {
  it('merges scanned entries into getAllFoods', () => {
    mockLocalStorage({
      puppycal_scanned_foods: JSON.stringify([mockScannedFood]),
    });
    const all = getAllFoods();
    expect(all.find((f) => f.id === mockScannedFood.id)).toBeDefined();
  });

  it('deduplicates by id — curated wins', () => {
    const curatedId = 'purina-pro-plan-medium-puppy-chicken';
    const duplicate: FoodEntry = { ...mockScannedFood, id: curatedId };
    mockLocalStorage({
      puppycal_scanned_foods: JSON.stringify([duplicate]),
    });
    const all = getAllFoods();
    const matches = all.filter((f) => f.id === curatedId);
    expect(matches).toHaveLength(1);
    expect(matches[0].source).toBeUndefined(); // curated entry has no source field
  });

  it('deduplicates by productName — curated wins', () => {
    const curated = getAllFoods().find((f) => !f.source);
    if (!curated) throw new Error('No curated food found');
    const duplicate: FoodEntry = {
      ...mockScannedFood,
      id: 'different-id',
      productName: curated.productName,
    };
    mockLocalStorage({
      puppycal_scanned_foods: JSON.stringify([duplicate]),
    });
    const all = getAllFoods();
    const matches = all.filter(
      (f) => f.productName.toLowerCase() === curated.productName.toLowerCase()
    );
    expect(matches).toHaveLength(1);
  });
});

describe('getFoodsForPortionPlanner', () => {
  it('excludes incomplete scan-sourced entries', () => {
    mockLocalStorage({
      puppycal_scanned_foods: JSON.stringify([mockScannedFood]),
    });
    const plannerFoods = getFoodsForPortionPlanner();
    expect(plannerFoods.find((f) => f.id === mockScannedFood.id)).toBeUndefined();
  });

  it('includes scan-sourced entries with complete nutrition', () => {
    mockLocalStorage({
      puppycal_scanned_foods: JSON.stringify([mockScannedFoodComplete]),
    });
    const plannerFoods = getFoodsForPortionPlanner();
    expect(plannerFoods.find((f) => f.id === mockScannedFoodComplete.id)).toBeDefined();
  });

  it('always includes curated entries', () => {
    mockLocalStorage({});
    const plannerFoods = getFoodsForPortionPlanner();
    expect(plannerFoods.length).toBeGreaterThan(0);
    expect(
      plannerFoods.every((f) => f.source !== 'scan' || f.guaranteedAnalysis.proteinMinPercent > 0)
    ).toBe(true);
  });
});
