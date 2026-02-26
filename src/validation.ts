/**
 * Validation: DOB, months, plan start, feeding fields.
 * Gate download until valid; URL still updates when invalid.
 */
export interface ValidationErrors {
  dob?: string;
  months?: string;
  start?: string;
  meals?: string;
  gramsStart?: string;
  gramsEnd?: string;
}

export interface ConfigLike {
  dob: string;
  months: number;
  start: string;
  feeding: boolean;
  meals: number;
  gramsStart: number;
  gramsEnd: number;
}

export function validate(config: ConfigLike): ValidationErrors {
  const err: ValidationErrors = {};

  const dob = config.dob?.trim();
  if (!dob) {
    err.dob = 'error_dob_required';
  } else {
    const d = new Date(dob + 'T12:00:00Z');
    if (isNaN(d.getTime())) err.dob = 'error_invalid_date';
    else if (d.getTime() > Date.now()) err.dob = 'error_dob_future';
  }

  const months = config.months;
  if (months < 1 || months > 12 || !Number.isInteger(months)) {
    err.months = 'error_months_max';
  }

  const start = config.start?.trim();
  if (!start) {
    err.start = 'error_plan_start_required';
  } else {
    const d = new Date(start + 'T12:00:00Z');
    if (isNaN(d.getTime())) err.start = 'error_invalid_date';
  }

  if (config.feeding) {
    if (config.meals < 1) err.meals = 'error_meals';
    if (config.gramsStart < 0) err.gramsStart = 'error_grams';
    if (config.gramsEnd < 0) err.gramsEnd = 'error_grams';
  }

  return err;
}

export function isValid(errors: ValidationErrors): boolean {
  return Object.keys(errors).length === 0;
}
