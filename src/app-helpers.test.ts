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

  it('returns fractional months for very recent birth (same month, under 20 weeks)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-15'));
    // 2 weeks old → ~0.46 months
    const result = dobToAgeMonths('2025-06-01');
    expect(result).toBeGreaterThanOrEqual(0.25);
    expect(result).toBeLessThan(1);
  });

  it('returns at least 0.25 for a future date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-01'));
    expect(dobToAgeMonths('2025-12-01')).toBe(0.25);
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
    // adult=7kg, 30% at 2mo → 2.1
    expect(estimateWeightFromAge(2, 'small')).toBe(2.1);
  });

  it('returns medium breed weight at 6 months', () => {
    // adult=20kg, 65% at 6mo → 13.0
    expect(estimateWeightFromAge(6, 'medium')).toBe(13);
  });

  it('returns large breed weight at 12 months', () => {
    // adult=35kg, 88% at 12mo → 30.8
    expect(estimateWeightFromAge(12, 'large')).toBe(30.8);
  });

  it('returns giant breed weight at 18 months', () => {
    // adult=55kg, interpolated between 16mo(88%) and 20mo(95%) → ~91.5% → ~50.3
    const weight = estimateWeightFromAge(18, 'giant');
    expect(weight).toBeGreaterThan(49);
    expect(weight).toBeLessThan(53);
  });

  it('returns full adult weight past maturity', () => {
    expect(estimateWeightFromAge(24, 'medium')).toBe(20);
    expect(estimateWeightFromAge(30, 'small')).toBe(7);
  });

  it('interpolates between anchor points', () => {
    // 7 months medium: between 6mo(65%) and 8mo(80%) → 72.5% of 20kg = 14.5
    expect(estimateWeightFromAge(7, 'medium')).toBe(14.5);
  });

  it('weight increases monotonically with age', () => {
    const ages = [2, 3, 4, 5, 6, 8, 10, 12, 14];
    for (let i = 0; i < ages.length - 1; i++) {
      expect(estimateWeightFromAge(ages[i], 'medium')).toBeLessThanOrEqual(
        estimateWeightFromAge(ages[i + 1], 'medium')
      );
    }
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
