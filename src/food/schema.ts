import type { FoodEntry } from './types';

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

function isPositiveNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v > 0;
}

function isNonNegativeNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0;
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(parsed.getTime());
}

export function validateFoodEntry(entry: FoodEntry): string[] {
  const errors: string[] = [];

  if (!isNonEmptyString(entry.id)) errors.push('id is required');
  if (!isNonEmptyString(entry.supplier)) errors.push('supplier is required');
  if (!isNonEmptyString(entry.brand)) errors.push('brand is required');
  if (!isNonEmptyString(entry.productName)) errors.push('productName is required');
  if (typeof entry.isPuppy !== 'boolean') errors.push('isPuppy must be boolean');
  if (!isNonEmptyString(entry.lifeStage)) errors.push('lifeStage is required');
  if (!isNonEmptyString(entry.breedSizeTarget)) errors.push('breedSizeTarget is required');
  if (entry.foodType !== 'dry' && entry.foodType !== 'wet') {
    errors.push('foodType must be dry or wet');
  }
  if (!isNonEmptyString(entry.packageSize)) errors.push('packageSize is required');
  if (!Array.isArray(entry.ingredients) || entry.ingredients.length === 0) {
    errors.push('ingredients must contain at least one item');
  }
  if (!entry.guaranteedAnalysis) {
    errors.push('guaranteedAnalysis is required');
  } else {
    if (!isPositiveNumber(entry.guaranteedAnalysis.proteinMinPercent)) {
      errors.push('guaranteedAnalysis.proteinMinPercent must be > 0');
    }
    if (!isPositiveNumber(entry.guaranteedAnalysis.fatMinPercent)) {
      errors.push('guaranteedAnalysis.fatMinPercent must be > 0');
    }
    if (!isNonNegativeNumber(entry.guaranteedAnalysis.fiberMaxPercent)) {
      errors.push('guaranteedAnalysis.fiberMaxPercent must be >= 0');
    }
    if (!isPositiveNumber(entry.guaranteedAnalysis.moistureMaxPercent)) {
      errors.push('guaranteedAnalysis.moistureMaxPercent must be > 0');
    }
  }

  if (!entry.feedingGuide || !isNonEmptyString(entry.feedingGuide.reference)) {
    errors.push('feedingGuide.reference is required');
  }

  // Required by design/spec: source traceability is mandatory.
  if (!isNonEmptyString(entry.sourceUrl)) errors.push('sourceUrl is required');
  if (!isNonEmptyString(entry.sourceDate)) {
    errors.push('sourceDate is required');
  } else if (!isIsoDate(entry.sourceDate)) {
    errors.push('sourceDate must be YYYY-MM-DD');
  }

  // Calories are optional in v1; validate only when provided.
  if (entry.calories) {
    if (entry.calories.kcalPerKg !== undefined && !isPositiveNumber(entry.calories.kcalPerKg)) {
      errors.push('calories.kcalPerKg must be > 0 when present');
    }
    if (entry.calories.kcalPerCup !== undefined && !isPositiveNumber(entry.calories.kcalPerCup)) {
      errors.push('calories.kcalPerCup must be > 0 when present');
    }
  }

  return errors;
}
