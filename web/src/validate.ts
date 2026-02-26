/**
 * Validation: DOB, months, start, feeding fields. Returns error messages keyed by field.
 */

import type { Config } from './config';

export interface ValidationErrors {
  dob?: string;
  months?: string;
  start?: string;
  meals?: string;
  gramsStart?: string;
  gramsEnd?: string;
}

function parseDate(s: string): Date | null {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function todayStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function validate(config: Config): ValidationErrors {
  const err: ValidationErrors = {};

  if (config.dob.trim() === '') {
    err.dob = 'Required';
    return err;
  }
  const dobDate = parseDate(config.dob);
  if (!dobDate) {
    err.dob = 'Invalid date';
    return err;
  }
  if (dobDate > todayStart()) {
    err.dob = 'error_dob_future'; // i18n key
    return err;
  }

  const months = config.months;
  if (!Number.isInteger(months) || months < 1 || months > 3) {
    err.months = 'error_months_max'; // i18n key
  }

  if (config.start.trim() === '') {
    err.start = 'error_plan_start';
  } else if (!parseDate(config.start)) {
    err.start = 'error_plan_start';
  }

  if (config.feeding) {
    if (!Number.isInteger(config.meals) || config.meals < 1) {
      err.meals = 'error_meals';
    }
    if (Number.isNaN(config.gramsStart) || config.gramsStart < 0) {
      err.gramsStart = 'error_grams';
    }
    if (Number.isNaN(config.gramsEnd) || config.gramsEnd < 0) {
      err.gramsEnd = 'error_grams';
    }
  }

  return err;
}

export function isValid(config: Config): boolean {
  return Object.keys(validate(config)).length === 0;
}
