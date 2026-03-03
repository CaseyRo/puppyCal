import { describe, expect, it } from 'vitest';
import { getBirthdayContext } from './share-birthday';

describe('getBirthdayContext', () => {
  it('returns null for empty DOB', () => {
    expect(getBirthdayContext('')).toBeNull();
  });

  it('returns null for invalid DOB', () => {
    expect(getBirthdayContext('not-a-date')).toBeNull();
  });

  it('returns today context on exact birthday', () => {
    const now = new Date(2026, 2, 3); // March 3, 2026
    const result = getBirthdayContext('2025-03-03', now);
    expect(result).toEqual({ type: 'today', age: 1, daysSince: 0 });
  });

  it('returns week context 1 day after birthday', () => {
    const now = new Date(2026, 2, 4); // March 4
    const result = getBirthdayContext('2025-03-03', now);
    expect(result).toEqual({ type: 'week', age: 1, daysSince: 1 });
  });

  it('returns week context 7 days after birthday', () => {
    const now = new Date(2026, 2, 10); // March 10
    const result = getBirthdayContext('2025-03-03', now);
    expect(result).toEqual({ type: 'week', age: 1, daysSince: 7 });
  });

  it('returns null 8 days after birthday', () => {
    const now = new Date(2026, 2, 11); // March 11
    const result = getBirthdayContext('2025-03-03', now);
    expect(result).toBeNull();
  });

  it('returns null before birthday', () => {
    const now = new Date(2026, 2, 2); // March 2
    const result = getBirthdayContext('2025-03-03', now);
    expect(result).toBeNull();
  });

  it('handles year boundary (Dec birthday, early Jan check)', () => {
    const now = new Date(2027, 0, 3); // Jan 3, 2027
    const result = getBirthdayContext('2025-12-29', now);
    // 5 days after Dec 29, 2026 birthday. Age = 2026-2025 = 1 (turning 1 in 2026)
    // But the code computes: age = currentYear - 1 - birthYear = 2027-1-2025 = 1
    expect(result).toEqual({ type: 'week', age: 1, daysSince: 5 });
  });

  it('calculates correct age for multi-year', () => {
    const now = new Date(2028, 2, 3); // March 3, 2028
    const result = getBirthdayContext('2025-03-03', now);
    expect(result).toEqual({ type: 'today', age: 3, daysSince: 0 });
  });

  it('handles leap year birthday on leap year', () => {
    // Feb 29 birthday checked on Feb 29 of a leap year
    const now = new Date(2028, 1, 29); // Feb 29, 2028 (leap year)
    const result = getBirthdayContext('2024-02-29', now);
    expect(result).toEqual({ type: 'today', age: 4, daysSince: 0 });
  });
});
