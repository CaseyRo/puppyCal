import { describe, expect, it } from 'vitest';
import { findFoodById, getAllFoods, validateCatalog } from './catalog';

describe('food catalog', () => {
  it('contains the canonical Purina medium puppy chicken entry', () => {
    const entry = findFoodById('purina-pro-plan-medium-puppy-chicken');
    expect(entry).toBeDefined();
    expect(entry?.brand).toContain('Purina');
  });

  it('catalog entries pass schema validation', () => {
    const result = validateCatalog();
    expect(result.entries.length).toBeGreaterThan(0);
    expect(result.errors).toEqual([]);
  });

  it('includes more than one supplier entry', () => {
    const suppliers = new Set(getAllFoods().map((food) => food.supplier));
    expect(suppliers.size).toBeGreaterThan(1);
  });
});
