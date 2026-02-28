import { describe, expect, it } from 'vitest';
import { fromDisplayedAge, getFoodProfile, resetForProfileSwitch, toDisplayedAge } from './profile';
import type { FoodPlannerState } from '../config';

const defaults: FoodPlannerState = {
  selectedSupplier: 'purina',
  selectedFoodId: 'purina-pro-plan-medium-puppy-chicken',
  mixedMode: false,
  secondSupplier: 'purina',
  secondFoodId: '',
  wetPercent: 75,
  ageMonths: 6,
  weightKg: 12,
  activityLevel: 'moderate',
  neutered: false,
  breedSize: 'medium',
  weightGoal: 'maintain',
};

describe('food profile helpers', () => {
  it('reads puppy profile from explicit metadata', () => {
    expect(getFoodProfile({ isPuppy: true, lifeStage: 'adult' } as never).isPuppy).toBe(true);
    expect(getFoodProfile({ isPuppy: false, lifeStage: 'puppy' } as never).isPuppy).toBe(false);
  });

  it('converts displayed age by profile', () => {
    expect(toDisplayedAge(9, true)).toBe(9);
    expect(toDisplayedAge(36, false)).toBe(3);
    expect(fromDisplayedAge(2, false)).toBe(24);
    expect(fromDisplayedAge(8, true)).toBe(8);
  });

  it('resets incompatible values when switching profile', () => {
    const start: FoodPlannerState = {
      ...defaults,
      ageMonths: 18,
      activityLevel: 'high',
      neutered: true,
      weightGoal: 'lose',
    };

    const toPuppy = resetForProfileSwitch(start, false, true, defaults);
    expect(toPuppy.ageMonths).toBe(defaults.ageMonths);
    expect(toPuppy.activityLevel).toBe(defaults.activityLevel);
    expect(toPuppy.neutered).toBe(false);
    expect(toPuppy.weightGoal).toBe(defaults.weightGoal);

    const toAdult = resetForProfileSwitch(start, true, false, defaults);
    expect(toAdult.ageMonths).toBe(12);
    expect(toAdult.activityLevel).toBe(defaults.activityLevel);
  });
});
