import type { PortionInputs, PortionResult } from './types';

/**
 * Activity modifiers applied around 1.0 baseline.
 * The age factor already assumes "typical" activity, so these are adjustments.
 * Source: NRC 2006 / veterinary consensus — conservative for growing puppies.
 */
const ACTIVITY_FACTOR: Record<PortionInputs['activityLevel'], number> = {
  low: 0.9,
  moderate: 1.0,
  high: 1.15,
};

/**
 * Breed size modifiers for puppies.
 * Large/giant breeds need LESS energy per kg to avoid developmental orthopedic disease (DOD).
 * Source: AAFCO "Growth — Large Size Dogs" profile; NRC 2006.
 */
const BREED_FACTOR: Record<PortionInputs['breedSize'], number> = {
  small: 1.0,
  medium: 1.0,
  large: 0.9,
  giant: 0.85,
};

const GOAL_FACTOR: Record<PortionInputs['weightGoal'], number> = {
  maintain: 1.0,
  lose: 0.85,
};

const FALLBACK_KCAL_PER_KG = 3800;

/**
 * Smooth age-based multiplier for daily energy requirement.
 * Based on the gradual curve from veterinary nutrition literature:
 *   2mo: 3.0, 3mo: 2.8, 4mo: 2.5, 5mo: 2.3, 6mo: 2.0,
 *   7mo: 1.9, 8mo: 1.8, 9mo: 1.7, 10-12mo: 1.6, >12mo: 1.4
 * Uses linear interpolation between monthly anchor points.
 * Source: Hand et al., Small Animal Clinical Nutrition 5th ed.; NRC 2006; PNA.
 */
function ageFactor(ageMonths: number): number {
  const anchors: [number, number][] = [
    [2, 3.0],
    [3, 2.8],
    [4, 2.5],
    [5, 2.3],
    [6, 2.0],
    [7, 1.9],
    [8, 1.8],
    [9, 1.7],
    [10, 1.6],
    [12, 1.6],
    [14, 1.4],
  ];

  if (ageMonths <= anchors[0][0]) return anchors[0][1];
  if (ageMonths >= anchors[anchors.length - 1][0]) return anchors[anchors.length - 1][1];

  for (let i = 0; i < anchors.length - 1; i++) {
    const [a0, v0] = anchors[i];
    const [a1, v1] = anchors[i + 1];
    if (ageMonths >= a0 && ageMonths <= a1) {
      const t = (ageMonths - a0) / (a1 - a0);
      return v0 + t * (v1 - v0);
    }
  }
  return anchors[anchors.length - 1][1];
}

export function calculateDailyPortion(inputs: PortionInputs, kcalPerKg?: number): PortionResult {
  const safeWeight = Math.max(0.5, inputs.weightKg);
  const rer = 70 * Math.pow(safeWeight, 0.75);

  // Neuter factor: less aggressive for puppies still growing
  const isPuppy = inputs.ageMonths < 12;
  const neuterFactor = inputs.neutered ? (isPuppy ? 0.9 : 0.8) : 1.0;

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
      'Based on NRC 2006 RER formula with age-graded multipliers from veterinary nutrition literature.',
      'Start conservative and adjust based on body condition.',
      `Uses kcal density ${density} kcal/kg${usedFallbackKcal ? ' (fallback — product calories missing)' : ''}.`,
      'Planning aid only — not veterinary advice.',
    ],
  };
}

export { ageFactor as _ageFactorForTesting };
