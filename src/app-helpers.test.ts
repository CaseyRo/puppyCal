import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  dobToAgeMonths,
  estimateWeightFromAge,
  normalizeFoodSelection,
  defaultFoodState,
  DEFAULT_WEIGHT_KG,
} from './app-helpers';
import type { FoodEntry } from './food/types';
import type { FoodPlannerState } from './config';

// ---------------------------------------------------------------------------
// dobToAgeMonths
// ---------------------------------------------------------------------------

describe('dobToAgeMonths', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null for empty string', () => {
    expect(dobToAgeMonths('')).toBeNull();
  });

  it('returns null for invalid date string', () => {
    expect(dobToAgeMonths('not-a-date')).toBeNull();
  });

  it('calculates age in months correctly', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-01'));
    // Born 6 months ago
    expect(dobToAgeMonths('2024-12-01')).toBe(6);
  });

  it('returns at least 1 for very recent birth (same month)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-15'));
    expect(dobToAgeMonths('2025-06-01')).toBe(1);
  });

  it('returns at least 1 for a future date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-01'));
    expect(dobToAgeMonths('2025-12-01')).toBe(1);
  });

  it('handles year boundary correctly', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-01'));
    // Born Jan 2025 → 14 months
    expect(dobToAgeMonths('2025-01-01')).toBe(14);
  });
});

// ---------------------------------------------------------------------------
// estimateWeightFromAge
// ---------------------------------------------------------------------------

describe('estimateWeightFromAge', () => {
  it('returns small breed weight at 2 months', () => {
    // medium = 3, scale small = 0.4 → 1.2
    expect(estimateWeightFromAge(2, 'small')).toBe(1.2);
  });

  it('returns medium breed weight at 6 months', () => {
    // medium = 11, scale = 1 → 11
    expect(estimateWeightFromAge(6, 'medium')).toBe(11);
  });

  it('returns large breed weight at 12 months', () => {
    // medium = 18, scale = 1.75 → 31.5
    expect(estimateWeightFromAge(12, 'large')).toBe(31.5);
  });

  it('returns giant breed weight at adult (>12 months)', () => {
    // medium = 20, scale = 2.75 → 55
    expect(estimateWeightFromAge(18, 'giant')).toBe(55);
  });

  it('returns medium adult weight for age > 12', () => {
    expect(estimateWeightFromAge(24, 'medium')).toBe(20);
  });

  it('handles all age breakpoints for medium', () => {
    expect(estimateWeightFromAge(2, 'medium')).toBe(3);
    expect(estimateWeightFromAge(3, 'medium')).toBe(5);
    expect(estimateWeightFromAge(4, 'medium')).toBe(7);
    expect(estimateWeightFromAge(5, 'medium')).toBe(9);
    expect(estimateWeightFromAge(6, 'medium')).toBe(11);
    expect(estimateWeightFromAge(8, 'medium')).toBe(14);
    expect(estimateWeightFromAge(12, 'medium')).toBe(18);
    expect(estimateWeightFromAge(13, 'medium')).toBe(20);
  });
});

// ---------------------------------------------------------------------------
// defaultFoodState
// ---------------------------------------------------------------------------

const makeFoodEntry = (id: string, supplier: string): FoodEntry => ({
  id,
  supplier,
  brand: supplier,
  productName: id,
  isPuppy: true,
  lifeStage: 'puppy',
  breedSizeTarget: 'medium',
  foodType: 'dry',
  packageSize: '10kg',
  ingredients: [],
  guaranteedAnalysis: {
    proteinMinPercent: 28,
    fatMinPercent: 15,
    fiberMaxPercent: 3,
    moistureMaxPercent: 10,
  },
  feedingGuide: { reference: '' },
  sourceUrl: '',
  sourceDate: '2024-01-01',
});

