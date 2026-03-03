/**
 * Share-as-image: renders branded share cards and a modal with format picker + download.
 */
import type { Config } from './config';
import type { FoodPlannerState } from './config';
import type { FoodEntry, PortionResult } from './food/types';
import { ANALYTICS_EVENTS, trackEvent } from './analytics';
import { getDogPhoto } from './dog-photo';

export type ShareFormat = 'story' | 'square' | 'wide';
export type ShareCardType = 'food' | 'dog';

const FORMAT_DIMS: Record<ShareFormat, { w: number; h: number }> = {
  story: { w: 1080, h: 1920 },
  square: { w: 1080, h: 1080 },
  wide: { w: 1200, h: 675 },
};

const FORMAT_LABELS: Record<ShareFormat, string> = {
  story: 'Story',
  square: 'Square',
  wide: 'Wide',
};

const FORMATS: ShareFormat[] = ['story', 'square', 'wide'];

export interface FoodShareData {
  selectedFood: FoodEntry | null;
  secondFood: FoodEntry | null;
  result: PortionResult | null;
  mixedCanApply: boolean;
  mixedSplit: { wetGrams: number; dryGrams: number } | null;
  wetPercent: number;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function brandingFooter(): string {
  const domain = typeof window !== 'undefined' ? window.location.host : 'puppycal.com';
  return `
    <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:auto;padding-top:24px;opacity:0.6">
      <img src="/icons/icon-original.png" alt="" style="width:24px;height:26px" />
      <span style="font-family:'DM Sans',system-ui,sans-serif;font-size:14px;color:#6b7280">${domain}</span>
    </div>`;
}

function mascotWatermark(): string {
  return `
    <div style="position:absolute;top:50%;right:-5%;transform:translateY(-50%);width:60%;opacity:0.10;pointer-events:none">
      <img src="/icons/icon-bg-2x.png" alt="" style="width:100%;height:auto" />
    </div>`;
}

function cardWrapper(format: ShareFormat, innerHtml: string): string {
  const dims = FORMAT_DIMS[format];
  const isWide = format === 'wide';
  const padding = isWide ? '48px 56px' : format === 'square' ? '56px 48px' : '80px 48px';
  const justify = isWide ? 'center' : 'center';

  return `
    <div style="
      width:${dims.w}px;height:${dims.h}px;
      background:#faf8f5;
      font-family:'DM Sans',system-ui,sans-serif;
      display:flex;flex-direction:column;align-items:center;justify-content:${justify};
      padding:${padding};
      position:relative;overflow:hidden;box-sizing:border-box;
    ">
      ${mascotWatermark()}
      <div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;flex:1">
        ${innerHtml}
      </div>
      ${brandingFooter()}
    </div>`;
}

export function renderFoodShareCard(
  config: Config,
  foodData: FoodShareData,
  format: ShareFormat,
  t: (key: string, params?: Record<string, string | number>) => string
): string {
  const { selectedFood, secondFood, result, mixedCanApply, mixedSplit, wetPercent } = foodData;
  if (!selectedFood || !result) return '';

  const dryPercent = 100 - wetPercent;
  const nameHtml = config.name
    ? `<p style="font-family:'DM Sans',system-ui,sans-serif;font-size:18px;color:#6b7280;margin:0 0 16px 0">${escapeHtml(config.name)}</p>`
    : '';

  const fontSize = format === 'wide' ? '72px' : format === 'square' ? '80px' : '96px';
  const unitSize = format === 'wide' ? '28px' : '32px';

  if (mixedCanApply && mixedSplit) {
    const perMealWet =
      config.meals > 1 ? Math.ceil(mixedSplit.wetGrams / config.meals) : mixedSplit.wetGrams;
    const perMealDry =
      config.meals > 1 ? Math.ceil(mixedSplit.dryGrams / config.meals) : mixedSplit.dryGrams;

    return cardWrapper(
      format,
      `
      ${nameHtml}
      <div style="display:flex;flex-direction:column;align-items:center;gap:6px;margin-bottom:20px">
        <span style="display:inline-flex;align-items:center;gap:4px;padding:4px 12px;border-radius:999px;background:rgba(45,90,61,0.1);color:#2d5a3d;font-size:13px;font-weight:500">
          <strong>${selectedFood.foodType === 'wet' ? t('food_type_wet') : t('food_type_dry')}</strong> ${escapeHtml(selectedFood.productName)}
        </span>
        ${secondFood ? `<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 12px;border-radius:999px;background:#f3f4f6;color:#4b5563;font-size:13px;font-weight:500"><strong>${secondFood.foodType === 'wet' ? t('food_type_wet') : t('food_type_dry')}</strong> ${escapeHtml(secondFood.productName)}</span>` : ''}
      </div>
      <div style="display:flex;align-items:baseline;justify-content:center;gap:24px">
        <div style="text-align:center">
          <p style="font-family:'Fraunces',Georgia,serif;font-size:${fontSize};font-weight:600;color:#2d5a3d;line-height:1;margin:0">
            ${perMealWet}<span style="font-size:${unitSize};margin-left:2px">g</span>
          </p>
          <p style="font-size:14px;color:#6b7280;margin:4px 0 0 0">${t('food_type_wet')}</p>
        </div>
        <span style="font-size:36px;color:#d1d5db;font-weight:300">+</span>
        <div style="text-align:center">
          <p style="font-family:'Fraunces',Georgia,serif;font-size:${fontSize};font-weight:600;color:#2d5a3d;line-height:1;margin:0">
            ${perMealDry}<span style="font-size:${unitSize};margin-left:2px">g</span>
          </p>
          <p style="font-size:14px;color:#6b7280;margin:4px 0 0 0">${t('food_type_dry')}</p>
        </div>
      </div>
      <p style="font-size:16px;font-weight:500;color:#4b5563;margin:12px 0 0 0">${config.meals > 1 ? t('result_label_per_meal') : t('result_label_per_day')}</p>
      ${config.meals > 1 ? `<span style="display:inline-block;margin-top:8px;padding:4px 12px;border-radius:999px;background:rgba(45,90,61,0.1);color:#2d5a3d;font-size:13px;font-weight:500">${t('result_meal_badge', { meals: String(config.meals) })}</span>` : ''}
      <p style="font-size:13px;color:#9ca3af;margin:8px 0 0 0">${t('mixed_split_applied', { wet: String(wetPercent), dry: String(dryPercent) })}</p>
      <p style="font-size:14px;color:#9ca3af;margin:4px 0 0 0">${config.meals > 1 ? t('result_daily_summary', { grams: String(result.gramsPerDay), kcal: String(result.estimatedKcalPerDay) }) : t('result_kcal', { kcal: String(result.estimatedKcalPerDay) })}</p>
    `
    );
  }

  const gramsDisplay =
    config.meals > 1 ? Math.ceil(result.gramsPerDay / config.meals) : result.gramsPerDay;

  return cardWrapper(
    format,
    `
    ${nameHtml}
    <p style="font-size:14px;color:#9ca3af;margin:0 0 16px 0;max-width:80%;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(selectedFood.brand)} ${escapeHtml(selectedFood.productName)} · ${selectedFood.foodType === 'wet' ? t('food_type_wet') : t('food_type_dry')}</p>
    <p style="font-family:'Fraunces',Georgia,serif;font-size:${format === 'wide' ? '96px' : '120px'};font-weight:600;color:#2d5a3d;line-height:1;margin:0">
      ${gramsDisplay}<span style="font-size:${format === 'wide' ? '36px' : '42px'};margin-left:4px">g</span>
    </p>
    <p style="font-size:18px;font-weight:500;color:#4b5563;margin:12px 0 0 0">${config.meals > 1 ? t('result_label_per_meal') : t('result_label_per_day')}</p>
    ${config.meals > 1 ? `<span style="display:inline-block;margin-top:10px;padding:4px 14px;border-radius:999px;background:rgba(45,90,61,0.1);color:#2d5a3d;font-size:14px;font-weight:500">${t('result_meal_badge', { meals: String(config.meals) })}</span>` : ''}
    <p style="font-size:15px;color:#9ca3af;margin:16px 0 0 0">${config.meals > 1 ? t('result_daily_summary', { grams: String(result.gramsPerDay), kcal: String(result.estimatedKcalPerDay) }) : t('result_kcal', { kcal: String(result.estimatedKcalPerDay) })}</p>
  `
  );
}

export function renderDogShareCard(
  config: Config,
  foodState: FoodPlannerState,
  format: ShareFormat,
  t: (key: string, params?: Record<string, string | number>) => string
): string {
  const activityLabel =
    { low: t('activity_low'), moderate: t('activity_moderate'), high: t('activity_high') }[
      foodState.activityLevel
    ] ?? foodState.activityLevel;
  const goalLabel =
    { maintain: t('goal_maintain'), lose: t('goal_lose') }[foodState.weightGoal] ??
    foodState.weightGoal;
  const breedLabel = config.breed ? t('breed_' + config.breed.replace(/-/g, '_')) : '—';

  const isWide = format === 'wide';
  const gridStyle = isWide
    ? 'display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px 32px;text-align:left'
    : 'display:grid;grid-template-columns:auto 1fr;gap:10px 20px;text-align:left';

  const isPuppy = foodState.ageMonths < 6;

  const rows = [
    { label: t('label_name'), value: config.name ? escapeHtml(config.name) : '—' },
    {
      label: t('label_dob'),
      value: config.dob ? config.dob.split('-').reverse().join('-') : '—',
    },
    { label: t('label_weight_kg'), value: `${foodState.weightKg.toFixed(1)} kg` },
    { label: t('label_breed'), value: breedLabel },
    ...(isPuppy ? [] : [{ label: t('label_activity'), value: activityLabel }]),
    ...(isPuppy ? [] : [{ label: t('label_goal'), value: goalLabel }]),
  ];

  const gridHtml = isWide
    ? rows
        .map(
          (r) =>
            `<div style="display:flex;flex-direction:column;gap:2px"><span style="font-size:13px;color:#9ca3af">${r.label}</span><span style="font-size:16px;color:#374151;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.value}</span></div>`
        )
        .join('')
    : rows
        .map(
          (r) =>
            `<dt style="font-size:14px;color:#9ca3af">${r.label}</dt><dd style="font-size:16px;color:#374151;font-weight:500;margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.value}</dd>`
        )
        .join('');

  const tag = isWide ? 'div' : 'dl';

  const dogPhoto = getDogPhoto();
  const avatarSize = isWide ? '80px' : '96px';
  const photoHtml = dogPhoto
    ? `<div style="width:${avatarSize};height:${avatarSize};border-radius:50%;overflow:hidden;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.1);margin-bottom:16px;flex-shrink:0">
        <img src="${dogPhoto}" alt="" style="width:100%;height:100%;object-fit:cover" />
      </div>`
    : '';

  return cardWrapper(
    format,
    `
    ${photoHtml}
    <p style="font-size:13px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 20px 0">${t('dog_profile_title')}</p>
    <div style="background:#f5f0e8;border-radius:16px;padding:${isWide ? '32px 40px' : '28px 32px'};width:100%;max-width:${isWide ? '100%' : '500px'};box-sizing:border-box">
      <${tag} style="${gridStyle}">
        ${gridHtml}
      </${tag}>
    </div>
  `
  );
}

function triggerDownload(blob: Blob, filename: string): void {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export interface ShareModalDeps {
  config: Config;
  foodState: FoodPlannerState;
  foodData: FoodShareData;
  t: (key: string, params?: Record<string, string | number>) => string;
  canonicalUrl: string;
}

export function openShareModal(cardType: ShareCardType, deps: ShareModalDeps): void {
  const { config, foodState, foodData, t, canonicalUrl } = deps;

  let currentFormat: ShareFormat = 'square';

  // Remove existing dialog if any
  document.querySelector('.share-dialog')?.remove();

  const dialog = document.createElement('dialog');
  dialog.className = 'share-dialog';

  function buildCardHtml(format: ShareFormat): string {
    if (cardType === 'food') {
      return renderFoodShareCard(config, foodData, format, t);
    }
    return renderDogShareCard(config, foodState, format, t);
  }

  function getPreviewScale(): number {
    const dims = FORMAT_DIMS[currentFormat];
    const maxW = 360;
    const maxH = 420;
    return Math.min(maxW / dims.w, maxH / dims.h);
  }

  function renderDialogContent(): string {
    const dims = FORMAT_DIMS[currentFormat];
    const scale = getPreviewScale();
    const scaledW = Math.round(dims.w * scale);
    const scaledH = Math.round(dims.h * scale);

    const titleKey = cardType === 'food' ? 'share_food_title' : 'share_dog_title';
    const title =
      t(titleKey) || (cardType === 'food' ? 'Share your food plan' : 'Share your dog badge');

    const formatButtons = FORMATS.map(
      (f) =>
        `<button type="button" class="share-format-btn ${f === currentFormat ? 'active' : ''}" data-format="${f}">${FORMAT_LABELS[f]}</button>`
    ).join('');

    return `
      <div class="share-dialog-header">
        <p class="share-dialog-title">${title}</p>
        <button type="button" class="share-dialog-close" aria-label="Close">&times;</button>
      </div>
      <div class="share-dialog-body">
        <div class="share-preview-wrapper" style="width:${scaledW}px;height:${scaledH}px">
          <div id="share-preview-content" style="transform:scale(${scale});transform-origin:top left;width:${dims.w}px;height:${dims.h}px">
            ${buildCardHtml(currentFormat)}
          </div>
        </div>
        <div class="share-format-picker">
          ${formatButtons}
        </div>
        <button type="button" id="share-download-btn" class="share-download-btn">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Download image
        </button>
        <p class="share-clipboard-msg" id="share-clipboard-msg"></p>
      </div>`;
  }

  dialog.innerHTML = renderDialogContent();
  document.body.appendChild(dialog);
  dialog.showModal();

  trackEvent(ANALYTICS_EVENTS.SHARE_IMAGE_OPENED, { tab: cardType });

  // Copy URL to clipboard immediately
  if (navigator.clipboard && navigator.clipboard.writeText) {
    void navigator.clipboard.writeText(canonicalUrl).then(() => {
      const msg = dialog.querySelector('#share-clipboard-msg');
      if (msg) msg.textContent = t('link_copied') || 'Link copied to clipboard';
    });
  }

  // Event: close button
  dialog.querySelector('.share-dialog-close')?.addEventListener('click', () => {
    dialog.close();
  });

  // Event: backdrop click
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });

  // Event: format toggle
  dialog.querySelectorAll('.share-format-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const format = (btn as HTMLElement).dataset.format as ShareFormat;
      if (format && format !== currentFormat) {
        currentFormat = format;
        dialog.innerHTML = renderDialogContent();
        bindDownload();
        bindFormatButtons();
        bindClose();
      }
    });
  });

  function bindFormatButtons(): void {
    dialog.querySelectorAll('.share-format-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const format = (btn as HTMLElement).dataset.format as ShareFormat;
        if (format && format !== currentFormat) {
          currentFormat = format;
          dialog.innerHTML = renderDialogContent();
          bindDownload();
          bindFormatButtons();
          bindClose();
        }
      });
    });
  }

  function bindClose(): void {
    dialog.querySelector('.share-dialog-close')?.addEventListener('click', () => {
      dialog.close();
    });
  }

  function bindDownload(): void {
    dialog.querySelector('#share-download-btn')?.addEventListener('click', async () => {
      const previewEl = dialog.querySelector('#share-preview-content') as HTMLElement | null;
      if (!previewEl) return;

      const btn = dialog.querySelector('#share-download-btn') as HTMLButtonElement;
      const originalText = btn.innerHTML;
      btn.disabled = true;
      btn.textContent = 'Rendering...';

      try {
        const html2canvas = (await import('html2canvas')).default;
        const dims = FORMAT_DIMS[currentFormat];
        const canvas = await html2canvas(previewEl, {
          width: dims.w,
          height: dims.h,
          scale: 1,
          useCORS: true,
          backgroundColor: '#faf8f5',
        });

        canvas.toBlob((blob) => {
          if (blob) {
            triggerDownload(blob, `puppycal-${cardType}-${currentFormat}.png`);
            trackEvent(ANALYTICS_EVENTS.SHARE_IMAGE_DOWNLOADED, {
              tab: cardType,
            });
          }
          btn.disabled = false;
          btn.innerHTML = originalText;
        }, 'image/png');
      } catch {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    });
  }

  bindDownload();

  // Cleanup on close
  dialog.addEventListener('close', () => {
    dialog.remove();
  });
}
