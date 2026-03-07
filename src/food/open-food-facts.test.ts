import { describe, expect, it } from 'vitest';
import { sanitizeOffString, parseIngredients, mapOffProductToFoodEntry } from './open-food-facts';

describe('sanitizeOffString', () => {
  it('trims whitespace', () => {
    expect(sanitizeOffString('  hello  ', 100)).toBe('hello');
  });

  it('strips HTML tags', () => {
    expect(sanitizeOffString('<b>bold</b> text <script>alert(1)</script>', 100)).toBe(
      'bold text alert(1)'
    );
  });

  it('caps string length', () => {
    expect(sanitizeOffString('abcdefghij', 5)).toBe('abcde');
  });

  it('returns empty string for non-string input', () => {
    expect(sanitizeOffString(undefined, 100)).toBe('');
    expect(sanitizeOffString(null, 100)).toBe('');
    expect(sanitizeOffString(42, 100)).toBe('');
  });

  it('handles img onerror XSS attempt', () => {
    expect(sanitizeOffString('<img src=x onerror=alert(1)>', 100)).toBe('');
  });
});

describe('parseIngredients', () => {
  it('splits on commas', () => {
    expect(parseIngredients('chicken, rice, corn')).toEqual(['chicken', 'rice', 'corn']);
  });

  it('strips parenthetical content before splitting', () => {
    expect(parseIngredients('chicken meal (preservatives: E300, E301), corn')).toEqual([
      'chicken meal',
      'corn',
    ]);
  });

  it('handles empty string', () => {
    expect(parseIngredients('')).toEqual([]);
  });

  it('trims whitespace from each ingredient', () => {
    expect(parseIngredients('  chicken  ,  rice  ')).toEqual(['chicken', 'rice']);
  });

  it('filters out empty segments', () => {
    expect(parseIngredients('chicken,,rice,')).toEqual(['chicken', 'rice']);
  });

  it('handles nested parentheses', () => {
    expect(parseIngredients('meat (beef (10%), pork), vegetables')).toEqual(['meat', 'vegetables']);
  });
});

describe('mapOffProductToFoodEntry', () => {
  it('maps a full OFF product correctly', () => {
    const product = {
      product_name: 'Premium Dog Kibble',
      brands: 'Good Dog Co',
      ingredients_text: 'chicken, rice, corn, fish oil',
      nutriments: {
        proteins_100g: 25,
        fat_100g: 15,
        fiber_100g: 3,
        'energy-kcal_100g': 350,
      },
      quantity: '12 kg',
    };
    const entry = mapOffProductToFoodEntry(product, '1234567890123');

    expect(entry.id).toBe('scan-1234567890123');
    expect(entry.productName).toBe('Premium Dog Kibble');
    expect(entry.brand).toBe('Good Dog Co');
    expect(entry.ingredients).toEqual(['chicken', 'rice', 'corn', 'fish oil']);
    expect(entry.guaranteedAnalysis.proteinMinPercent).toBe(25);
    expect(entry.guaranteedAnalysis.fatMinPercent).toBe(15);
    expect(entry.calories?.kcalPerKg).toBe(3500);
    expect(entry.sourceUrl).toBe('https://world.openfoodfacts.org/product/1234567890123');
    expect(entry.source).toBe('scan');
  });

  it('handles missing product name', () => {
    const entry = mapOffProductToFoodEntry({}, '0000000000000');
    expect(entry.productName).toBe('Product 0000000000000');
    expect(entry.brand).toBe('Unknown');
  });

  it('handles missing nutriments', () => {
    const entry = mapOffProductToFoodEntry({ product_name: 'Test' }, '1111111111111');
    expect(entry.guaranteedAnalysis.proteinMinPercent).toBe(0);
    expect(entry.calories).toBeUndefined();
  });

  it('sanitizes malicious HTML in product name', () => {
    const product = {
      product_name: '<script>alert("xss")</script>Dog Food',
    };
    const entry = mapOffProductToFoodEntry(product, '2222222222222');
    expect(entry.productName).toBe('alert("xss")Dog Food');
    expect(entry.productName).not.toContain('<script>');
  });

  it('handles empty ingredients text', () => {
    const product = {
      product_name: 'Mystery Food',
      ingredients_text: '',
    };
    const entry = mapOffProductToFoodEntry(product, '3333333333333');
    expect(entry.ingredients).toEqual([]);
  });

  it('constructs sourceUrl from barcode, not from product', () => {
    const product = {
      product_name: 'Test',
    };
    const entry = mapOffProductToFoodEntry(product, '4444444444444');
    expect(entry.sourceUrl).toBe('https://world.openfoodfacts.org/product/4444444444444');
  });
});
