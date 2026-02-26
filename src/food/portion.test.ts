import { describe, expect, it } from 'vitest';
import { calculateDailyPortion } from './portion';
import type { PortionInputs } from './types';

const base: PortionInputs = {
  ageMonths: 6,
  weightKg: 12,
  activityLevel: 'moderate',
  neutered: false,
  breedSize: 'medium',
  weightGoal: 'maintain',
};

describe('calculateDailyPortion', () => {
  it('returns grams/day for valid input', () => {
    const result = calculateDailyPortion(base, 3900);
    expect(result.gramsPerDay).toBeGreaterThan(0);
    expect(result.estimatedKcalPerDay).toBeGreaterThan(0);
  });

  it('falls back to reference kcal density when missing', () => {
    const result = calculateDailyPortion(base);
    expect(result.assumptions.join(' ')).toContain('fallback reference');
  });

  it('applies weight loss goal reduction', () => {
    const maintain = calculateDailyPortion(base, 3900);
    const lose = calculateDailyPortion({ ...base, weightGoal: 'lose' }, 3900);
    expect(lose.gramsPerDay).toBeLessThan(maintain.gramsPerDay);
  });
});
