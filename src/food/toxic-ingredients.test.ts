import { describe, expect, it } from 'vitest';
import { checkIngredientSafety } from './toxic-ingredients';

describe('checkIngredientSafety', () => {
  it('returns data-unavailable for empty ingredients', () => {
    const result = checkIngredientSafety([]);
    expect(result.verdict).toBe('data-unavailable');
    expect(result.matches).toEqual([]);
  });

  it('returns incomplete for fewer than 3 ingredients with no matches', () => {
    const result = checkIngredientSafety(['chicken', 'rice']);
    expect(result.verdict).toBe('incomplete');
    expect(result.matches).toEqual([]);
  });

  it('returns safe for normal dog food ingredients', () => {
    const result = checkIngredientSafety([
      'chicken meal',
      'brown rice',
      'oatmeal',
      'barley',
      'chicken fat',
      'dried beet pulp',
      'fish oil',
    ]);
    expect(result.verdict).toBe('safe');
    expect(result.matches).toEqual([]);
  });

  it('detects danger-level ingredient (xylitol)', () => {
    const result = checkIngredientSafety(['peanut butter', 'xylitol', 'sugar', 'salt']);
    expect(result.verdict).toBe('danger');
    expect(result.matches).toHaveLength(1);
    expect(result.matches[0].matched.name).toBe('Xylitol');
  });

  it('detects chocolate/cocoa variants', () => {
    const result = checkIngredientSafety(['sugar', 'cocoa powder', 'milk', 'vanilla']);
    expect(result.verdict).toBe('danger');
    expect(result.matches[0].matched.name).toBe('Chocolate / Cocoa');
  });

  it('is case-insensitive', () => {
    const result = checkIngredientSafety(['CHICKEN', 'Garlic Powder', 'RICE', 'corn']);
    expect(result.verdict).toBe('warning');
    expect(result.matches).toHaveLength(1);
    expect(result.matches[0].matched.name).toBe('Garlic');
  });

  it('matches substrings (garlic powder, onion extract)', () => {
    const result = checkIngredientSafety(['chicken', 'rice', 'onion extract', 'corn']);
    expect(result.verdict).toBe('warning');
    expect(result.matches[0].matched.name).toBe('Onion');
  });

  it('does not false positive on safe ingredients', () => {
    const safe = [
      'chicken',
      'salmon',
      'sweet potato',
      'peas',
      'carrots',
      'blueberries',
      'flaxseed',
      'coconut oil',
      'turmeric',
      'rosemary extract',
    ];
    const result = checkIngredientSafety(safe);
    expect(result.verdict).toBe('safe');
    expect(result.matches).toEqual([]);
  });

  it('returns danger over warning when both are present', () => {
    const result = checkIngredientSafety(['garlic', 'chocolate chips', 'flour', 'sugar']);
    expect(result.verdict).toBe('danger');
    expect(result.matches).toHaveLength(2);
  });

  it('detects caution-level ingredients', () => {
    const result = checkIngredientSafety(['chicken meal', 'corn', 'BHA', 'rice']);
    expect(result.verdict).toBe('warning');
    expect(result.matches).toHaveLength(1);
    expect(result.matches[0].matched.severity).toBe('caution');
  });

  it('still checks sparse ingredients and flags matches', () => {
    const result = checkIngredientSafety(['xylitol', 'sugar']);
    expect(result.verdict).toBe('danger');
    expect(result.matches).toHaveLength(1);
  });

  it('handles whitespace in ingredients', () => {
    const result = checkIngredientSafety(['  chicken  ', ' garlic  powder ', 'rice', 'corn']);
    expect(result.verdict).toBe('warning');
    expect(result.matches).toHaveLength(1);
  });
});
