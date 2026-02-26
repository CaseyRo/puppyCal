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
});
