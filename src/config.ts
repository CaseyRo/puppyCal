/**
 * App config: single source of truth from URL.
 * Defaults: lang=nl, months=3, start=today, birthday=on; no default for DOB.
 */
import type { ActivityLevel, BreedSize, WeightGoal } from './food/types';

export interface Config {
  lang: string;
  dob: string;
  months: number;
  start: string;
  birthday: boolean;
  name: string;
  notes: string;
  feeding: boolean;
  meals: number;
  gramsStart: number;
  gramsEnd: number;
}

export type PlannerTab = 'walkies' | 'food';

export interface FoodPlannerState {
  selectedSupplier: string;
  selectedFoodId: string;
  ageMonths: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  neutered: boolean;
  breedSize: BreedSize;
  weightGoal: WeightGoal;
}

export interface PlannerState {
  config: Config;
  food: FoodPlannerState;
  activeTab: PlannerTab;
}

export interface PlannerParseResult {
  state: PlannerState;
  hadCorrections: boolean;
}

const today = (): string => {
  const d = new Date();
  return d.toISOString().slice(0, 10);
};

const DEFAULT_CONFIG: Config = {
  lang: 'nl',
  dob: '',
  months: 3,
  start: today(),
  birthday: true,
  name: '',
  notes: '',
  feeding: false,
  meals: 3,
  gramsStart: 200,
  gramsEnd: 280,
};

export function getDefaults(): Config {
  return { ...DEFAULT_CONFIG, start: today() };
}

function parseBoolean(
  value: string | null,
  defaultValue: boolean,
  markCorrection: () => void
): boolean {
  if (value === null || value === '') return defaultValue;
  if (value === '1' || value === 'true' || value === 'on') return true;
  if (value === '0' || value === 'false' || value === 'off') return false;
  markCorrection();
  return defaultValue;
}

function parseInteger(
  value: string | null,
  fallback: number,
  min: number,
  max: number,
  markCorrection: () => void
): number {
  if (value === null) return fallback;
  const parsed = parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    markCorrection();
    return fallback;
  }
  if (parsed < min || parsed > max) {
    markCorrection();
    return fallback;
  }
  return parsed;
}

function parseFloatInRange(
  value: string | null,
  fallback: number,
  min: number,
  max: number,
  markCorrection: () => void
): number {
  if (value === null) return fallback;
  const parsed = parseFloat(value);
  if (!Number.isFinite(parsed)) {
    markCorrection();
    return fallback;
  }
  if (parsed < min || parsed > max) {
    markCorrection();
    return fallback;
  }
  return parsed;
}

function parseConfigWithCorrections(search: string): { config: Config; hadCorrections: boolean } {
  const params = new URLSearchParams(search);
  const defaults = getDefaults();
  let hadCorrections = false;
  const markCorrection = (): void => {
    hadCorrections = true;
  };

  const lang = params.get('lang') ?? defaults.lang;
  if (lang !== 'en' && lang !== 'nl' && params.has('lang')) markCorrection();
  const months = parseInteger(params.get('months'), defaults.months, 1, 12, markCorrection);
  const start = params.get('start') ?? defaults.start;
  const birthday = parseBoolean(params.get('birthday'), defaults.birthday, markCorrection);
  const feeding = parseBoolean(params.get('feeding'), defaults.feeding, markCorrection);
  const meals = parseInteger(params.get('meals'), defaults.meals, 1, 20, markCorrection);
  const gramsStart = parseFloatInRange(
    params.get('gramsStart'),
    defaults.gramsStart,
    0,
    5000,
    markCorrection
  );
  const gramsEnd = parseFloatInRange(
    params.get('gramsEnd'),
    defaults.gramsEnd,
    0,
    5000,
    markCorrection
  );

  return {
    config: {
      lang: lang === 'en' || lang === 'nl' ? lang : defaults.lang,
      dob: params.get('dob') ?? '',
      months,
      start,
      birthday,
      name: params.get('name') ?? '',
      notes: params.get('notes') ?? '',
      feeding,
      meals,
      gramsStart,
      gramsEnd,
    },
    hadCorrections,
  };
}

export function parseConfigFromSearch(search: string): Config {
  return parseConfigWithCorrections(search).config;
}

