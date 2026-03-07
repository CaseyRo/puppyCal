import type { FoodEntry } from './types';

const STORAGE_KEY = 'puppycal_scanned_foods';

export function getScannedFoods(): FoodEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveScannedFood(entry: FoodEntry): void {
  const existing = getScannedFoods();
  // Deduplicate by id
  const filtered = existing.filter((e) => e.id !== entry.id);
  filtered.push(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function removeScannedFood(id: string): void {
  const existing = getScannedFoods();
  const filtered = existing.filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function hasCompleteNutrition(entry: FoodEntry): boolean {
  if (!entry.guaranteedAnalysis) return false;
  return (
    entry.guaranteedAnalysis.proteinMinPercent > 0 && entry.guaranteedAnalysis.fatMinPercent > 0
  );
}
