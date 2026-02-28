/**
 * Planner UI with two tabs: walkies + food.
 */
import type { Config } from './config';
import {
  parsePlannerStateFromSearch,
  serializePlannerStateToSearch,
  getDefaults,
  type FoodPlannerState,
  type PlannerTab,
} from './config';
import { loadI18n, tr } from './i18n';
import { generateICS } from './ics';
import { validate, isValid, type ValidationErrors } from './validation';
import { calculateDailyPortion } from './food/portion';
import { findFoodById, getAllFoods, getSupplierCatalog, validateCatalog } from './food/catalog';
import type { ActivityLevel, BreedSize, FoodEntry, PortionInputs, WeightGoal } from './food/types';
import {
  fromDisplayedAge,
  getFoodProfile,
  resetForProfileSwitch,
  toDisplayedAge,
} from './food/profile';
import { ANALYTICS_EVENTS, trackEvent } from './analytics';
import { applyPlannerMetadata } from './metadata';
import { buildShareTarget, SHARE_PLATFORMS, type SharePlatform } from './sharing';
import {
  MIXED_DEFAULT_WET_PERCENT,
  MIXED_MIN_TOTAL_GRAMS,
  canApplyMixedSplit,
  clampWetPercent,
  findDefaultSecondFood,
  isValidWetDryPair,
  splitDailyGrams,
} from './food/mixed';

const BUY_ME_A_COFFEE_URL = 'https://buymeacoffee.com/caseyberlin';
const CASEY_DIT_URL = 'https://casey.berlin/DIT';
const DEFAULT_REPO_URL = __CONFIG__.repoUrl || 'https://github.com/CaseyRo/puppyCal';

function dobToAgeMonths(dob: string): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  const now = new Date();
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  return Math.max(1, months);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function currentCanonicalUrl(): string {
  return `${window.location.origin}${window.location.pathname}${window.location.search}`;
}