describe('defaultFoodState', () => {
  it('selects preferred food when present', () => {
    const foods: FoodEntry[] = [
      makeFoodEntry('other-food', 'other'),
      makeFoodEntry('purina-pro-plan-medium-puppy-chicken', 'purina'),
    ];
    const state = defaultFoodState(foods);
    expect(state.selectedFoodId).toBe('purina-pro-plan-medium-puppy-chicken');
    expect(state.selectedSupplier).toBe('purina');
  });

  it('falls back to first food when preferred is absent', () => {
    const foods: FoodEntry[] = [makeFoodEntry('some-other-food', 'royal-canin')];
    const state = defaultFoodState(foods);
    expect(state.selectedFoodId).toBe('some-other-food');
    expect(state.selectedSupplier).toBe('royal-canin');
  });

  it('returns expected defaults', () => {
    const foods: FoodEntry[] = [makeFoodEntry('purina-pro-plan-medium-puppy-chicken', 'purina')];
    const state = defaultFoodState(foods);
    expect(state.ageMonths).toBe(6);
    expect(state.weightKg).toBe(12);
    expect(state.activityLevel).toBe('moderate');
    expect(state.neutered).toBe(false);
    expect(state.breedSize).toBe('medium');
    expect(state.weightGoal).toBe('maintain');
    expect(state.mixedMode).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// normalizeFoodSelection
// ---------------------------------------------------------------------------

const makeState = (overrides: Partial<FoodPlannerState> = {}): FoodPlannerState => ({
  selectedSupplier: 'purina',
  selectedFoodId: 'food-a',
  mixedMode: false,
  secondSupplier: 'purina',
  secondFoodId: '',
  wetPercent: 50,
  ageMonths: 6,
  weightKg: 12,
  activityLevel: 'moderate',
  neutered: false,
  breedSize: 'medium',
  weightGoal: 'maintain',
  ...overrides,
});

const makeCatalog = (): Record<string, FoodEntry[]> => ({
  purina: [makeFoodEntry('food-a', 'purina'), makeFoodEntry('food-b', 'purina')],
  'royal-canin': [makeFoodEntry('rc-food', 'royal-canin')],
});

describe('normalizeFoodSelection', () => {
  const catalog = makeCatalog();
  const fallback = makeState();

  it('returns unchanged state when valid', () => {
    const state = makeState();
    const result = normalizeFoodSelection(state, catalog, fallback);
    expect(result.corrected).toBe(false);
    expect(result.state.selectedFoodId).toBe('food-a');
  });

  it('corrects unknown supplier to fallback supplier', () => {
    const state = makeState({ selectedSupplier: 'unknown-brand' });
    const result = normalizeFoodSelection(state, catalog, fallback);
    expect(result.corrected).toBe(true);
    expect(result.state.selectedSupplier).toBe('purina');
  });

  it('corrects unknown food id to first food in supplier', () => {
    const state = makeState({ selectedFoodId: 'nonexistent-food' });
    const result = normalizeFoodSelection(state, catalog, fallback);
    expect(result.corrected).toBe(true);
    expect(result.state.selectedFoodId).toBe('food-a');
  });

  it('corrects invalid secondSupplier to selectedSupplier', () => {
    const state = makeState({ secondSupplier: 'bogus' });
    const result = normalizeFoodSelection(state, catalog, fallback);
    expect(result.corrected).toBe(true);
    expect(result.state.secondSupplier).toBe('purina');
  });

  it('clears invalid secondFoodId', () => {
    const state = makeState({ secondSupplier: 'purina', secondFoodId: 'nonexistent' });
    const result = normalizeFoodSelection(state, catalog, fallback);
    expect(result.corrected).toBe(true);
    expect(result.state.secondFoodId).toBe('');
  });

  it('does not clear empty secondFoodId', () => {
    const state = makeState({ secondFoodId: '' });
    const result = normalizeFoodSelection(state, catalog, fallback);
    expect(result.state.secondFoodId).toBe('');
  });

  it('clamps wetPercent out of range', () => {
    const state = makeState({ wetPercent: 150 });
    const result = normalizeFoodSelection(state, catalog, fallback);
    expect(result.corrected).toBe(true);
    expect(result.state.wetPercent).toBeLessThanOrEqual(100);
  });
});

// ---------------------------------------------------------------------------
// DEFAULT_WEIGHT_KG constant
// ---------------------------------------------------------------------------

describe('DEFAULT_WEIGHT_KG', () => {
  it('is 12', () => {
    expect(DEFAULT_WEIGHT_KG).toBe(12);
  });
});
