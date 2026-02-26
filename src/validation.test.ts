import { describe, expect, it } from 'vitest';
import { validate } from './validation';

describe('validation messages', () => {
  it('returns i18n keys and allows 12 month plans', () => {
    const err = validate({
      dob: '',
      months: 12,
      start: '',
      feeding: true,
      meals: 0,
      gramsStart: -1,
      gramsEnd: -1,
    });

    expect(err.dob).toBe('error_dob_required');
    expect(err.start).toBe('error_plan_start_required');
    expect(err.months).toBeUndefined();
    expect(err.meals).toBe('error_meals');
    expect(err.gramsStart).toBe('error_grams');
  });

  it('rejects months above twelve', () => {
    const err = validate({
      dob: '2025-01-01',
      months: 13,
      start: '2025-02-01',
      feeding: false,
      meals: 3,
      gramsStart: 200,
      gramsEnd: 250,
    });
    expect(err.months).toBe('error_months_max');
  });
});
