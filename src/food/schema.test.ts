import { describe, expect, it } from 'vitest';
import { validateFoodEntry } from './schema';
import type { FoodEntry } from './types';

const base: FoodEntry = {
  id: 'purina-pro-plan-medium-puppy-chicken',
  supplier: 'purina',
  brand: 'Purina Pro Plan',
  productName: 'Medium Puppy Chicken',
  isPuppy: true,
  lifeStage: 'puppy',
  breedSizeTarget: 'medium',
  foodType: 'dry',
  packageSize: '12 kg bag',
  ingredients: ['chicken', 'rice'],
  guaranteedAnalysis: {
    proteinMinPercent: 28,
    fatMinPercent: 18,
    fiberMaxPercent: 4.75,
    moistureMaxPercent: 12,
  },
  feedingGuide: {
    reference: 'Feed by age and target adult weight table.',
  },
  sourceUrl: 'https://example.test/purina',
  sourceDate: '2026-02-25',
};

describe('validateFoodEntry', () => {
  it('accepts entries without calories', () => {
    expect(validateFoodEntry(base)).toEqual([]);
  });

  it('requires source metadata', () => {
    const missingSource = {
      ...base,
      sourceUrl: '',
    };
    expect(validateFoodEntry(missingSource)).toContain('sourceUrl is required');
  });

  it('validates sourceDate format', () => {
    const invalidDate = {
      ...base,
      sourceDate: '02-25-2026',
    };
    expect(validateFoodEntry(invalidDate)).toContain('sourceDate must be YYYY-MM-DD');
  });

  it('relaxes lifeStage, breedSizeTarget, packageSize for scan source', () => {
    const scanEntry: FoodEntry = {
      ...base,
      source: 'scan',
      lifeStage: '',
      breedSizeTarget: '',
      packageSize: '',
    };
    const errors = validateFoodEntry(scanEntry);
    expect(errors).not.toContain('lifeStage is required');
    expect(errors).not.toContain('breedSizeTarget is required');
    expect(errors).not.toContain('packageSize is required');
  });

  it('relaxes ingredients and guaranteedAnalysis for scan source', () => {
    const scanEntry = {
      ...base,
      source: 'scan' as const,
      ingredients: [],
      guaranteedAnalysis: {
        proteinMinPercent: 0,
        fatMinPercent: 0,
        fiberMaxPercent: 0,
        moistureMaxPercent: 0,
      },
      feedingGuide: { reference: '' },
    };
    const errors = validateFoodEntry(scanEntry);
    expect(errors).not.toContain('ingredients must contain at least one item');
    expect(errors).not.toContain('guaranteedAnalysis.proteinMinPercent must be > 0');
    expect(errors).not.toContain('feedingGuide.reference is required');
  });

  it('still requires sourceUrl and sourceDate for scan source', () => {
    const scanEntry: FoodEntry = {
      ...base,
      source: 'scan',
      sourceUrl: '',
      sourceDate: '',
    };
    const errors = validateFoodEntry(scanEntry);
    expect(errors).toContain('sourceUrl is required');
    expect(errors).toContain('sourceDate is required');
  });
});
