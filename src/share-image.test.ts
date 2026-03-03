/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  renderFoodShareCard,
  renderDogShareCard,
  openShareModal,
  type FoodShareData,
  type ShareFormat,
} from './share-image';
import type { Config } from './config';
import type { FoodPlannerState } from './config';
import type { FoodEntry, PortionResult } from './food/types';

const t = (key: string, params: Record<string, string | number> = {}): string => {
  const base: Record<string, string> = {
    food_type_wet: 'Wet',
    food_type_dry: 'Dry',
    result_label_per_meal: 'per meal',
    result_label_per_day: 'per day',
    result_meal_badge: `${params.meals}× per day`,
    result_daily_summary: `${params.grams}g / day · ${params.kcal} kcal`,
    result_kcal: `${params.kcal} kcal / day`,
    mixed_split_applied: `${params.wet}% wet / ${params.dry}% dry`,
    dog_profile_title: 'Dog Profile',
    label_name: 'Name',
    label_dob: 'Date of birth',
    label_weight_kg: 'Weight',
    label_breed: 'Breed',
    label_activity: 'Activity',
    label_goal: 'Goal',
    activity_low: 'Low',
    activity_moderate: 'Moderate',
    activity_high: 'High',
    goal_maintain: 'Maintain',
    goal_lose: 'Lose weight',
    breed_stabyhoun: 'Stabyhoun',
    link_copied: 'Link copied',
    share_food_title: 'Share your food plan',
    share_dog_title: 'Share your dog badge',
  };
  return base[key] ?? key;
};

function makeConfig(overrides: Partial<Config> = {}): Config {
  return {
    lang: 'en',
    dob: '2025-01-15',
    months: 3,
    start: '2025-03-01',
    breed: 'stabyhoun',
    birthday: true,
    name: 'Biko',
    notes: '',
    feeding: false,
    meals: 3,
    gramsStart: 200,
    gramsEnd: 280,
    ...overrides,
  };
}

function makeFoodState(overrides: Partial<FoodPlannerState> = {}): FoodPlannerState {
  return {
    selectedSupplier: 'purina',
    selectedFoodId: 'purina-puppy-dry-1',
    mixedMode: false,
    secondSupplier: 'purina',
    secondFoodId: '',
    wetPercent: 50,
    ageMonths: 4,
    weightKg: 8.5,
    activityLevel: 'moderate',
    neutered: false,
    breedSize: 'medium',
    weightGoal: 'maintain',
    ...overrides,
  };
}

function makeFoodEntry(overrides: Partial<FoodEntry> = {}): FoodEntry {
  return {
    id: 'purina-puppy-dry-1',
    supplier: 'purina',
    brand: 'Purina Pro Plan',
    productName: 'Puppy Medium',
    isPuppy: true,
    lifeStage: 'puppy',
    breedSizeTarget: 'medium',
    foodType: 'dry',
    packageSize: '3kg',
    ingredients: [],
    guaranteedAnalysis: {
      proteinMinPercent: 28,
      fatMinPercent: 18,
      fiberMaxPercent: 3,
      moistureMaxPercent: 12,
    },
    feedingGuide: { reference: 'purina.com' },
    calories: { kcalPerKg: 3800 },
    sourceUrl: 'https://purina.com',
    sourceDate: '2025-01-01',
    ...overrides,
  };
}

function makeResult(overrides: Partial<PortionResult> = {}): PortionResult {
  return {
    gramsPerDay: 285,
    estimatedKcalPerDay: 1083,
    assumptions: [],
    densityKcalPerKg: 3800,
    usedFallbackKcal: false,
    ...overrides,
  };
}