function mailtoWithContext(to: string, subject: string, intro: string): string {
  const body = `${intro}\n\nPage reference: ${window.location.href}`;
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

async function fallbackShare(url: string, text: string): Promise<boolean> {
  if (navigator.share) {
    try {
      await navigator.share({ url, text });
      return true;
    } catch {
      // ignore and continue to clipboard fallback
    }
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(url);
    return true;
  }

  return false;
}

function applyPlannerStateToUrl(
  config: Config,
  foodState: FoodPlannerState,
  activeTab: PlannerTab,
  defaultFoodState: FoodPlannerState
): void {
  const search = serializePlannerStateToSearch(
    {
      config,
      food: foodState,
      activeTab,
    },
    defaultFoodState
  );
  const url = `${window.location.pathname}${search}${window.location.hash}`;
  window.history.replaceState(null, '', url);
}

function triggerDownload(blob: Blob, filename: string): void {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function defaultFoodState(foods: FoodEntry[]): FoodPlannerState {
  const preferredId = 'purina-pro-plan-medium-puppy-chicken';
  const preferred = foods.find((f) => f.id === preferredId) ?? foods[0];
  return {
    selectedSupplier: preferred?.supplier ?? 'purina',
    selectedFoodId: preferred?.id ?? '',
    mixedMode: false,
    secondSupplier: preferred?.supplier ?? 'purina',
    secondFoodId: '',
    wetPercent: MIXED_DEFAULT_WET_PERCENT,
    ageMonths: 6,
    weightKg: 12,
    activityLevel: 'moderate',
    neutered: false,
    breedSize: 'medium',
    weightGoal: 'maintain',
  };
}

function normalizeFoodSelection(
  foodState: FoodPlannerState,
  supplierCatalog: Record<string, FoodEntry[]>,
  fallbackFoodState: FoodPlannerState
): { state: FoodPlannerState; corrected: boolean } {
  let corrected = false;
  let selectedSupplier = foodState.selectedSupplier;

  if (!supplierCatalog[selectedSupplier]) {
    selectedSupplier = fallbackFoodState.selectedSupplier;
    corrected = true;
  }

  const foodsForSupplier = supplierCatalog[selectedSupplier] ?? [];
  let selectedFoodId = foodState.selectedFoodId;
  if (!foodsForSupplier.some((food) => food.id === selectedFoodId)) {
    selectedFoodId = foodsForSupplier[0]?.id ?? fallbackFoodState.selectedFoodId;
    corrected = true;
  }
  let secondSupplier = foodState.secondSupplier;
  if (!supplierCatalog[secondSupplier]) {
    secondSupplier = selectedSupplier;
    corrected = true;
  }
  const secondFoodsForSupplier = supplierCatalog[secondSupplier] ?? [];
  let secondFoodId = foodState.secondFoodId;
  if (secondFoodId && !secondFoodsForSupplier.some((food) => food.id === secondFoodId)) {
    secondFoodId = '';
    corrected = true;
  }
  const wetPercent = clampWetPercent(foodState.wetPercent);
  if (wetPercent !== foodState.wetPercent) {
    corrected = true;
  }

  return {
    state: {
      ...foodState,
      selectedSupplier,
      selectedFoodId,
      secondSupplier,
      secondFoodId,
      wetPercent,
    },
    corrected,
  };
}

export async function runApp(container: HTMLElement): Promise<void> {
  const supplierCatalog = getSupplierCatalog();
  const allFoods = getAllFoods();
  const catalogValidation = validateCatalog();
  const fallbackFoodState = defaultFoodState(allFoods);
  const initialSearch =
    window.location.search ||
    serializePlannerStateToSearch(
      {
        config: getDefaults(),
        food: fallbackFoodState,
        activeTab: 'food',
      },
      fallbackFoodState
    );
  const parsed = parsePlannerStateFromSearch(initialSearch, fallbackFoodState);
  const normalizedSelection = normalizeFoodSelection(
    parsed.state.food,
    supplierCatalog,
    fallbackFoodState
  );
  const initialHadCorrections = parsed.hadCorrections || normalizedSelection.corrected;

  let config = parsed.state.config;
  let activeTab: PlannerTab = parsed.state.activeTab;
  let foodState = normalizedSelection.state;

  // Derive ageMonths from DOB if DOB is set on load
  if (config.dob) {
    const derived = dobToAgeMonths(config.dob);
    if (derived !== null) {
      foodState = { ...foodState, ageMonths: derived };
    }
  }

  applyPlannerStateToUrl(config, foodState, activeTab, fallbackFoodState);

  const i18n = await loadI18n(config.lang);
  document.documentElement.lang = config.lang;
  let errors: ValidationErrors = validate(config);
  const walkiesTouched: Record<'dob' | 'months' | 'start', boolean> = {
    dob: Boolean(config.dob),
    months: false,
    start: false,
  };
  const t = (key: string, params: Record<string, string | number> = {}): string =>
    tr(i18n, key, params);

  function setConfig(updater: (c: Config) => void, options: { rerender?: boolean } = {}): void {
    config = { ...config };
    updater(config);
    errors = validate(config);
    applyPlannerStateToUrl(config, foodState, activeTab, fallbackFoodState);
    const shouldRerender = options.rerender ?? true;
    if (!shouldRerender) {
      return;
    }
    render();
  }

  let feedback: string | null = null;
  let feedbackTimer: ReturnType<typeof setTimeout> | null = null;
  let sharePickerOpen = false;

  function showFeedback(msg: string): void {
    if (feedbackTimer) clearTimeout(feedbackTimer);
    feedback = msg;
    render();
    feedbackTimer = setTimeout(() => {
      feedback = null;
      feedbackTimer = null;
      render();
    }, 2500);
  }

  function renderWalkies(valid: boolean): string {
    const visibleDobError = walkiesTouched.dob ? errors.dob : undefined;
    const visibleMonthsError = walkiesTouched.months ? errors.months : undefined;
    const visibleStartError = walkiesTouched.start ? errors.start : undefined;
    const infoIcon = (text: string): string =>
      `<span class="inline-flex items-center justify-center w-4 h-4 rounded-full border border-gray-300 text-[10px] text-gray-500 ml-1" title="${text}" aria-label="${text}">i</span>`;

    const sharePicker = `
      <div id="social-share-picker" class="${sharePickerOpen ? '' : 'hidden '}mt-2">
        <p class="text-xs text-gray-600 mb-2">${t('share_platform_prompt')}</p>
        <div class="flex flex-wrap gap-2">
          ${SHARE_PLATFORMS.map(
            (platform) => `
              <button type="button"
                class="share-platform px-2 py-1 text-sm rounded border border-gray-300 bg-white hover:bg-gray-50"
                data-platform="${platform.id}"
                aria-label="${t('share_on', { platform: platform.label })}">
                <i class="${platform.iconClass}" aria-hidden="true"></i> ${platform.label}
              </button>`
          ).join('')}
        </div>
      </div>
    `;

    return `
      <section aria-label="${t('section_walkies')}">
      <h2 class="text-lg font-semibold mb-4">${t('section_walkies')}</h2>
      <form id="walkies-form" class="space-y-4" novalidate data-surface="walkies-form">
        <div>
          <label for="dob" class="block text-sm font-medium mb-1">${t('label_dob')} ${infoIcon(
            t('hint_dob')
          )}</label>
          <input type="date" id="dob" value="${config.dob}" aria-describedby="dob-err" aria-invalid="${visibleDobError ? 'true' : 'false'}"
            class="w-full border rounded px-3 py-2 ${visibleDobError ? 'border-red-600 ring-1 ring-red-600' : 'border-gray-300'}"/>
          ${visibleDobError ? `<p id="dob-err" class="text-red-600 text-sm mt-1" role="alert">${t(visibleDobError)}</p>` : `<p class="text-xs text-gray-500 mt-1">${t('hint_dob')}</p>`}
        </div>
        <div>
          <label for="months" class="block text-sm font-medium mb-1">${t('label_months')} ${infoIcon(
            t('hint_months')
          )}</label>
          <div class="inline-flex items-center gap-2">
            <button type="button" id="months-decrease" class="h-8 w-8 rounded border border-gray-300 text-gray-700 hover:bg-gray-100" aria-label="${t('months_decrease')}">-</button>
            <input type="number" id="months" min="1" max="12" value="${config.months}" aria-describedby="months-err" aria-invalid="${visibleMonthsError ? 'true' : 'false'}"
              class="w-16 text-center border rounded px-2 py-1 ${visibleMonthsError ? 'border-red-600 ring-1 ring-red-600' : 'border-gray-300'}"/>
            <button type="button" id="months-increase" class="h-8 w-8 rounded border border-gray-300 text-gray-700 hover:bg-gray-100" aria-label="${t('months_increase')}">+</button>
          </div>
          ${visibleMonthsError ? `<p id="months-err" class="text-red-600 text-sm mt-1" role="alert">${t(visibleMonthsError)}</p>` : `<p class="text-xs text-gray-500 mt-1">${t('hint_months')}</p>`}
        </div>
        <div>
          <label for="start" class="block text-sm font-medium mb-1">${t('label_start')} ${infoIcon(
            t('hint_start')
          )}</label>
          <input type="date" id="start" value="${config.start}" aria-describedby="start-err" aria-invalid="${visibleStartError ? 'true' : 'false'}"
            class="w-full border rounded px-3 py-2 ${visibleStartError ? 'border-red-600 ring-1 ring-red-600' : 'border-gray-300'}"/>
          ${visibleStartError ? `<p id="start-err" class="text-red-600 text-sm mt-1" role="alert">${t(visibleStartError)}</p>` : `<p class="text-xs text-gray-500 mt-1">${t('hint_start')}</p>`}
        </div>
        <div>
          <label for="name" class="block text-sm font-medium mb-1">${t('label_name')} ${infoIcon(
            t('hint_name')
          )}</label>
          <input type="text" id="name" value="${escapeHtml(config.name)}" placeholder=""
            class="w-full border border-gray-300 rounded px-3 py-2"/>
          <p class="text-xs text-gray-500 mt-1">${t('hint_name')}</p>
        </div>
        <div class="flex items-center gap-2">
          <input type="checkbox" id="birthday" ${config.birthday ? 'checked' : ''}
            class="rounded border-gray-300 text-primary focus:ring-primary"/>
          <label for="birthday" class="text-sm font-medium">${t('label_birthday')} ${infoIcon(
            t('hint_birthday')
          )}</label>
        </div>
      </form>

      <div class="mt-6 flex flex-col sm:flex-row gap-3">
        <button type="button" id="btn-download" ${!valid ? 'disabled' : ''}
          class="px-4 py-3 rounded font-medium bg-primary text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed">
          ${t('download')}
        </button>
        <button type="button" id="btn-share"
          class="px-4 py-3 rounded font-medium border border-gray-300 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2">
          ${t('share_social')}
        </button>
      </div>
      ${sharePicker}
      </section>
    `;
  }

  function renderDog(): string {
    const infoIcon = (text: string): string =>
      `<span class="inline-flex items-center justify-center w-4 h-4 rounded-full border border-gray-300 text-[10px] text-gray-500 ml-1" title="${text}" aria-label="${text}">i</span>`;

    return `
      <section aria-label="${t('dog_profile_title')}">
      <h2 class="text-lg font-semibold mb-4">${t('dog_profile_title')}</h2>
      <form id="dog-form" class="space-y-4" novalidate>
        <div>
          <label for="dog-name" class="block text-sm font-medium mb-1">${t('label_name')} ${infoIcon(t('hint_name'))}</label>
          <input type="text" id="dog-name" value="${escapeHtml(config.name)}" placeholder=""
            class="w-full border border-gray-300 rounded px-3 py-2"/>
        </div>
        <div>
          <label for="dog-dob" class="block text-sm font-medium mb-1">${t('label_dob')} ${infoIcon(t('hint_dob'))}</label>
          <input type="date" id="dog-dob" value="${config.dob}"
            class="w-full border border-gray-300 rounded px-3 py-2"/>
          ${config.dob ? `<p class="text-xs text-gray-500 mt-1">${t('dog_derived_age', { months: String(foodState.ageMonths) })}</p>` : `<p class="text-xs text-gray-500 mt-1">${t('hint_dob')}</p>`}
        </div>
        <div>
          <label for="dog-weight" class="block text-sm font-medium mb-1">${t('label_weight_kg')}</label>
          <input type="number" id="dog-weight" min="0.5" max="80" step="0.1" value="${foodState.weightKg}"
            class="w-full border border-gray-300 rounded px-3 py-2"/>
        </div>
        <div>
          <label for="dog-breed-size" class="block text-sm font-medium mb-1">${t('label_breed_size')}</label>
          <select id="dog-breed-size" class="w-full border border-gray-300 rounded px-3 py-2">
            <option value="small" ${foodState.breedSize === 'small' ? 'selected' : ''}>${t('breed_small')}</option>
            <option value="medium" ${foodState.breedSize === 'medium' ? 'selected' : ''}>${t('breed_medium')}</option>
            <option value="large" ${foodState.breedSize === 'large' ? 'selected' : ''}>${t('breed_large')}</option>
            <option value="giant" ${foodState.breedSize === 'giant' ? 'selected' : ''}>${t('breed_giant')}</option>
          </select>
        </div>
        <div>
          <label for="dog-activity" class="block text-sm font-medium mb-1">${t('label_activity')}</label>
          <select id="dog-activity" class="w-full border border-gray-300 rounded px-3 py-2">
            <option value="low" ${foodState.activityLevel === 'low' ? 'selected' : ''}>${t('activity_low')}</option>
            <option value="moderate" ${foodState.activityLevel === 'moderate' ? 'selected' : ''}>${t('activity_moderate')}</option>
            <option value="high" ${foodState.activityLevel === 'high' ? 'selected' : ''}>${t('activity_high')}</option>
          </select>
        </div>
        <div class="flex items-center gap-2">
          <input type="checkbox" id="dog-neutered" ${foodState.neutered ? 'checked' : ''}
            class="rounded border-gray-300 text-primary focus:ring-primary"/>
          <label for="dog-neutered" class="text-sm font-medium">${t('label_neutered')}</label>
        </div>
        <div>
          <label for="dog-goal" class="block text-sm font-medium mb-1">${t('label_goal')}</label>
          <select id="dog-goal" class="w-full border border-gray-300 rounded px-3 py-2">
            <option value="maintain" ${foodState.weightGoal === 'maintain' ? 'selected' : ''}>${t('goal_maintain')}</option>
            <option value="lose" ${foodState.weightGoal === 'lose' ? 'selected' : ''}>${t('goal_lose')}</option>
          </select>
        </div>
        <div class="pt-2 border-t border-gray-100">
          <p class="text-sm font-medium mb-2">${t('lang_toggle_label')}</p>
          <div class="inline-flex rounded-lg border border-gray-200 overflow-hidden">
            <button type="button" id="lang-en"
              class="px-4 py-1.5 text-sm font-medium ${config.lang === 'en' ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}">
              EN
            </button>
            <button type="button" id="lang-nl"
              class="px-4 py-1.5 text-sm font-medium ${config.lang === 'nl' ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}">
              NL
            </button>
          </div>
        </div>
      </form>
      </section>
    `;
  }

  function renderFood(): string {
    const suppliers = Object.keys(supplierCatalog).sort();
    const foodsForSupplier = supplierCatalog[foodState.selectedSupplier] ?? [];
    const selectedFood = findFoodById(foodState.selectedFoodId) ?? foodsForSupplier[0] ?? null;
    const secondFoodsForSupplier = supplierCatalog[foodState.secondSupplier] ?? [];
    const secondFood = findFoodById(foodState.secondFoodId) ?? null;
    const wetPercent = clampWetPercent(foodState.wetPercent);
    const dryPercent = 100 - wetPercent;
    const profile = getFoodProfile(selectedFood);
    const ageLabel = profile.isPuppy ? t('label_age_months') : t('label_age_years');
    const ageHint = profile.isPuppy ? t('hint_age_months') : t('hint_age_years');
    const displayedAge = toDisplayedAge(foodState.ageMonths, profile.isPuppy);
    const SUPPLIER_NAMES: Record<string, string> = {
      purina: 'Purina Pro Plan',
      'royal-canin': 'Royal Canin',
    };
    const result = selectedFood
      ? calculateDailyPortion(
          {
            ageMonths: foodState.ageMonths,
            weightKg: foodState.weightKg,
            activityLevel: profile.isPuppy ? 'moderate' : foodState.activityLevel,
            neutered: profile.isPuppy ? false : foodState.neutered,
            breedSize: foodState.breedSize,
            weightGoal: profile.isPuppy ? 'maintain' : foodState.weightGoal,
          } as PortionInputs,
          selectedFood.calories?.kcalPerKg
        )
      : null;
    const pairIsValid = isValidWetDryPair(selectedFood, secondFood);
    const mixedCanApply = Boolean(
      foodState.mixedMode && pairIsValid && result && canApplyMixedSplit(result.gramsPerDay)
    );
    const mixedSplit = result ? splitDailyGrams(result.gramsPerDay, wetPercent) : null;
    let mixedValidationKey: string | null = null;
    if (foodState.mixedMode) {
      if (!secondFood) {
        mixedValidationKey = 'mixed_validation_choose_second';
      } else if (selectedFood && secondFood.id === selectedFood.id) {
        mixedValidationKey = 'mixed_validation_duplicate';
      } else if (!pairIsValid) {
        mixedValidationKey = 'mixed_validation_wet_dry_required';
      } else if (result && !canApplyMixedSplit(result.gramsPerDay)) {
        mixedValidationKey = 'mixed_validation_min_total';
      }
    }
    const infoIcon = (text: string): string =>
      `<span class="inline-flex items-center justify-center w-4 h-4 rounded-full border border-gray-300 text-[10px] text-gray-500 ml-1" title="${text}" aria-label="${text}">i</span>`;

    const copyBtn = `
      <button type="button" id="btn-copy-food-link"
        class="inline-flex items-center gap-1.5 mt-4 px-3 py-1.5 text-xs font-medium text-gray-600 rounded-full border border-muted bg-white/60 hover:bg-white hover:text-primary transition-colors"
        aria-label="${t('copy_link')}">
        <i class="fa-solid fa-link text-[10px]" aria-hidden="true"></i>
        ${t('copy_link')}
      </button>`;

    let heroCard: string;
    if (selectedFood && result) {
      const finePrint = `
        <div class="mt-4 pt-3 border-t border-muted text-xs text-gray-500 space-y-1">
          <p>${t('result_advisory')}</p>
          <p><a class="underline hover:text-primary" href="${selectedFood.sourceUrl}" target="_blank" rel="noreferrer">${t('result_source')}</a> (${selectedFood.sourceDate})</p>
        </div>`;

      if (mixedCanApply && mixedSplit) {
        heroCard = `
          <div class="rounded-2xl bg-surface p-6 text-center animate-scale-in">
            <p class="text-sm font-medium text-gray-500 tracking-wide uppercase">${t('result_title')}</p>
            <div class="flex items-baseline justify-center gap-3 mt-3">
              <div>
                <p class="font-display text-4xl font-semibold text-primary leading-tight">
                  ${mixedSplit.wetGrams}<span class="text-lg ml-0.5">g</span>
                </p>
                <p class="text-xs text-gray-500 mt-0.5">${t('food_type_wet')}</p>
              </div>
              <span class="text-2xl text-gray-300 font-light">+</span>
              <div>
                <p class="font-display text-4xl font-semibold text-primary leading-tight">
                  ${mixedSplit.dryGrams}<span class="text-lg ml-0.5">g</span>
                </p>
                <p class="text-xs text-gray-500 mt-0.5">${t('food_type_dry')}</p>
              </div>
            </div>
            <p class="text-xs text-gray-500 mt-2">${t('mixed_split_applied', {
              wet: String(wetPercent),
              dry: String(dryPercent),
            })}</p>
            <p class="text-sm text-gray-500 mt-1">${t('result_kcal', {
              kcal: String(result.estimatedKcalPerDay),
            })}</p>
            ${copyBtn}
            <div class="mt-4 pt-3 border-t border-muted text-xs text-gray-500 space-y-1">
              <p>${t('result_advisory')}</p>
              <p>${t('mixed_rounding_note')}</p>
              <p><a class="underline hover:text-primary" href="${selectedFood.sourceUrl}" target="_blank" rel="noreferrer">${t('result_source')}</a> (${selectedFood.sourceDate})</p>
            </div>
          </div>`;
      } else {
        heroCard = `
          <div class="rounded-2xl bg-surface p-6 text-center animate-scale-in">
            <p class="text-sm font-medium text-gray-500 tracking-wide uppercase">${t('result_title')}</p>
            <p class="font-display text-5xl font-semibold text-primary mt-3 leading-tight">
              ${result.gramsPerDay}<span class="text-2xl ml-1">g</span>
            </p>
            <p class="text-sm text-gray-500 mt-1">${t('result_kcal', {
              kcal: String(result.estimatedKcalPerDay),
            })}</p>
            ${copyBtn}
            ${finePrint}
          </div>`;
      }
    } else {
      heroCard = `
        <div class="rounded-2xl bg-surface p-6 text-center">
          <p class="text-sm font-medium text-gray-500 tracking-wide uppercase">${t('result_title')}</p>
          <p class="font-display text-5xl font-semibold text-muted mt-3 leading-tight select-none" aria-hidden="true">
            --<span class="text-2xl ml-1">g</span>
          </p>
          <p class="text-sm text-gray-400 mt-2">${t('result_empty_hint')}</p>
        </div>`;
    }

    const assumptionsBlock =
      selectedFood && result
        ? `<details class="mt-3">
            <summary class="text-xs font-medium text-gray-500 cursor-pointer select-none hover:text-gray-700">${t('result_assumptions')}</summary>
            <ul class="text-xs list-disc pl-5 mt-1 text-gray-500">
              ${result.assumptions.map((item) => `<li>${item}</li>`).join('')}
            </ul>
          </details>`
        : '';

    // Mixed mode: filter second foods to opposite type of primary
    const primaryFoodType = selectedFood?.foodType ?? 'dry';
    const oppositeType = primaryFoodType === 'dry' ? 'wet' : 'dry';
    const hasOppositeType = allFoods.some((f) => f.foodType === oppositeType);
    const filteredSecondFoods = foodState.mixedMode
      ? secondFoodsForSupplier.filter((f) => f.foodType === oppositeType)
      : secondFoodsForSupplier;

    // Profile summary for food settings
    const hasProfile = Boolean(config.name || config.dob);
    const breedSizeLabel =
      {
        small: t('breed_small'),
        medium: t('breed_medium'),
        large: t('breed_large'),
        giant: t('breed_giant'),
      }[foodState.breedSize] ?? foodState.breedSize;
    const activityLabel =
      { low: t('activity_low'), moderate: t('activity_moderate'), high: t('activity_high') }[
        foodState.activityLevel
      ] ?? foodState.activityLevel;
    const profileSummaryLine = hasProfile
      ? `<p class="text-xs text-gray-400 mt-2">${t('food_profile_summary', {
          weight: String(foodState.weightKg),
          size: breedSizeLabel,
          activity: activityLabel,
        })}</p>`
      : '';

    const dogHintCard = !hasProfile
      ? `<div class="rounded-xl border border-dashed border-gray-300 p-4 mb-4 flex items-center gap-3 bg-white/50">
          <span class="text-2xl">🐾</span>
          <div class="flex-1 min-w-0">
            <p class="text-sm text-gray-600">${t('dog_hint_empty')}</p>
            <button type="button" id="btn-go-dog-tab" class="mt-1 text-xs font-medium text-primary underline hover:opacity-80">${t('dog_hint_cta')}</button>
          </div>
        </div>`
      : '';

    // Age field: only shown when DOB is not set (else DOB auto-calculates it)
    const ageField = config.dob
      ? `<p class="text-xs text-gray-400 mt-1 italic">${t('dog_derived_age', { months: String(foodState.ageMonths) })}</p>`
      : `<div>
          <label for="food-age" class="block text-xs font-medium text-gray-600 mb-1">${ageLabel} ${infoIcon(ageHint)}</label>
          <input id="food-age" type="number" min="1" max="${profile.isPuppy ? 24 : 20}" step="1" value="${displayedAge}"
            class="w-full border border-gray-200 rounded px-3 py-2 text-sm"/>
          <p class="text-xs text-gray-400 mt-1">${ageHint}</p>
        </div>`;

    return `
      <section aria-label="${t('section_food')}">
      ${
        catalogValidation.errors.length
          ? `<p class="text-sm text-red-700 mb-3">${t('data_error_prefix')} ${catalogValidation.errors[0]}</p>`
          : ''
      }

      ${dogHintCard}
      ${heroCard}
      ${assumptionsBlock}

      <details class="mt-5 group" open>
        <summary class="flex items-center justify-between cursor-pointer select-none py-2">
          <span class="text-sm font-semibold text-gray-700">${t('section_food_settings')}</span>
          <i class="fa-solid fa-chevron-down text-xs text-gray-400 transition-transform group-open:rotate-180" aria-hidden="true"></i>
        </summary>
        <form id="food-form" class="space-y-3 pt-3" novalidate>
          <div>
            <label for="food-supplier" class="block text-xs font-medium text-gray-600 mb-1">${t('label_supplier')}</label>
            <select id="food-supplier" class="w-full border border-gray-200 rounded px-3 py-2 text-sm">
              ${suppliers
                .map((supplier) => {
                  const label = SUPPLIER_NAMES[supplier] ?? supplier;
                  return `<option value="${supplier}" ${
                    supplier === foodState.selectedSupplier ? 'selected' : ''
                  }>${label}</option>`;
                })
                .join('')}
            </select>
          </div>
          <div>
            <label for="food-product" class="block text-xs font-medium text-gray-600 mb-1">${t('label_product')}</label>
            <select id="food-product" class="w-full border border-gray-200 rounded px-3 py-2 text-sm">
              ${foodsForSupplier
                .map(
                  (food) =>
                    `<option value="${food.id}" ${
                      food.id === foodState.selectedFoodId ? 'selected' : ''
                    }>${food.brand} — ${food.productName} (${food.foodType === 'wet' ? t('food_type_wet') : t('food_type_dry')})</option>`
                )
                .join('')}
            </select>
          </div>
          <div class="flex items-center gap-2">
            <input id="food-mixed-mode" type="checkbox" ${
              foodState.mixedMode ? 'checked' : ''
            } ${!hasOppositeType ? 'disabled' : ''} class="rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50"/>
            <label for="food-mixed-mode" class="text-xs font-medium text-gray-600">${t('label_mixed_mode')}</label>
          </div>
          ${!hasOppositeType ? `<p class="text-xs text-gray-400">${t('mixed_no_opposite')}</p>` : ''}
          ${
            foodState.mixedMode && hasOppositeType
              ? `<div class="rounded-lg border border-gray-200 p-3 bg-white/50 space-y-3">
            <p class="text-xs text-gray-500">${t('mixed_mode_hint')}</p>
            <div>
              <label for="food-second-supplier" class="block text-xs font-medium text-gray-600 mb-1">${t('label_second_supplier')}</label>
              <select id="food-second-supplier" class="w-full border border-gray-200 rounded px-3 py-2 text-sm">
                ${suppliers
                  .map(
                    (supplier) =>
                      `<option value="${supplier}" ${
                        supplier === foodState.secondSupplier ? 'selected' : ''
                      }>${SUPPLIER_NAMES[supplier] ?? supplier}</option>`
                  )
                  .join('')}
              </select>
            </div>
            <div>
              <label for="food-second-product" class="block text-xs font-medium text-gray-600 mb-1">${t('label_second_product')}</label>
              <select id="food-second-product" class="w-full border border-gray-200 rounded px-3 py-2 text-sm">
                <option value="">${t('mixed_select_placeholder')}</option>
                ${filteredSecondFoods
                  .map(
                    (food) =>
                      `<option value="${food.id}" ${
                        food.id === foodState.secondFoodId ? 'selected' : ''
                      }>${food.brand} — ${food.productName} (${food.foodType === 'wet' ? t('food_type_wet') : t('food_type_dry')})</option>`
                  )
                  .join('')}
              </select>
              <button type="button" id="food-second-clear" class="mt-2 text-xs underline text-gray-500 hover:text-primary">${t(
                'mixed_remove_second_food'
              )}</button>
            </div>
            <div>
              <label for="food-wet-percent" class="block text-xs font-medium text-gray-600 mb-1">${t('label_mixed_split')}</label>
              <input id="food-wet-percent" type="range" min="1" max="99" step="1" value="${wetPercent}" class="w-full accent-primary"/>
              <p class="text-xs text-gray-500 mt-1">${t('mixed_split_preview', {
                wet: String(wetPercent),
                dry: String(dryPercent),
              })}</p>
              <div class="mt-2 flex gap-2">
                <button type="button" class="food-wet-preset text-xs rounded border border-gray-200 px-2 py-1 hover:bg-surface" data-wet-preset="75">75/25</button>
                <button type="button" class="food-wet-preset text-xs rounded border border-gray-200 px-2 py-1 hover:bg-surface" data-wet-preset="50">50/50</button>
                <button type="button" class="food-wet-preset text-xs rounded border border-gray-200 px-2 py-1 hover:bg-surface" data-wet-preset="25">25/75</button>
              </div>
            </div>
            ${
              mixedValidationKey
                ? `<p class="text-sm text-amber-700">${t(mixedValidationKey, {
                    min: String(MIXED_MIN_TOTAL_GRAMS),
                  })}</p>`
                : ''
            }
          </div>`
              : ''
          }
          ${ageField}
          ${profileSummaryLine}
        </form>
      </details>
      </section>
    `;
  }

  function render(): void {
    const valid = isValid(errors);
    const titleText = config.name ? t('title_for', { name: escapeHtml(config.name) }) : t('title');
    const generalEmailHref = mailtoWithContext(
      'DIT@casey.berlin',
      'Hey Casey lets talk',
      'Hey Casey lets talk'
    );
    const foodDataEmailHref = mailtoWithContext(
      'DIT@casey.berlin',
      'Add your food data to our widget',
      'Hey Casey, I want to add food data to your widget.'
    );
    const middleCta =
      activeTab === 'walkies'
        ? `<a id="footer-repo-link" href="${DEFAULT_REPO_URL}" target="_blank" rel="noreferrer"
             class="text-gray-600 hover:text-primary underline text-[11px]">
             ${t('footer_repo_cta')}
           </a>`
        : `<a id="footer-food-data-link" href="${foodDataEmailHref}"
             class="text-gray-600 hover:text-primary underline text-[11px]">
             ${t('footer_food_data_cta')}
           </a>`;

    container.innerHTML = `
      <div class="min-h-screen bg-background text-gray-800 font-sans px-4 py-6 max-w-lg mx-auto">
        <header class="flex items-center gap-3 mb-6">
          <img src="/icons/icon-192.png" alt="PuppyCal" class="w-12 h-12 rounded-xl flex-shrink-0" width="48" height="48" />
          <h1 class="text-2xl font-display font-semibold text-gray-900 leading-tight">${titleText}</h1>
        </header>
        <div class="mb-4 inline-flex rounded-lg border border-gray-200 overflow-hidden" role="tablist" aria-label="Planner tabs">
          <button type="button" id="tab-food" role="tab" aria-selected="${activeTab === 'food'}"
            class="px-4 py-2 text-sm font-medium ${
              activeTab === 'food' ? 'bg-primary text-white' : 'bg-white text-gray-700'
            }">${t('tab_food')}</button>
          <button type="button" id="tab-walkies" role="tab" aria-selected="${
            activeTab === 'walkies'
          }"
            class="px-4 py-2 text-sm font-medium ${
              activeTab === 'walkies' ? 'bg-primary text-white' : 'bg-white text-gray-700'
            }">${t('tab_walkies')}</button>
          <button type="button" id="tab-dog" role="tab" aria-selected="${activeTab === 'dog'}"
            class="px-4 py-2 text-sm font-medium ${
              activeTab === 'dog' ? 'bg-primary text-white' : 'bg-white text-gray-700'
            }">${t('tab_dog')}</button>
        </div>

        ${activeTab === 'walkies' ? renderWalkies(valid) : activeTab === 'dog' ? renderDog() : renderFood()}

        <footer class="puppycal-footer mt-8" aria-label="${t('footer_label')}">
          <div class="puppycal-footer__inner">
            <p class="puppycal-footer__disclaimer">${t('footer_disclaimer')}</p>
            <div class="puppycal-footer__links">
              <a id="footer-brand-link" href="${CASEY_DIT_URL}" target="_blank" rel="noreferrer"
                class="puppycal-footer__link">${t('footer_brand_text')}</a>
              <span class="puppycal-footer__sep" aria-hidden="true">·</span>
              <a id="footer-email-link" href="${generalEmailHref}"
                class="puppycal-footer__link">${t('footer_email_cta')}</a>
              <span class="puppycal-footer__sep" aria-hidden="true">·</span>
              <a id="footer-coffee-link" href="${BUY_ME_A_COFFEE_URL}" target="_blank" rel="noreferrer"
                class="puppycal-footer__link">${t('footer_buy_coffee')}</a>
              <span class="puppycal-footer__sep" aria-hidden="true">·</span>
              ${middleCta.replace(/class="[^"]*"/g, 'class="puppycal-footer__link"').replace(/id="[^"]*"\s*/g, 'id="footer-middle-cta" ')}
            </div>
          </div>
        </footer>

      </div>
      ${feedback ? `<p class="fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg z-50" role="status">${feedback}</p>` : ''}
    `;
    applyPlannerMetadata({
      activeTab,
      canonicalUrl: currentCanonicalUrl(),
    });

    container.querySelector('#tab-food')?.addEventListener('click', () => {
      activeTab = 'food';
      sharePickerOpen = false;
      applyPlannerStateToUrl(config, foodState, activeTab, fallbackFoodState);
      render();
    });
    container.querySelector('#tab-walkies')?.addEventListener('click', () => {
      activeTab = 'walkies';
      sharePickerOpen = false;
      applyPlannerStateToUrl(config, foodState, activeTab, fallbackFoodState);
      render();
    });
    container.querySelector('#tab-dog')?.addEventListener('click', () => {
      activeTab = 'dog';
      sharePickerOpen = false;
      applyPlannerStateToUrl(config, foodState, activeTab, fallbackFoodState);
      render();
    });

    container.querySelector('#footer-coffee-link')?.addEventListener('click', () => {
      trackEvent(ANALYTICS_EVENTS.CTA_BUY_ME_A_COFFEE_CLICK, { tab: activeTab, surface: 'footer' });
    });
    container.querySelector('#footer-brand-link')?.addEventListener('click', () => {
      trackEvent(ANALYTICS_EVENTS.CTA_ATTRIBUTION_LINK_CLICK, {
        tab: activeTab,
        surface: 'footer',
      });
    });
    container.querySelector('#footer-email-link')?.addEventListener('click', () => {
      trackEvent(ANALYTICS_EVENTS.CTA_GENERAL_EMAIL_CLICK, { tab: activeTab, surface: 'footer' });
    });
    container.querySelector('#footer-repo-link')?.addEventListener('click', () => {
      trackEvent(ANALYTICS_EVENTS.CTA_REPO_COLLAB_CLICK, { tab: activeTab, surface: 'footer' });
    });
    container.querySelector('#footer-food-data-link')?.addEventListener('click', () => {
      trackEvent(ANALYTICS_EVENTS.CTA_FOOD_DATA_EMAIL_CLICK, { tab: activeTab, surface: 'footer' });
    });

    if (activeTab === 'walkies') {
      const form = container.querySelector('#walkies-form');
      const dob = container.querySelector('#dob') as HTMLInputElement;
      const months = container.querySelector('#months') as HTMLInputElement;
      const start = container.querySelector('#start') as HTMLInputElement;
      const birthday = container.querySelector('#birthday') as HTMLInputElement;
      const nameInput = container.querySelector('#name') as HTMLInputElement;
      const monthsDecrease = container.querySelector(
        '#months-decrease'
      ) as HTMLButtonElement | null;
      const monthsIncrease = container.querySelector(
        '#months-increase'
      ) as HTMLButtonElement | null;

      function syncWalkies(event: Event): void {
        const fieldId = (event.target as HTMLElement | null)?.id;
        if (fieldId === 'dob' || fieldId === 'months' || fieldId === 'start') {
          walkiesTouched[fieldId] = true;
        }
        setConfig(
          (c) => {
            c.dob = dob?.value ?? '';
            const parsedMonths = parseInt(months?.value ?? '3', 10) || 3;
            c.months = Math.max(1, Math.min(12, parsedMonths));
            c.start = start?.value ?? c.start;
            c.birthday = birthday?.checked ?? true;
            c.name = nameInput?.value ?? '';
            c.feeding = false;
          },
          { rerender: event.type !== 'input' }
        );
      }

      form?.addEventListener('input', syncWalkies);
      form?.addEventListener('change', syncWalkies);
      monthsDecrease?.addEventListener('click', () => {
        walkiesTouched.months = true;
        const next = Math.max(1, (parseInt(months.value || '3', 10) || 3) - 1);
        months.value = String(next);
        syncWalkies(new Event('change'));
      });
      monthsIncrease?.addEventListener('click', () => {
        walkiesTouched.months = true;
        const next = Math.min(12, (parseInt(months.value || '3', 10) || 3) + 1);
        months.value = String(next);
        syncWalkies(new Event('change'));
      });

      container.querySelector('#btn-download')?.addEventListener('click', () => {
        if (!valid) return;
        const ics = generateICS(config, i18n);
        if (!ics) return;
        const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
        triggerDownload(blob, 'puppy-schedule.ics');
        showFeedback(
          tr(i18n, 'success', { filename: 'puppy-schedule.ics' }) || t('calendar_ready')
        );
      });

      container.querySelector('#btn-share')?.addEventListener('click', () => {
        sharePickerOpen = !sharePickerOpen;
        trackEvent(ANALYTICS_EVENTS.SHARE_OPENED, { tab: activeTab, surface: 'walkies' });
        render();
      });

      container.querySelectorAll('.share-platform').forEach((button) => {
        button.addEventListener('click', async () => {
          const platform = (button as HTMLElement).getAttribute(
            'data-platform'
          ) as SharePlatform | null;
          if (!platform) {
            return;
          }
          const url = currentCanonicalUrl();
          const shareText = t('share_message');
          trackEvent(ANALYTICS_EVENTS.SHARE_PLATFORM_SELECTED, {
            tab: activeTab,
            platform,
            surface: 'walkies',
          });
          const target = buildShareTarget(platform, url, shareText);
          const popup = window.open(target, '_blank', 'noopener,noreferrer');
          if (popup) {
            trackEvent(ANALYTICS_EVENTS.SHARE_SENT, {
              tab: activeTab,
              platform,
              surface: 'walkies',
            });
            showFeedback(t('share_sent'));
            sharePickerOpen = false;
            render();
            return;
          }

          const fallbackOk = await fallbackShare(url, shareText);
          if (fallbackOk) {
            trackEvent(ANALYTICS_EVENTS.SHARE_SENT, {
              tab: activeTab,
              platform,
              surface: 'walkies',
            });
            showFeedback(t('link_copied'));
          } else {
            showFeedback(t('share_failed'));
          }
          sharePickerOpen = false;
          render();
        });
      });
    } else if (activeTab === 'food') {
      container.querySelector('#btn-go-dog-tab')?.addEventListener('click', () => {
        activeTab = 'dog';
        applyPlannerStateToUrl(config, foodState, activeTab, fallbackFoodState);
        render();
      });

      const supplierInput = container.querySelector('#food-supplier') as HTMLSelectElement | null;
      const productInput = container.querySelector('#food-product') as HTMLSelectElement | null;
      const mixedModeInput = container.querySelector('#food-mixed-mode') as HTMLInputElement | null;
      const secondSupplierInput = container.querySelector(
        '#food-second-supplier'
      ) as HTMLSelectElement | null;
      const secondProductInput = container.querySelector(
        '#food-second-product'
      ) as HTMLSelectElement | null;
      const secondClearButton = container.querySelector(
        '#food-second-clear'
      ) as HTMLButtonElement | null;
      const wetPercentInput = container.querySelector(
        '#food-wet-percent'
      ) as HTMLInputElement | null;
      const ageInput = container.querySelector('#food-age') as HTMLInputElement | null;

      const selectedFood = findFoodById(foodState.selectedFoodId) ?? null;
      const currentProfile = getFoodProfile(selectedFood);

      supplierInput?.addEventListener('change', () => {
        const supplier = supplierInput.value;
        const nextFoods = supplierCatalog[supplier] ?? [];
        const nextSelectedFood = findFoodById(nextFoods[0]?.id ?? '') ?? null;
        const nextProfile = getFoodProfile(nextSelectedFood);
        foodState = {
          ...foodState,
          selectedSupplier: supplier,
          selectedFoodId: nextFoods[0]?.id ?? '',
        };
        foodState = resetForProfileSwitch(
          foodState,
          currentProfile.isPuppy,
          nextProfile.isPuppy,
          fallbackFoodState
        );
        applyPlannerStateToUrl(config, foodState, activeTab, fallbackFoodState);
        render();
      });

      productInput?.addEventListener('change', () => {
        const currentSelectedFood = findFoodById(foodState.selectedFoodId) ?? null;
        const nextSelectedFood = findFoodById(productInput.value) ?? null;
        const before = getFoodProfile(currentSelectedFood);
        const after = getFoodProfile(nextSelectedFood);
        foodState = {
          ...foodState,
          selectedFoodId: productInput.value,
        };
        foodState = resetForProfileSwitch(
          foodState,
          before.isPuppy,
          after.isPuppy,
          fallbackFoodState
        );
        applyPlannerStateToUrl(config, foodState, activeTab, fallbackFoodState);
        render();
      });

      mixedModeInput?.addEventListener('change', () => {
        const enabled = mixedModeInput.checked;
        if (!enabled) {
          foodState = {
            ...foodState,
            mixedMode: false,
            secondFoodId: '',
          };
          applyPlannerStateToUrl(config, foodState, activeTab, fallbackFoodState);
          render();
          return;
        }
        const primaryFood = findFoodById(foodState.selectedFoodId) ?? null;
        const defaultSecond = findDefaultSecondFood(primaryFood, allFoods);
        foodState = {
          ...foodState,
          mixedMode: true,
          secondSupplier: defaultSecond?.supplier ?? foodState.secondSupplier,
          secondFoodId: defaultSecond?.id ?? foodState.secondFoodId,
          wetPercent: MIXED_DEFAULT_WET_PERCENT,
        };
        applyPlannerStateToUrl(config, foodState, activeTab, fallbackFoodState);
        render();
      });

      secondSupplierInput?.addEventListener('change', () => {
        const supplier = secondSupplierInput.value;
        const nextFoods = supplierCatalog[supplier] ?? [];
        const currentSecond = findFoodById(foodState.secondFoodId);
        const nextSecondId =
          currentSecond && currentSecond.supplier === supplier
            ? currentSecond.id
            : (nextFoods[0]?.id ?? '');
        foodState = {
          ...foodState,
          secondSupplier: supplier,
          secondFoodId: nextSecondId,
        };
        applyPlannerStateToUrl(config, foodState, activeTab, fallbackFoodState);
        render();
      });

      secondProductInput?.addEventListener('change', () => {
        const nextSecondId = secondProductInput.value;
        if (!nextSecondId) {
          foodState = {
            ...foodState,
            mixedMode: false,
            secondFoodId: '',
          };
        } else {
          foodState = {
            ...foodState,
            secondFoodId: nextSecondId,
          };
        }
        applyPlannerStateToUrl(config, foodState, activeTab, fallbackFoodState);
        render();
      });

      secondClearButton?.addEventListener('click', () => {
        foodState = {
          ...foodState,
          mixedMode: false,
          secondFoodId: '',
        };
        applyPlannerStateToUrl(config, foodState, activeTab, fallbackFoodState);
        render();
      });

      const syncFoodInputs = (): void => {
        const nextSelectedFood =
          findFoodById(productInput?.value || foodState.selectedFoodId) ?? null;
        const profile = getFoodProfile(nextSelectedFood);
        const ageValue = parseInt(ageInput?.value ?? '1', 10) || 1;
        foodState = {
          ...foodState,
          // Only update ageMonths from input if DOB is not set (DOB takes priority)
          ageMonths: config.dob ? foodState.ageMonths : fromDisplayedAge(ageValue, profile.isPuppy),
          wetPercent: clampWetPercent(
            parseInt(wetPercentInput?.value ?? String(foodState.wetPercent), 10)
          ),
        };
        applyPlannerStateToUrl(config, foodState, activeTab, fallbackFoodState);
        render();
      };

      ageInput?.addEventListener('input', syncFoodInputs);
      wetPercentInput?.addEventListener('input', syncFoodInputs);
      container.querySelectorAll('.food-wet-preset').forEach((button) => {
        button.addEventListener('click', () => {
          const wetPreset = parseInt(
            (button as HTMLElement).getAttribute('data-wet-preset') ?? '',
            10
          );
          foodState = {
            ...foodState,
            wetPercent: clampWetPercent(wetPreset),
          };
          applyPlannerStateToUrl(config, foodState, activeTab, fallbackFoodState);
          render();
        });
      });

      container.querySelector('#btn-copy-food-link')?.addEventListener('click', async () => {
        const url = currentCanonicalUrl();
        const ok = await fallbackShare(url, t('share_message'));
        if (ok) {
          trackEvent(ANALYTICS_EVENTS.SHARE_SENT, {
            tab: activeTab,
            platform: 'copy_link',
            surface: 'food_hero',
          });
          showFeedback(t('link_copied'));
        } else {
          showFeedback(t('share_failed'));
        }
      });
    } else if (activeTab === 'dog') {
      const dogNameInput = container.querySelector('#dog-name') as HTMLInputElement | null;
      const dogDobInput = container.querySelector('#dog-dob') as HTMLInputElement | null;
      const dogWeightInput = container.querySelector('#dog-weight') as HTMLInputElement | null;
      const dogBreedSizeInput = container.querySelector(
        '#dog-breed-size'
      ) as HTMLSelectElement | null;
      const dogActivityInput = container.querySelector('#dog-activity') as HTMLSelectElement | null;
      const dogNeuteredInput = container.querySelector('#dog-neutered') as HTMLInputElement | null;
      const dogGoalInput = container.querySelector('#dog-goal') as HTMLSelectElement | null;
      const dogForm = container.querySelector('#dog-form');

      const syncDog = (): void => {
        config = { ...config };
        config.name = dogNameInput?.value ?? config.name;
        config.dob = dogDobInput?.value ?? config.dob;
        foodState = {
          ...foodState,
          weightKg: Math.max(0.5, parseFloat(dogWeightInput?.value ?? '12') || 12),
          breedSize: (dogBreedSizeInput?.value as BreedSize) || foodState.breedSize,
          activityLevel: (dogActivityInput?.value as ActivityLevel) || foodState.activityLevel,
          neutered: dogNeuteredInput?.checked ?? foodState.neutered,
          weightGoal: (dogGoalInput?.value as WeightGoal) || foodState.weightGoal,
        };
        // DOB → ageMonths derivation
        if (config.dob) {
          const derived = dobToAgeMonths(config.dob);
          if (derived !== null) {
            foodState = { ...foodState, ageMonths: derived };
          }
        }
        errors = validate(config);
        applyPlannerStateToUrl(config, foodState, activeTab, fallbackFoodState);
        render();
      };

      dogForm?.addEventListener('input', syncDog);
      dogForm?.addEventListener('change', syncDog);

      container.querySelector('#lang-en')?.addEventListener('click', () => {
        if (config.lang !== 'en') {
          config = { ...config, lang: 'en' };
          applyPlannerStateToUrl(config, foodState, activeTab, fallbackFoodState);
          window.location.reload();
        }
      });
      container.querySelector('#lang-nl')?.addEventListener('click', () => {
        if (config.lang !== 'nl') {
          config = { ...config, lang: 'nl' };
          applyPlannerStateToUrl(config, foodState, activeTab, fallbackFoodState);
          window.location.reload();
        }
      });
    }
  }

  render();
  if (initialHadCorrections) {
    showFeedback(t('url_values_adjusted'));
  }
}
