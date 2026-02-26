import type { FoodEntry } from './types';
import type { FoodPlannerState } from '../config';

export interface FoodProfile {
  isPuppy: boolean;
}

export function getFoodProfile(food: FoodEntry | null | undefined): FoodProfile {
  if (!food) {
    return { isPuppy: false };
  }
  return {
    isPuppy: food.isPuppy ?? food.lifeStage.toLowerCase() === 'puppy',
  };
}

export function toDisplayedAge(ageMonths: number, isPuppy: boolean): number {
  if (isPuppy) {
    return Math.max(1, Math.min(24, Math.round(ageMonths)));
  }
  return Math.max(1, Math.min(20, Math.round(ageMonths / 12) || 1));
}

export function fromDisplayedAge(inputValue: number, isPuppy: boolean): number {
  if (!Number.isFinite(inputValue)) {
    return isPuppy ? 1 : 12;
  }
  if (isPuppy) {
    return Math.max(1, Math.min(24, Math.round(inputValue)));
  }
  const years = Math.max(1, Math.min(20, Math.round(inputValue)));
  return years * 12;
}

export function resetForProfileSwitch(
  state: FoodPlannerState,
  wasPuppy: boolean,
  nowPuppy: boolean,
  defaults: FoodPlannerState
): FoodPlannerState {
  if (wasPuppy === nowPuppy) {
    return state;
  }

  if (nowPuppy) {
    return {
      ...state,
      ageMonths: defaults.ageMonths,
      activityLevel: defaults.activityLevel,
      neutered: false,
      weightGoal: defaults.weightGoal,
    };
  }

  return {
    ...state,
    ageMonths: 12,
    activityLevel: defaults.activityLevel,
    neutered: defaults.neutered,
    weightGoal: defaults.weightGoal,
  };
}