describe('renderFoodShareCard', () => {
  const food = makeFoodEntry();
  const result = makeResult();

  it('returns empty string when no food or result', () => {
    const data: FoodShareData = {
      selectedFood: null,
      secondFood: null,
      result: null,
      mixedCanApply: false,
      mixedSplit: null,
      wetPercent: 50,
    };
    expect(renderFoodShareCard(makeConfig(), data, 'square', t)).toBe('');
  });

  it('renders single-food card with gram amount', () => {
    const data: FoodShareData = {
      selectedFood: food,
      secondFood: null,
      result,
      mixedCanApply: false,
      mixedSplit: null,
      wetPercent: 50,
    };
    const html = renderFoodShareCard(makeConfig(), data, 'square', t);
    // Per meal: ceil(285/3) = 95
    expect(html).toContain('95');
    expect(html).toContain('g');
    expect(html).toContain('per meal');
    expect(html).toContain('Purina Pro Plan');
    expect(html).toContain('Puppy Medium');
  });

  it('shows per day when meals = 1', () => {
    const data: FoodShareData = {
      selectedFood: food,
      secondFood: null,
      result,
      mixedCanApply: false,
      mixedSplit: null,
      wetPercent: 50,
    };
    const html = renderFoodShareCard(makeConfig({ meals: 1 }), data, 'square', t);
    expect(html).toContain('285');
    expect(html).toContain('per day');
    expect(html).not.toContain('per meal');
  });

  it('includes dog name when provided', () => {
    const data: FoodShareData = {
      selectedFood: food,
      secondFood: null,
      result,
      mixedCanApply: false,
      mixedSplit: null,
      wetPercent: 50,
    };
    const html = renderFoodShareCard(makeConfig({ name: 'Biko' }), data, 'square', t);
    expect(html).toContain('Biko');
  });

  it('omits name when empty', () => {
    const data: FoodShareData = {
      selectedFood: food,
      secondFood: null,
      result,
      mixedCanApply: false,
      mixedSplit: null,
      wetPercent: 50,
    };
    const html = renderFoodShareCard(makeConfig({ name: '' }), data, 'square', t);
    expect(html).not.toContain('font-size:24px;color:#6b7280');
  });

  it('renders mixed mode with wet + dry split', () => {
    const wetFood = makeFoodEntry({ id: 'wet-1', foodType: 'wet', productName: 'Chicken Mousse' });
    const data: FoodShareData = {
      selectedFood: wetFood,
      secondFood: food,
      result,
      mixedCanApply: true,
      mixedSplit: { wetGrams: 143, dryGrams: 142 },
      wetPercent: 50,
    };
    const html = renderFoodShareCard(makeConfig(), data, 'square', t);
    // Per meal: ceil(143/3) = 48, ceil(142/3) = 48
    expect(html).toContain('48');
    expect(html).toContain('Wet');
    expect(html).toContain('Dry');
    expect(html).toContain('+');
    expect(html).toContain('Chicken Mousse');
    expect(html).toContain('Puppy Medium');
  });

  it.each<ShareFormat>(['story', 'square', 'wide'])('adapts dimensions for %s format', (format) => {
    const data: FoodShareData = {
      selectedFood: food,
      secondFood: null,
      result,
      mixedCanApply: false,
      mixedSplit: null,
      wetPercent: 50,
    };
    const html = renderFoodShareCard(makeConfig(), data, format, t);
    const dims: Record<ShareFormat, { w: number; h: number }> = {
      story: { w: 1080, h: 1920 },
      square: { w: 1080, h: 1080 },
      wide: { w: 1200, h: 675 },
    };
    expect(html).toContain(`width:${dims[format].w}px`);
    expect(html).toContain(`height:${dims[format].h}px`);
  });

  it('includes mascot watermark and branding footer', () => {
    const data: FoodShareData = {
      selectedFood: food,
      secondFood: null,
      result,
      mixedCanApply: false,
      mixedSplit: null,
      wetPercent: 50,
    };
    const html = renderFoodShareCard(makeConfig(), data, 'square', t);
    expect(html).toContain('icon-bg-2x.png');
    expect(html).toContain('icon-original.png');
  });

  it('escapes HTML in food names', () => {
    const xssFood = makeFoodEntry({ productName: '<script>alert(1)</script>' });
    const data: FoodShareData = {
      selectedFood: xssFood,
      secondFood: null,
      result,
      mixedCanApply: false,
      mixedSplit: null,
      wetPercent: 50,
    };
    const html = renderFoodShareCard(makeConfig(), data, 'square', t);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});

describe('renderDogShareCard', () => {
  it('renders dog profile fields', () => {
    const html = renderDogShareCard(
      makeConfig({ name: 'Biko', dob: '2025-01-15' }),
      makeFoodState({
        weightKg: 8.5,
        ageMonths: 12,
        activityLevel: 'moderate',
        weightGoal: 'maintain',
      }),
      'square',
      t
    );
    expect(html).toContain('Biko');
    expect(html).toContain('15-01-2025');
    expect(html).toContain('8.5 kg');
    expect(html).toContain('Moderate');
    expect(html).toContain('Maintain');
    expect(html).toContain('Dog Profile');
  });

  it('hides activity and goal for puppies', () => {
    const html = renderDogShareCard(
      makeConfig({ name: 'Biko' }),
      makeFoodState({ ageMonths: 3, activityLevel: 'moderate', weightGoal: 'maintain' }),
      'square',
      t
    );
    expect(html).not.toContain('Moderate');
    expect(html).not.toContain('Maintain');
  });

  it('shows dash for missing name', () => {
    const html = renderDogShareCard(makeConfig({ name: '' }), makeFoodState(), 'square', t);
    // The value cell should contain —
    expect(html).toContain('—');
  });

  it('uses single-column stacked layout for wide format', () => {
    const html = renderDogShareCard(makeConfig(), makeFoodState(), 'wide', t);
    expect(html).toContain('flex-direction:column');
    expect(html).not.toContain('<dl');
  });

  it('uses 2-column dl grid for story/square', () => {
    const html = renderDogShareCard(makeConfig(), makeFoodState(), 'story', t);
    expect(html).toContain('grid-template-columns:auto 1fr');
    expect(html).toContain('<dl');
  });

  it.each<ShareFormat>(['story', 'square', 'wide'])('renders at correct dims for %s', (format) => {
    const html = renderDogShareCard(makeConfig(), makeFoodState(), format, t);
    const dims: Record<ShareFormat, { w: number; h: number }> = {
      story: { w: 1080, h: 1920 },
      square: { w: 1080, h: 1080 },
      wide: { w: 1200, h: 675 },
    };
    expect(html).toContain(`width:${dims[format].w}px`);
    expect(html).toContain(`height:${dims[format].h}px`);
  });
});

describe('openShareModal', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    // Stub dialog methods not available in jsdom/happy-dom
    HTMLDialogElement.prototype.showModal =
      HTMLDialogElement.prototype.showModal ||
      vi.fn(function (this: HTMLDialogElement) {
        this.setAttribute('open', '');
      });
    HTMLDialogElement.prototype.close =
      HTMLDialogElement.prototype.close ||
      vi.fn(function (this: HTMLDialogElement) {
        this.removeAttribute('open');
        this.dispatchEvent(new Event('close'));
      });

    // Stub clipboard
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  const deps = {
    config: makeConfig(),
    foodState: makeFoodState(),
    foodData: {
      selectedFood: makeFoodEntry(),
      secondFood: null,
      result: makeResult(),
      mixedCanApply: false,
      mixedSplit: null,
      wetPercent: 50,
    } as FoodShareData,
    t,
    canonicalUrl: 'https://puppy-ics.vercel.app/?tab=food',
  };

  it('opens a dialog element in the DOM', () => {
    openShareModal('food', deps);
    const dialog = document.querySelector('.share-dialog') as HTMLDialogElement;
    expect(dialog).not.toBeNull();
    expect(dialog.hasAttribute('open')).toBe(true);
  });

  it('shows the food title for food cards', () => {
    openShareModal('food', deps);
    const title = document.querySelector('.share-dialog-title');
    expect(title?.textContent).toBe('Share your food plan');
  });

  it('shows the dog title for dog cards', () => {
    openShareModal('dog', deps);
    const title = document.querySelector('.share-dialog-title');
    expect(title?.textContent).toBe('Share your dog badge');
  });

  it('renders three format buttons', () => {
    openShareModal('food', deps);
    const btns = document.querySelectorAll('.share-format-btn');
    expect(btns.length).toBe(3);
    expect(btns[0].textContent).toBe('Story');
    expect(btns[1].textContent).toBe('Square');
    expect(btns[2].textContent).toBe('Wide');
  });

  it('defaults to square format as active', () => {
    openShareModal('food', deps);
    const active = document.querySelector('.share-format-btn.active');
    expect(active?.textContent).toBe('Square');
  });

  it('does NOT auto-copy to clipboard on open', () => {
    openShareModal('food', deps);
    expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
  });

  it('copies URL when copy link button is clicked', () => {
    openShareModal('food', deps);
    const copyBtn = document.querySelector('#share-copy-link-btn') as HTMLButtonElement;
    expect(copyBtn).not.toBeNull();
    copyBtn.click();
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'https://puppy-ics.vercel.app/?tab=food'
    );
  });

  it('renders the share preview content', () => {
    openShareModal('food', deps);
    const preview = document.querySelector('#share-preview-content');
    expect(preview).not.toBeNull();
    expect(preview?.innerHTML).toContain('Purina Pro Plan');
  });

  it('has a download button', () => {
    openShareModal('food', deps);
    const btn = document.querySelector('#share-download-btn');
    expect(btn).not.toBeNull();
    // Button text comes from t('share_download_btn') which returns the key in test
    expect(btn?.textContent).toBeTruthy();
  });

  it('removes previous dialog when opening a new one', () => {
    openShareModal('food', deps);
    openShareModal('dog', deps);
    const dialogs = document.querySelectorAll('.share-dialog');
    expect(dialogs.length).toBe(1);
    expect(document.querySelector('.share-dialog-title')?.textContent).toBe('Share your dog badge');
  });

  it('closes and removes dialog on close button click', () => {
    openShareModal('food', deps);
    const closeBtn = document.querySelector('.share-dialog-close') as HTMLButtonElement;
    closeBtn.click();
    expect(document.querySelector('.share-dialog')).toBeNull();
  });

  it('switches format when a format button is clicked', async () => {
    openShareModal('food', deps);
    const storyBtn = document.querySelector(
      '.share-format-btn[data-format="story"]'
    ) as HTMLButtonElement;
    storyBtn.click();
    // Cross-fade uses a 200ms timeout before DOM update
    await new Promise((r) => setTimeout(r, 250));
    // After click the dialog re-renders with story active
    const active = document.querySelector('.share-format-btn.active');
    expect(active?.textContent).toBe('Story');
    // Preview dimensions should reflect story format (1080x1920 scaled)
    const preview = document.querySelector('#share-preview-content') as HTMLElement;
    expect(preview?.style.width).toBe('1080px');
    expect(preview?.style.height).toBe('1920px');
  });
});
