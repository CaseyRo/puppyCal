import type { FoodEntry, FoodType, GuaranteedAnalysis } from './types';

const OFF_API_BASE = 'https://world.openfoodfacts.org/api/v2/product';

export interface OffProduct {
  product_name?: string;
  brands?: string;
  ingredients_text?: string;
  nutriments?: Record<string, unknown>;
  quantity?: string;
  categories?: string;
}

export interface OffLookupResult {
  found: boolean;
  product?: OffProduct;
}

export async function lookupBarcode(barcode: string): Promise<OffLookupResult> {
  const response = await fetch(`${OFF_API_BASE}/${barcode}.json`, {
    headers: { 'User-Agent': 'PuppyCal/1.0 (https://github.com/puppycal)' },
  });

  if (!response.ok) {
    throw new Error(`Open Food Facts API returned ${response.status}`);
  }

  const data = (await response.json()) as { status: number; product?: OffProduct };

  if (data.status !== 1 || !data.product) {
    return { found: false };
  }

  return { found: true, product: data.product };
}

export function sanitizeOffString(value: unknown, maxLen: number): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/<[^>]*>/g, '') // strip HTML tags
    .trim()
    .slice(0, maxLen);
}

export function parseIngredients(ingredientsText: string): string[] {
  if (!ingredientsText.trim()) return [];

  // Strip parenthetical content (including nested) before splitting
  let stripped = ingredientsText;
  let prev = '';
  while (stripped !== prev) {
    prev = stripped;
    stripped = stripped.replace(/\([^()]*\)/g, '');
  }

  return stripped
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function mapNutriments(nutriments: Record<string, unknown>): GuaranteedAnalysis | undefined {
  const protein = Number(nutriments.proteins_100g);
  const fat = Number(nutriments.fat_100g);
  const fiber = Number(nutriments.fiber_100g);
  const moisture = Number(nutriments['water-content_100g']);

  // Only return if we have at least protein and fat
  if (!Number.isFinite(protein) || protein <= 0 || !Number.isFinite(fat) || fat <= 0) {
    return undefined;
  }

  return {
    proteinMinPercent: protein,
    fatMinPercent: fat,
    fiberMaxPercent: Number.isFinite(fiber) && fiber >= 0 ? fiber : 0,
    moistureMaxPercent: Number.isFinite(moisture) && moisture > 0 ? moisture : 12, // default 12% for dry food
  };
}

function inferFoodType(product: OffProduct): FoodType {
  const cats = (product.categories ?? '').toLowerCase();
  if (cats.includes('wet') || cats.includes('canned') || cats.includes('pate')) {
    return 'wet';
  }
  return 'dry';
}

export function mapOffProductToFoodEntry(product: OffProduct, barcode: string): FoodEntry {
  const productName = sanitizeOffString(product.product_name, 500);
  const brand = sanitizeOffString(product.brands, 200);
  const ingredientsText = sanitizeOffString(product.ingredients_text, 5000);
  const ingredients = parseIngredients(ingredientsText);
  const guaranteedAnalysis = product.nutriments ? mapNutriments(product.nutriments) : undefined;

  const kcalPer100g = product.nutriments
    ? Number(product.nutriments['energy-kcal_100g'])
    : undefined;

  return {
    id: `scan-${barcode}`,
    supplier: brand || 'Unknown',
    brand: brand || 'Unknown',
    productName: productName || `Product ${barcode}`,
    isPuppy: false,
    lifeStage: '',
    breedSizeTarget: '',
    foodType: inferFoodType(product),
    packageSize: sanitizeOffString(product.quantity, 200),
    ingredients,
    guaranteedAnalysis: guaranteedAnalysis ?? {
      proteinMinPercent: 0,
      fatMinPercent: 0,
      fiberMaxPercent: 0,
      moistureMaxPercent: 0,
    },
    feedingGuide: { reference: '' },
    calories:
      kcalPer100g && Number.isFinite(kcalPer100g) && kcalPer100g > 0
        ? { kcalPerKg: kcalPer100g * 10 }
        : undefined,
    sourceUrl: `https://world.openfoodfacts.org/product/${barcode}`,
    sourceDate: new Date().toISOString().slice(0, 10),
    source: 'scan',
  } as FoodEntry;
}