export function parsePlannerStateFromSearch(
  search: string,
  defaultFoodState: FoodPlannerState
): PlannerParseResult {
  // Normalize all incoming URL values before app state hydration:
  // dates/booleans/enums/numbers are validated and invalid values fall back safely.
  const params = new URLSearchParams(search);
  const parsedConfig = parseConfigWithCorrections(search);
  let hadCorrections = parsedConfig.hadCorrections;
  const markCorrection = (): void => {
    hadCorrections = true;
  };

  const tabParam = params.get('tab');
  const activeTab: PlannerTab =
    tabParam === null
      ? 'walkies'
      : tabParam === 'food' || tabParam === 'walkies'
        ? tabParam
        : (markCorrection(), 'walkies');

  const selectedSupplier =
    params.get('foodSupplier') && params.get('foodSupplier')?.trim()
      ? (params.get('foodSupplier') as string)
      : defaultFoodState.selectedSupplier;
  if (params.has('foodSupplier') && !params.get('foodSupplier')?.trim()) markCorrection();

  const selectedFoodId =
    params.get('foodId') && params.get('foodId')?.trim()
      ? (params.get('foodId') as string)
      : defaultFoodState.selectedFoodId;
  if (params.has('foodId') && !params.get('foodId')?.trim()) markCorrection();

  const ageMonths = parseInteger(
    params.get('foodAge'),
    defaultFoodState.ageMonths,
    1,
    240,
    markCorrection
  );
  const weightKg = parseFloatInRange(
    params.get('foodWeight'),
    defaultFoodState.weightKg,
    0.5,
    80,
    markCorrection
  );

  const activityParam = params.get('foodActivity');
  const activityLevel: ActivityLevel =
    activityParam === null
      ? defaultFoodState.activityLevel
      : activityParam === 'low' || activityParam === 'moderate' || activityParam === 'high'
        ? activityParam
        : (markCorrection(), defaultFoodState.activityLevel);

  const neutered = parseBoolean(
    params.get('foodNeutered'),
    defaultFoodState.neutered,
    markCorrection
  );

  const breedParam = params.get('foodBreed');
  const breedSize: BreedSize =
    breedParam === null
      ? defaultFoodState.breedSize
      : breedParam === 'small' ||
          breedParam === 'medium' ||
          breedParam === 'large' ||
          breedParam === 'giant'
        ? breedParam
        : (markCorrection(), defaultFoodState.breedSize);

  const goalParam = params.get('foodGoal');
  const weightGoal: WeightGoal =
    goalParam === null
      ? defaultFoodState.weightGoal
      : goalParam === 'maintain' || goalParam === 'lose'
        ? goalParam
        : (markCorrection(), defaultFoodState.weightGoal);

  return {
    state: {
      config: parsedConfig.config,
      food: {
        selectedSupplier,
        selectedFoodId,
        ageMonths,
        weightKg,
        activityLevel,
        neutered,
        breedSize,
        weightGoal,
      },
      activeTab,
    },
    hadCorrections,
  };
}

export function serializeConfigToSearch(config: Config): string {
  const defaults = getDefaults();
  const p = new URLSearchParams();
  if (config.lang !== defaults.lang) p.set('lang', config.lang);
  if (config.dob) p.set('dob', config.dob);
  if (config.months !== defaults.months) p.set('months', String(config.months));
  if (config.start !== defaults.start) p.set('start', config.start);
  if (config.birthday !== defaults.birthday) p.set('birthday', config.birthday ? 'on' : 'off');
  if (config.name) p.set('name', config.name);
  if (config.notes) p.set('notes', config.notes);
  if (config.feeding !== defaults.feeding) p.set('feeding', config.feeding ? 'on' : 'off');
  if (config.feeding) {
    if (config.meals !== defaults.meals) p.set('meals', String(config.meals));
    if (config.gramsStart !== defaults.gramsStart) p.set('gramsStart', String(config.gramsStart));
    if (config.gramsEnd !== defaults.gramsEnd) p.set('gramsEnd', String(config.gramsEnd));
  }
  const s = p.toString();
  return s ? `?${s}` : '';
}

export function serializePlannerStateToSearch(
  plannerState: PlannerState,
  defaultFoodState: FoodPlannerState
): string {
  const defaults = getDefaults();
  const p = new URLSearchParams();
  const { config, food, activeTab } = plannerState;

  // Canonical key order and omission rules for stable, concise links.
  if (config.lang !== defaults.lang) p.set('lang', config.lang);
  if (config.dob) p.set('dob', config.dob);
  if (config.months !== defaults.months) p.set('months', String(config.months));
  if (config.start !== defaults.start) p.set('start', config.start);
  if (config.birthday !== defaults.birthday) p.set('birthday', config.birthday ? 'on' : 'off');
  if (config.name) p.set('name', config.name);
  if (config.notes) p.set('notes', config.notes);
  if (config.feeding !== defaults.feeding) p.set('feeding', config.feeding ? 'on' : 'off');
  if (config.feeding) {
    if (config.meals !== defaults.meals) p.set('meals', String(config.meals));
    if (config.gramsStart !== defaults.gramsStart) p.set('gramsStart', String(config.gramsStart));
    if (config.gramsEnd !== defaults.gramsEnd) p.set('gramsEnd', String(config.gramsEnd));
  }

  if (activeTab !== 'walkies') p.set('tab', activeTab);
  if (food.selectedSupplier !== defaultFoodState.selectedSupplier)
    p.set('foodSupplier', food.selectedSupplier);
  if (food.selectedFoodId !== defaultFoodState.selectedFoodId) p.set('foodId', food.selectedFoodId);
  if (food.ageMonths !== defaultFoodState.ageMonths) p.set('foodAge', String(food.ageMonths));
  if (food.weightKg !== defaultFoodState.weightKg) p.set('foodWeight', String(food.weightKg));
  if (food.activityLevel !== defaultFoodState.activityLevel)
    p.set('foodActivity', food.activityLevel);
  if (food.neutered !== defaultFoodState.neutered) p.set('foodNeutered', food.neutered ? '1' : '0');
  if (food.breedSize !== defaultFoodState.breedSize) p.set('foodBreed', food.breedSize);
  if (food.weightGoal !== defaultFoodState.weightGoal) p.set('foodGoal', food.weightGoal);

  const s = p.toString();
  return s ? `?${s}` : '';
}
