import { describe, it, expect } from 'vitest';
import {
  getDefaults,
  parsePlannerStateFromSearch,
  serializePlannerStateToSearch,
  type FoodPlannerState,
  type PlannerState,
} from './config';

const defaultFood: FoodPlannerState = {
  selectedSupplier: 'purina',
  selectedFoodId: 'purina-pro-plan-medium-puppy-chicken',
  ageMonths: 6,
  weightKg: 12,
  activityLevel: 'moderate',
  neutered: false,
  breedSize: 'medium',
  weightGoal: 'maintain',
};

function buildState(overrides: Partial<PlannerState> = {}): PlannerState {
  return {
    config: { ...getDefaults(), dob: '2025-01-01' },
    food: { ...defaultFood },
    activeTab: 'walkies',
    ...overrides,
  };
}

describe('planner query parse/serialize', () => {
  it('parses schedule + food + tab values from query', () => {
    const parsed = parsePlannerStateFromSearch(
      '?lang=en&dob=2025-01-01&months=2&start=2025-03-01&tab=food&foodSupplier=royal-canin&foodId=royal-canin-maxi-puppy&foodAge=7&foodWeight=14.3&foodActivity=high&foodNeutered=1&foodBreed=large&foodGoal=lose',
      defaultFood
    );

    expect(parsed.state.config.lang).toBe('en');
    expect(parsed.state.config.months).toBe(2);
    expect(parsed.state.activeTab).toBe('food');
    expect(parsed.state.food.selectedSupplier).toBe('royal-canin');
    expect(parsed.state.food.selectedFoodId).toBe('royal-canin-maxi-puppy');
    expect(parsed.state.food.ageMonths).toBe(7);
    expect(parsed.state.food.weightKg).toBe(14.3);
    expect(parsed.state.food.activityLevel).toBe('high');
    expect(parsed.state.food.neutered).toBe(true);
    expect(parsed.state.food.breedSize).toBe('large');
    expect(parsed.state.food.weightGoal).toBe('lose');
  });

  it('normalizes invalid values to safe defaults and reports corrections', () => {
    const parsed = parsePlannerStateFromSearch(
      '?lang=fr&months=99&tab=unknown&foodAge=0&foodWeight=-3&foodActivity=wild&foodNeutered=maybe&foodBreed=tiny&foodGoal=gain',
      defaultFood
    );

    expect(parsed.state.config.lang).toBe('nl');
    expect(parsed.state.config.months).toBe(3);
    expect(parsed.state.activeTab).toBe('walkies');
    expect(parsed.state.food.ageMonths).toBe(defaultFood.ageMonths);
    expect(parsed.state.food.weightKg).toBe(defaultFood.weightKg);
    expect(parsed.state.food.activityLevel).toBe(defaultFood.activityLevel);
    expect(parsed.state.food.neutered).toBe(defaultFood.neutered);
    expect(parsed.state.food.breedSize).toBe(defaultFood.breedSize);
    expect(parsed.state.food.weightGoal).toBe(defaultFood.weightGoal);
    expect(parsed.hadCorrections).toBe(true);
  });

  it('serializes deterministically and omits default-equivalent values', () => {
    const serialized = serializePlannerStateToSearch(buildState(), defaultFood);
    expect(serialized).toBe('?dob=2025-01-01');

    const changed = serializePlannerStateToSearch(
      buildState({
        activeTab: 'food',
        food: { ...defaultFood, ageMonths: 8, neutered: true },
      }),
      defaultFood
    );

    expect(changed).toBe('?dob=2025-01-01&tab=food&foodAge=8&foodNeutered=1');
  });

  it('accepts up to 12 months and falls back when out of range', () => {
    const valid = parsePlannerStateFromSearch('?months=12', defaultFood);
    expect(valid.state.config.months).toBe(12);
    expect(valid.hadCorrections).toBe(false);

    const invalid = parsePlannerStateFromSearch('?months=13', defaultFood);
    expect(invalid.state.config.months).toBe(3);
    expect(invalid.hadCorrections).toBe(true);
  });

  it('round-trips to equivalent normalized state', () => {
    const start = buildState({
      config: {
        ...getDefaults(),
        lang: 'en',
        dob: '2025-01-01',
        months: 2,
        start: '2025-03-01',
        birthday: false,
      },
      food: {
        ...defaultFood,
        selectedSupplier: 'royal-canin',
        selectedFoodId: 'royal-canin-maxi-puppy',
        weightKg: 13.5,
      },
      activeTab: 'food',
    });

    const search = serializePlannerStateToSearch(start, defaultFood);
    const parsed = parsePlannerStateFromSearch(search, defaultFood);

    expect(parsed.state).toEqual(start);
  });
});
