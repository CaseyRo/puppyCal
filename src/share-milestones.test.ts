import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  dobToAgeWeeks,
  formatAge,
  formatAgeShort,
  getWeightMilestone,
  getBreedComparison,
} from './share-milestones';

const t = (key: string, params: Record<string, string | number> = {}): string => {
  const base: Record<string, string> = {
    share_age_weeks: `${params.weeks} weeks old`,
    share_age_months: `${params.months} months old`,
    share_age_years_months: `${params.years} year, ${params.months} months old`,
    share_age_years_months_plural: `${params.years} years, ${params.months} months old`,
    share_age_weeks_short: `${params.weeks} weeks`,
    share_age_months_short: `${params.months} months`,
    share_breed_on_track: `Right on track for a ${params.breed}`,
    share_breed_growing_fast: 'Growing fast!',
    share_breed_lightweight: 'A little lightweight — perfectly healthy',
  };
  return base[key] ?? key;
};

describe('dobToAgeWeeks', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null for empty DOB', () => {
    expect(dobToAgeWeeks('')).toBeNull();
  });

  it('returns null for invalid DOB', () => {
    expect(dobToAgeWeeks('not-a-date')).toBeNull();
  });

  it('returns minimum 1 for very recent DOB', () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(dobToAgeWeeks(today)).toBe(1);
  });

  it('computes correct weeks', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-03'));
    // 8 weeks ago = 2026-01-06
    expect(dobToAgeWeeks('2026-01-06')).toBe(8);
  });
});

describe('formatAge', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null for empty DOB', () => {
    expect(formatAge('', t)).toBeNull();
  });

  it('returns weeks for puppy under 17 weeks', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-03'));
    // 10 weeks ago = 2025-12-23
    const result = formatAge('2025-12-23', t);
    expect(result).toBe('10 weeks old');
  });

  it('returns months for 4-11 month old', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-03'));
    // Born 6 months ago = 2025-09-03
    const result = formatAge('2025-09-03', t);
    expect(result).toBe('6 months old');
  });
});

describe('formatAgeShort', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null for empty DOB', () => {
    expect(formatAgeShort('', t)).toBeNull();
  });

  it('returns weeks short for young puppy', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-03'));
    const result = formatAgeShort('2025-12-23', t);
    expect(result).toBe('10 weeks');
  });

  it('returns months short for older puppy', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-03'));
    const result = formatAgeShort('2025-09-03', t);
    expect(result).toBe('6 months');
  });
});

describe('getWeightMilestone', () => {
  it('returns 5 for 4.8kg', () => {
    expect(getWeightMilestone(4.8)).toBe(5);
  });

  it('returns 10 for 10.3kg', () => {
    expect(getWeightMilestone(10.3)).toBe(10);
  });

  it('returns null for 7kg (not near any milestone)', () => {
    expect(getWeightMilestone(7)).toBeNull();
  });

  it('returns 5 for exactly 5kg', () => {
    expect(getWeightMilestone(5)).toBe(5);
  });

  it('returns null for 5.6kg (outside 0.5 threshold)', () => {
    expect(getWeightMilestone(5.6)).toBeNull();
  });

  it('returns 30 for 29.8kg', () => {
    expect(getWeightMilestone(29.8)).toBe(30);
  });

  it('returns null for 35kg (beyond milestones)', () => {
    expect(getWeightMilestone(35)).toBeNull();
  });
});

describe('getBreedComparison', () => {
  it('returns null for missing age', () => {
    expect(getBreedComparison(null, 10, 'medium', 'Stabyhoun', t)).toBeNull();
  });

  it('returns null for missing breed label', () => {
    expect(getBreedComparison(4, 10, 'medium', '', t)).toBeNull();
  });

  it('returns null for dash breed label', () => {
    expect(getBreedComparison(4, 10, 'medium', '\u2014', t)).toBeNull();
  });

  it('returns on-track for normal weight', () => {
    // 4 months medium = ~7kg expected, 7kg actual = 1.0 ratio
    const result = getBreedComparison(4, 7, 'medium', 'Stabyhoun', t);
    expect(result).toBe('Right on track for a Stabyhoun');
  });

  it('returns growing fast for heavy puppy', () => {
    // 4 months medium = ~7kg expected, 12kg actual = 1.7 ratio
    const result = getBreedComparison(4, 12, 'medium', 'Stabyhoun', t);
    expect(result).toBe('Growing fast!');
  });

  it('returns lightweight for underweight puppy', () => {
    // 4 months medium = ~7kg expected, 3kg actual = 0.43 ratio
    const result = getBreedComparison(4, 3, 'medium', 'Stabyhoun', t);
    expect(result).toBe('A little lightweight — perfectly healthy');
  });
});
