import { describe, expect, it } from 'vitest';
import { calculateDailyPortion, _ageFactorForTesting as ageFactor } from './portion';
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
    expect(result.assumptions.join(' ')).toContain('fallback');
  });

  it('applies weight loss goal reduction', () => {
    const maintain = calculateDailyPortion(base, 3900);
    const lose = calculateDailyPortion({ ...base, weightGoal: 'lose' }, 3900);
    expect(lose.gramsPerDay).toBeLessThan(maintain.gramsPerDay);
  });

  it('large breeds get less food than medium breeds', () => {
    const medium = calculateDailyPortion(base, 3900);
    const large = calculateDailyPortion({ ...base, breedSize: 'large' }, 3900);
    expect(large.gramsPerDay).toBeLessThan(medium.gramsPerDay);
  });

  it('younger puppies get more per kg than older ones', () => {
    const young = calculateDailyPortion({ ...base, ageMonths: 3, weightKg: 5 }, 3900);
    const older = calculateDailyPortion({ ...base, ageMonths: 10, weightKg: 5 }, 3900);
    expect(young.gramsPerDay).toBeGreaterThan(older.gramsPerDay);
  });

  it('neutered adult gets less than neutered puppy (same weight)', () => {
    const puppyNeutered = calculateDailyPortion({ ...base, ageMonths: 8, neutered: true }, 3900);
    const adultNeutered = calculateDailyPortion({ ...base, ageMonths: 14, neutered: true }, 3900);
    expect(adultNeutered.gramsPerDay).toBeLessThan(puppyNeutered.gramsPerDay);
  });

  it('matches Royal Canin ballpark for 5mo 8.5kg medium breed', () => {
    // Royal Canin product table: 286-310g/day for medium puppy at 5 months
    const result = calculateDailyPortion({ ...base, ageMonths: 5, weightKg: 8.5 }, 3900);
    expect(result.gramsPerDay).toBeGreaterThanOrEqual(200);
    expect(result.gramsPerDay).toBeLessThanOrEqual(320);
  });
});

describe('ageFactor', () => {
  it('returns 3.0 for very young puppies', () => {
    expect(ageFactor(1)).toBe(3.0);
    expect(ageFactor(2)).toBe(3.0);
  });

  it('interpolates smoothly between anchors', () => {
    const at2 = ageFactor(2);
    const at2_5 = ageFactor(2.5);
    const at3 = ageFactor(3);
    expect(at2_5).toBeGreaterThan(at3);
    expect(at2_5).toBeLessThan(at2);
  });

  it('returns 1.4 for adults', () => {
    expect(ageFactor(14)).toBe(1.4);
    expect(ageFactor(24)).toBe(1.4);
  });

  it('decreases monotonically', () => {
    const ages = [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14];
    for (let i = 0; i < ages.length - 1; i++) {
      expect(ageFactor(ages[i])).toBeGreaterThanOrEqual(ageFactor(ages[i + 1]));
    }
  });
});
