import purina from '../data/foods/purina.json';
import royalCanin from '../data/foods/royal-canin.json';
import kivo from '../data/foods/kivo.json';
import { validateFoodEntry } from './schema';
import type { FoodEntry } from './types';
import { getScannedFoods, hasCompleteNutrition } from './scan-storage';

const RAW_SUPPLIER_DATA: Record<string, FoodEntry[]> = {
  purina: purina as FoodEntry[],
  'royal-canin': royalCanin as FoodEntry[],
  kivo: kivo as FoodEntry[],
};

export interface CatalogValidationResult {
  entries: FoodEntry[];
  errors: string[];
}

export function getSupplierCatalog(): Record<string, FoodEntry[]> {
  return RAW_SUPPLIER_DATA;
}

function getCuratedFoods(): FoodEntry[] {
  return Object.values(RAW_SUPPLIER_DATA).flat();
}

export function getAllFoods(): FoodEntry[] {
  const curated = getCuratedFoods();
  const scanned = getScannedFoods();

  // Deduplicate: curated entries take precedence
  const curatedNames = new Set(curated.map((f) => f.productName.toLowerCase()));
  const curatedIds = new Set(curated.map((f) => f.id));
  const unique = scanned.filter(
    (s) => !curatedIds.has(s.id) && !curatedNames.has(s.productName.toLowerCase())
  );

  return [...curated, ...unique];
}

export function getFoodsForPortionPlanner(): FoodEntry[] {
  return getAllFoods().filter((f) => f.source !== 'scan' || hasCompleteNutrition(f));
}

export function validateCatalog(): CatalogValidationResult {
  const entries = getAllFoods();
  const errors: string[] = [];

  entries.forEach((entry) => {
    const entryErrors = validateFoodEntry(entry);
    entryErrors.forEach((err) => errors.push(`${entry.id}: ${err}`));
  });

  return { entries, errors };
}

export function findFoodById(id: string): FoodEntry | undefined {
  return getAllFoods().find((item) => item.id === id);
}

export { getCuratedFoods };
