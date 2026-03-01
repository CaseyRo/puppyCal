import type { PortionInputs, PortionResult } from './types';

const ACTIVITY_FACTOR: Record<PortionInputs['activityLevel'], number> = {
  low: 1.4,
  moderate: 1.6,
  high: 1.9,
};

const BREED_FACTOR: Record<PortionInputs['breedSize'], number> = {
  small: 0.95,
  medium: 1.0,
  large: 1.08,
  giant: 1.12,
};

const GOAL_FACTOR: Record<PortionInputs['weightGoal'], number> = {
  maintain: 1.0,
  lose: 0.85,
};

const FALLBACK_KCAL_PER_KG = 3800;

function ageFactor(ageMonths: number): number {
  if (ageMonths <= 4) return 2.5;
  if (ageMonths <= 6) return 2.0;
  if (ageMonths <= 12) return 1.6;
  return 1.2;
}

export function calculateDailyPortion(inputs: PortionInputs, kcalPerKg?: number): PortionResult {
  const safeWeight = Math.max(0.5, inputs.weightKg);
  const rer = 70 * Math.pow(safeWeight, 0.75);
  const neuterFactor = inputs.neutered ? 0.9 : 1.0;
  const estimatedKcalPerDay =
    rer *
    ageFactor(inputs.ageMonths) *
    ACTIVITY_FACTOR[inputs.activityLevel] *
    BREED_FACTOR[inputs.breedSize] *
    GOAL_FACTOR[inputs.weightGoal] *
    neuterFactor;

  const usedFallbackKcal = !kcalPerKg || kcalPerKg <= 0;
  const density = usedFallbackKcal ? FALLBACK_KCAL_PER_KG : kcalPerKg;
  const gramsPerDay = Math.max(1, Math.round((estimatedKcalPerDay / density) * 1000));

  return {
    gramsPerDay,
    estimatedKcalPerDay: Math.round(estimatedKcalPerDay),
    densityKcalPerKg: density,
    usedFallbackKcal,
    assumptions: [
      'Reference model reverse-engineered from public calculator behavior; exact vendor internals are unknown.',
      `Uses kcal density ${density} kcal/kg${usedFallbackKcal ? ' (fallback reference when product calories are missing)' : ''}.`,
      'Advisory planning aid only; not veterinary advice.',
    ],
  };
}
