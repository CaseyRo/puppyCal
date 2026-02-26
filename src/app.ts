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

const BUY_ME_A_COFFEE_URL = 'https://buymeacoffee.com/caseyberlin';
const CASEY_DIT_URL = 'https://casey.berlin/DIT';
const DEFAULT_REPO_URL = __CONFIG__.repoUrl || 'https://github.com/CaseyRo/puppyCal';
const SOCIAL_SHARE_TEXT = 'Plan your puppy walkies and food schedule';

function currentCanonicalUrl(): string {
  return `${window.location.origin}${window.location.pathname}${window.location.search}`;
}

function mailtoWithContext(to: string, subject: string, intro: string): string {
  const body = `${intro}\n\nPage reference: ${window.location.href}`;
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

async function fallbackShare(url: string): Promise<boolean> {
  if (navigator.share) {
    try {
      await navigator.share({ url, text: SOCIAL_SHARE_TEXT });
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

  return {
    state: {
      ...foodState,
      selectedSupplier,
      selectedFoodId,
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
        activeTab: 'walkies',
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
  applyPlannerStateToUrl(config, foodState, activeTab, fallbackFoodState);

  const i18n = await loadI18n(config.lang);
  let errors: ValidationErrors = validate(config);
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
                <span aria-hidden="true">${platform.icon}</span> ${platform.label}
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
          <input type="date" id="dob" value="${config.dob}" aria-describedby="dob-err" aria-invalid="${errors.dob ? 'true' : 'false'}"
            class="w-full border rounded px-3 py-2 ${errors.dob ? 'border-red-600 ring-1 ring-red-600' : 'border-gray-300'}"/>
          ${errors.dob ? `<p id="dob-err" class="text-red-600 text-sm mt-1" role="alert">${t(errors.dob)}</p>` : `<p class="text-xs text-gray-500 mt-1">${t('hint_dob')}</p>`}
        </div>
        <div>
          <label for="months" class="block text-sm font-medium mb-1">${t('label_months')} ${infoIcon(
            t('hint_months')
          )}</label>
          <div class="inline-flex items-center gap-2">
            <button type="button" id="months-decrease" class="h-8 w-8 rounded border border-gray-300 text-gray-700 hover:bg-gray-100" aria-label="${t('months_decrease')}">-</button>
            <input type="number" id="months" min="1" max="12" value="${config.months}" aria-describedby="months-err" aria-invalid="${errors.months ? 'true' : 'false'}"
              class="w-16 text-center border rounded px-2 py-1 ${errors.months ? 'border-red-600 ring-1 ring-red-600' : 'border-gray-300'}"/>
            <button type="button" id="months-increase" class="h-8 w-8 rounded border border-gray-300 text-gray-700 hover:bg-gray-100" aria-label="${t('months_increase')}">+</button>
          </div>
          ${errors.months ? `<p id="months-err" class="text-red-600 text-sm mt-1" role="alert">${t(errors.months)}</p>` : `<p class="text-xs text-gray-500 mt-1">${t('hint_months')}</p>`}
        </div>
        <div>
          <label for="start" class="block text-sm font-medium mb-1">${t('label_start')} ${infoIcon(
            t('hint_start')
          )}</label>
          <input type="date" id="start" value="${config.start}" aria-describedby="start-err" aria-invalid="${errors.start ? 'true' : 'false'}"
            class="w-full border rounded px-3 py-2 ${errors.start ? 'border-red-600 ring-1 ring-red-600' : 'border-gray-300'}"/>
          ${errors.start ? `<p id="start-err" class="text-red-600 text-sm mt-1" role="alert">${t(errors.start)}</p>` : `<p class="text-xs text-gray-500 mt-1">${t('hint_start')}</p>`}
        </div>
        <div>
          <label for="name" class="block text-sm font-medium mb-1">${t('label_name')} ${infoIcon(
            t('hint_name')
          )}</label>
          <input type="text" id="name" value="${config.name}" placeholder=""
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
        <div>
          <label for="notes" class="block text-sm font-medium mb-1">${t('label_notes')} ${infoIcon(
            t('hint_notes')
          )}</label>
          <textarea id="notes" rows="2" class="w-full border border-gray-300 rounded px-3 py-2">${config.notes}</textarea>
          <p class="text-xs text-gray-500 mt-1">${t('hint_notes')}</p>
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

  function renderFood(): string {
    const suppliers = Object.keys(supplierCatalog).sort();
    const foodsForSupplier = supplierCatalog[foodState.selectedSupplier] ?? [];
    const selectedFood = findFoodById(foodState.selectedFoodId) ?? foodsForSupplier[0] ?? null;
    const profile = getFoodProfile(selectedFood);
    const ageLabel = profile.isPuppy ? t('label_age_months') : t('label_age_years');
    const ageHint = profile.isPuppy ? t('hint_age_months') : t('hint_age_years');
    const displayedAge = toDisplayedAge(foodState.ageMonths, profile.isPuppy);
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
    const infoIcon = (text: string): string =>
      `<span class="inline-flex items-center justify-center w-4 h-4 rounded-full border border-gray-300 text-[10px] text-gray-500 ml-1" title="${text}" aria-label="${text}">i</span>`;

    return `
      <section aria-label="${t('section_food')}">
      <h2 class="text-lg font-semibold mb-4">${t('section_food')}</h2>
      ${
        catalogValidation.errors.length
          ? `<p class="text-sm text-red-700 mb-3">${t('data_error_prefix')} ${catalogValidation.errors[0]}</p>`
          : ''
      }
      <form id="food-form" class="space-y-4" novalidate>
        <div>
          <label for="food-supplier" class="block text-sm font-medium mb-1">${t('label_supplier')}</label>
          <select id="food-supplier" class="w-full border border-gray-300 rounded px-3 py-2">
            ${suppliers
              .map(
                (supplier) =>
                  `<option value="${supplier}" ${
                    supplier === foodState.selectedSupplier ? 'selected' : ''
                  }>${supplier}</option>`
              )
              .join('')}
          </select>
        </div>
        <div>
          <label for="food-product" class="block text-sm font-medium mb-1">${t('label_product')}</label>
          <select id="food-product" class="w-full border border-gray-300 rounded px-3 py-2">
            ${foodsForSupplier
              .map(
                (food) =>
                  `<option value="${food.id}" ${
                    food.id === foodState.selectedFoodId ? 'selected' : ''
                  }>${food.brand} - ${food.productName}</option>`
              )
              .join('')}
          </select>
        </div>
        <div>
          <label for="food-age" class="block text-sm font-medium mb-1">${ageLabel} ${infoIcon(ageHint)}</label>
          <input id="food-age" type="number" min="1" max="${profile.isPuppy ? 24 : 20}" step="1" value="${displayedAge}"
            class="w-full border border-gray-300 rounded px-3 py-2"/>
          <p class="text-xs text-gray-500 mt-1">${ageHint}</p>
        </div>
        <div>
          <label for="food-weight-kg" class="block text-sm font-medium mb-1">${t('label_weight_kg')}</label>
          <input id="food-weight-kg" type="number" min="0.5" max="80" step="0.1" value="${foodState.weightKg}"
            class="w-full border border-gray-300 rounded px-3 py-2"/>
        </div>
        ${
          profile.isPuppy
            ? ''
            : `<div>
          <label for="food-activity" class="block text-sm font-medium mb-1">${t('label_activity')}</label>
          <select id="food-activity" class="w-full border border-gray-300 rounded px-3 py-2">
            <option value="low" ${foodState.activityLevel === 'low' ? 'selected' : ''}>${t('activity_low')}</option>
            <option value="moderate" ${foodState.activityLevel === 'moderate' ? 'selected' : ''}>${t('activity_moderate')}</option>
            <option value="high" ${foodState.activityLevel === 'high' ? 'selected' : ''}>${t('activity_high')}</option>
          </select>
        </div>
        <div class="flex items-center gap-2">
          <input id="food-neutered" type="checkbox" ${
            foodState.neutered ? 'checked' : ''
          } class="rounded border-gray-300 text-primary focus:ring-primary"/>
          <label for="food-neutered" class="text-sm font-medium">${t('label_neutered')}</label>
        </div>`
        }
        <div>
          <label for="food-breed-size" class="block text-sm font-medium mb-1">${t('label_breed_size')}</label>
          <select id="food-breed-size" class="w-full border border-gray-300 rounded px-3 py-2">
            <option value="small" ${foodState.breedSize === 'small' ? 'selected' : ''}>${t('breed_small')}</option>
            <option value="medium" ${foodState.breedSize === 'medium' ? 'selected' : ''}>${t('breed_medium')}</option>
            <option value="large" ${foodState.breedSize === 'large' ? 'selected' : ''}>${t('breed_large')}</option>
            <option value="giant" ${foodState.breedSize === 'giant' ? 'selected' : ''}>${t('breed_giant')}</option>
          </select>
        </div>
        ${
          profile.isPuppy
            ? ''
            : `<div>
          <label for="food-goal" class="block text-sm font-medium mb-1">${t('label_goal')}</label>
          <select id="food-goal" class="w-full border border-gray-300 rounded px-3 py-2">
            <option value="maintain" ${foodState.weightGoal === 'maintain' ? 'selected' : ''}>${t('goal_maintain')}</option>
            <option value="lose" ${foodState.weightGoal === 'lose' ? 'selected' : ''}>${t('goal_lose')}</option>
          </select>
        </div>`
        }
      </form>

      ${
        selectedFood && result
          ? `<div class="mt-6 border border-gray-200 rounded p-4 bg-white">
              <h3 class="font-semibold">${t('result_title')}</h3>
              <p class="text-2xl font-semibold text-primary mt-2">${t('result_grams', {
                grams: String(result.gramsPerDay),
              })}</p>
              <p class="text-sm text-gray-600">${t('result_kcal', {
                kcal: String(result.estimatedKcalPerDay),
              })}</p>
              <p class="text-sm mt-2">${t('result_advisory')}</p>
              <p class="text-sm mt-2"><strong>${t('result_source')}:</strong> <a class="text-primary underline" href="${
                selectedFood.sourceUrl
              }" target="_blank" rel="noreferrer">${selectedFood.sourceUrl}</a> (${selectedFood.sourceDate})</p>
              <p class="text-sm mt-2 font-medium">${t('result_assumptions')}:</p>
              <ul class="text-sm list-disc pl-5 mt-1">
                ${result.assumptions.map((item) => `<li>${item}</li>`).join('')}
              </ul>
            </div>`
          : ''
      }
      </section>
    `;
  }

  function render(): void {
    const valid = isValid(errors);
    const titleText = config.name ? t('title_for', { name: config.name }) : t('title');
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
             Open source collaboration: star the repo and join in.
           </a>`
        : `<a id="footer-food-data-link" href="${foodDataEmailHref}"
             class="text-gray-600 hover:text-primary underline text-[11px]">
             Add your food data to our widget.
           </a>`;

    container.innerHTML = `
      <div class="min-h-screen bg-background text-gray-800 font-sans px-4 py-6 max-w-lg mx-auto">
        <h1 class="text-2xl font-display font-semibold text-gray-900 mb-4">${titleText}</h1>
        <div class="mb-4 inline-flex rounded-lg border border-gray-200 overflow-hidden" role="tablist" aria-label="Planner tabs">
          <button type="button" id="tab-walkies" role="tab" aria-selected="${
            activeTab === 'walkies'
          }"
            class="px-4 py-2 text-sm font-medium ${
              activeTab === 'walkies' ? 'bg-primary text-white' : 'bg-white text-gray-700'
            }">${t('tab_walkies')}</button>
          <button type="button" id="tab-food" role="tab" aria-selected="${activeTab === 'food'}"
            class="px-4 py-2 text-sm font-medium ${
              activeTab === 'food' ? 'bg-primary text-white' : 'bg-white text-gray-700'
            }">${t('tab_food')}</button>
        </div>

        ${activeTab === 'walkies' ? renderWalkies(valid) : renderFood()}

        <footer class="mt-6 border-t border-gray-200 pt-4 space-y-2 text-xs text-gray-600" aria-label="${t(
          'footer_label'
        )}">
          <p class="text-gray-700 font-medium text-xs">${t('footer_disclaimer')}</p>
          <a id="footer-coffee-link" href="${BUY_ME_A_COFFEE_URL}" target="_blank" rel="noreferrer"
            class="inline-flex items-center rounded border border-gray-300 px-3 py-1 hover:bg-gray-50">${t(
              'footer_buy_coffee'
            )}</a>
          <div>${middleCta}</div>
          <a id="footer-brand-link" href="${CASEY_DIT_URL}" target="_blank" rel="noreferrer"
            class="text-[11px] text-gray-500 hover:text-primary">
            Next to :dog:, Casey does IT
          </a>
          <a id="footer-email-link" href="${generalEmailHref}" class="inline-flex items-center gap-2 text-[11px] text-gray-500 hover:text-primary">
            <i class="fa-solid fa-envelope" aria-hidden="true"></i><span>${t('footer_email_cta')}</span>
          </a>
        </footer>

        ${feedback ? `<p class="mt-4 text-primary font-medium" role="status">${feedback}</p>` : ''}
      </div>
    `;
    applyPlannerMetadata({
      activeTab,
      canonicalUrl: currentCanonicalUrl(),
    });

    container.querySelector('#tab-walkies')?.addEventListener('click', () => {
      activeTab = 'walkies';
      sharePickerOpen = false;
      applyPlannerStateToUrl(config, foodState, activeTab, fallbackFoodState);
      render();
    });
    container.querySelector('#tab-food')?.addEventListener('click', () => {
      activeTab = 'food';
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
      const notes = container.querySelector('#notes') as HTMLTextAreaElement;
      const monthsDecrease = container.querySelector(
        '#months-decrease'
      ) as HTMLButtonElement | null;
      const monthsIncrease = container.querySelector(
        '#months-increase'
      ) as HTMLButtonElement | null;

      function syncWalkies(event: Event): void {
        setConfig(
          (c) => {
            c.dob = dob?.value ?? '';
            const parsedMonths = parseInt(months?.value ?? '3', 10) || 3;
            c.months = Math.max(1, Math.min(12, parsedMonths));
            c.start = start?.value ?? c.start;
            c.birthday = birthday?.checked ?? true;
            c.name = nameInput?.value ?? '';
            c.notes = notes?.value ?? '';
            c.feeding = false;
          },
          { rerender: event.type !== 'input' }
        );
      }

      form?.addEventListener('input', syncWalkies);
      form?.addEventListener('change', syncWalkies);
      monthsDecrease?.addEventListener('click', () => {
        const next = Math.max(1, (parseInt(months.value || '3', 10) || 3) - 1);
        months.value = String(next);
        syncWalkies(new Event('change'));
      });
      monthsIncrease?.addEventListener('click', () => {
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
          trackEvent(ANALYTICS_EVENTS.SHARE_PLATFORM_SELECTED, {
            tab: activeTab,
            platform,
            surface: 'walkies',
          });
          const target = buildShareTarget(platform, url, SOCIAL_SHARE_TEXT);
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

          const fallbackOk = await fallbackShare(url);
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
    } else {
      const supplierInput = container.querySelector('#food-supplier') as HTMLSelectElement | null;
      const productInput = container.querySelector('#food-product') as HTMLSelectElement | null;
      const ageInput = container.querySelector('#food-age') as HTMLInputElement | null;
      const weightInput = container.querySelector('#food-weight-kg') as HTMLInputElement | null;
      const activityInput = container.querySelector('#food-activity') as HTMLSelectElement | null;
      const neuteredInput = container.querySelector('#food-neutered') as HTMLInputElement | null;
      const breedSizeInput = container.querySelector(
        '#food-breed-size'
      ) as HTMLSelectElement | null;
      const goalInput = container.querySelector('#food-goal') as HTMLSelectElement | null;

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

      const syncFoodInputs = (): void => {
        const nextSelectedFood =
          findFoodById(productInput?.value || foodState.selectedFoodId) ?? null;
        const profile = getFoodProfile(nextSelectedFood);
        const ageValue = parseInt(ageInput?.value ?? '1', 10) || 1;
        foodState = {
          ...foodState,
          ageMonths: fromDisplayedAge(ageValue, profile.isPuppy),
          weightKg: Math.max(0.5, parseFloat(weightInput?.value ?? '0.5') || 0.5),
          activityLevel: profile.isPuppy
            ? fallbackFoodState.activityLevel
            : (activityInput?.value as ActivityLevel) || 'moderate',
          neutered: profile.isPuppy ? false : (neuteredInput?.checked ?? false),
          breedSize: (breedSizeInput?.value as BreedSize) || 'medium',
          weightGoal: profile.isPuppy
            ? fallbackFoodState.weightGoal
            : (goalInput?.value as WeightGoal) || 'maintain',
        };
        applyPlannerStateToUrl(config, foodState, activeTab, fallbackFoodState);
        render();
      };

      ageInput?.addEventListener('input', syncFoodInputs);
      weightInput?.addEventListener('input', syncFoodInputs);
      activityInput?.addEventListener('change', syncFoodInputs);
      neuteredInput?.addEventListener('change', syncFoodInputs);
      breedSizeInput?.addEventListener('change', syncFoodInputs);
      goalInput?.addEventListener('change', syncFoodInputs);
    }
  }

  render();
  if (initialHadCorrections) {
    showFeedback(t('url_values_adjusted'));
  }
}
