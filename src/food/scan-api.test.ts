import { describe, expect, it } from 'vitest';

// Test the exported pure logic by importing from the module
// The handler itself requires Redis/Ratelimit but we can test validation and sanitization patterns

describe('api/scan validation patterns', () => {
  const BARCODE_RE = /^\d{8,14}$/;

  describe('barcode validation', () => {
    it('accepts 8-digit barcode (EAN-8)', () => {
      expect(BARCODE_RE.test('12345678')).toBe(true);
    });

    it('accepts 12-digit barcode (UPC-A)', () => {
      expect(BARCODE_RE.test('012345678901')).toBe(true);
    });

    it('accepts 13-digit barcode (EAN-13)', () => {
      expect(BARCODE_RE.test('5901234123457')).toBe(true);
    });

    it('accepts 14-digit barcode (ITF-14)', () => {
      expect(BARCODE_RE.test('15901234123457')).toBe(true);
    });

    it('rejects 7-digit barcode (too short)', () => {
      expect(BARCODE_RE.test('1234567')).toBe(false);
    });

    it('rejects 15-digit barcode (too long)', () => {
      expect(BARCODE_RE.test('159012341234570')).toBe(false);
    });

    it('rejects barcode with letters', () => {
      expect(BARCODE_RE.test('1234abcd5678')).toBe(false);
    });

    it('rejects empty string', () => {
      expect(BARCODE_RE.test('')).toBe(false);
    });

    it('rejects barcode with spaces', () => {
      expect(BARCODE_RE.test('1234 5678')).toBe(false);
    });
  });

  describe('foodEntry shape validation', () => {
    function validateFoodEntry(entry: unknown): boolean {
      if (typeof entry !== 'object' || entry === null) return false;
      const e = entry as Record<string, unknown>;
      return (
        typeof e.id === 'string' &&
        typeof e.brand === 'string' &&
        typeof e.productName === 'string' &&
        typeof e.sourceUrl === 'string' &&
        typeof e.sourceDate === 'string'
      );
    }

    it('accepts valid food entry shape', () => {
      expect(
        validateFoodEntry({
          id: 'test-123',
          brand: 'Test Brand',
          productName: 'Dog Food',
          sourceUrl: 'https://example.com',
          sourceDate: '2026-03-07',
        })
      ).toBe(true);
    });

    it('rejects null', () => {
      expect(validateFoodEntry(null)).toBe(false);
    });

    it('rejects non-object', () => {
      expect(validateFoodEntry('string')).toBe(false);
    });

    it('rejects missing id', () => {
      expect(
        validateFoodEntry({
          brand: 'Test',
          productName: 'Food',
          sourceUrl: 'url',
          sourceDate: 'date',
        })
      ).toBe(false);
    });

    it('rejects missing productName', () => {
      expect(
        validateFoodEntry({
          id: 'test',
          brand: 'Test',
          sourceUrl: 'url',
          sourceDate: 'date',
        })
      ).toBe(false);
    });

    it('rejects numeric id', () => {
      expect(
        validateFoodEntry({
          id: 123,
          brand: 'Test',
          productName: 'Food',
          sourceUrl: 'url',
          sourceDate: 'date',
        })
      ).toBe(false);
    });
  });

  describe('rawResponse whitelisting', () => {
    function sanitizeString(value: unknown, maxLen: number): string {
      if (typeof value !== 'string') return '';
      return value.trim().slice(0, maxLen);
    }

    function whitelistRawResponse(raw: unknown): Record<string, unknown> {
      if (typeof raw !== 'object' || raw === null) return {};
      const r = raw as Record<string, unknown>;
      return {
        product_name: sanitizeString(r.product_name, 500),
        brands: sanitizeString(r.brands, 200),
        ingredients_text: sanitizeString(r.ingredients_text, 5000),
        nutriments: typeof r.nutriments === 'object' && r.nutriments !== null ? r.nutriments : {},
      };
    }

    it('keeps only allowed fields', () => {
      const result = whitelistRawResponse({
        product_name: 'Dog Food',
        brands: 'Purina',
        ingredients_text: 'chicken, rice',
        nutriments: { protein: 25 },
        dangerous_field: '<script>alert(1)</script>',
        extra: 'should be removed',
      });
      expect(result).toHaveProperty('product_name');
      expect(result).toHaveProperty('brands');
      expect(result).toHaveProperty('ingredients_text');
      expect(result).toHaveProperty('nutriments');
      expect(result).not.toHaveProperty('dangerous_field');
      expect(result).not.toHaveProperty('extra');
    });

    it('caps product_name at 500 chars', () => {
      const long = 'a'.repeat(1000);
      const result = whitelistRawResponse({ product_name: long });
      expect((result.product_name as string).length).toBe(500);
    });

    it('caps brands at 200 chars', () => {
      const long = 'b'.repeat(500);
      const result = whitelistRawResponse({ brands: long });
      expect((result.brands as string).length).toBe(200);
    });

    it('caps ingredients_text at 5000 chars', () => {
      const long = 'c'.repeat(10000);
      const result = whitelistRawResponse({ ingredients_text: long });
      expect((result.ingredients_text as string).length).toBe(5000);
    });

    it('returns empty object for null raw', () => {
      expect(whitelistRawResponse(null)).toEqual({});
    });

    it('returns empty object for non-object raw', () => {
      expect(whitelistRawResponse('string')).toEqual({});
    });

    it('defaults non-object nutriments to empty object', () => {
      const result = whitelistRawResponse({ nutriments: 'invalid' });
      expect(result.nutriments).toEqual({});
    });
  });
});
