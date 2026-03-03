/**
 * Milestone detection and age formatting for share cards.
 */

import type { BreedSize } from './food/types';
import { estimateWeightFromAge } from './app-helpers';

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

/**
 * Compute age in whole weeks from DOB (minimum 1). Returns null if DOB is missing/invalid.
 */
export function dobToAgeWeeks(dob: string): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  const now = new Date();
  const diffMs = now.getTime() - birth.getTime();
  const weeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
  return Math.max(1, weeks);
}

/**
 * Format age as a human-readable string using the i18n translate function.
 * - Under 17 weeks: "{weeks} weeks old"
 * - 4-11 months: "{months} months old"
 * - 12+ months: "{years} year(s), {months} months old"
 * Returns null if DOB is missing/invalid.
 */
export function formatAge(dob: string, t: TranslateFn): string | null {
  const weeks = dobToAgeWeeks(dob);
  if (weeks === null) return null;

  if (weeks < 17) {
    return t('share_age_weeks', { weeks });
  }

  // Compute months from DOB
  const birth = new Date(dob);
  const now = new Date();
  const totalMonths =
    (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  const months = Math.max(1, totalMonths);

  if (months < 12) {
    return t('share_age_months', { months });
  }

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (remainingMonths === 0) {
    // Just show years as months
    return t('share_age_months', { months });
  }

  const key = years === 1 ? 'share_age_years_months' : 'share_age_years_months_plural';
  return t(key, { years, months: remainingMonths });
}

/**
 * Short age label without "old" suffix, for filenames and pills.
 * Returns null if DOB is missing.
 */
export function formatAgeShort(dob: string, t: TranslateFn): string | null {
  const weeks = dobToAgeWeeks(dob);
  if (weeks === null) return null;

  if (weeks < 17) {
    return t('share_age_weeks_short', { weeks });
  }

  const birth = new Date(dob);
  const now = new Date();
  const totalMonths =
    (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  const months = Math.max(1, totalMonths);

  return t('share_age_months_short', { months });
}

/**
 * Returns the milestone weight (5, 10, 15, ...) if the dog's weight is within 0.5kg, else null.
 */
export function getWeightMilestone(weightKg: number): number | null {
  const milestones = [5, 10, 15, 20, 25, 30];
  for (const m of milestones) {
    if (Math.abs(weightKg - m) <= 0.5) return m;
  }
  return null;
}

/**
 * Compare current weight against breed-typical expected weight and return a label.
 * Returns null if age or breed data is missing.
 */
export function getBreedComparison(
  ageMonths: number | null,
  weightKg: number,
  breedSize: BreedSize,
  breedLabel: string,
  t: TranslateFn
): string | null {
  if (!ageMonths || !breedLabel || breedLabel === '\u2014') return null;

  const expected = estimateWeightFromAge(ageMonths, breedSize);
  if (expected <= 0) return null;

  const ratio = weightKg / expected;

  if (ratio > 1.15) {
    return t('share_breed_growing_fast');
  }
  if (ratio < 0.85) {
    return t('share_breed_lightweight');
  }
  return t('share_breed_on_track', { breed: breedLabel });
}
