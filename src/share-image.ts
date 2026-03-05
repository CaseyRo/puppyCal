/**
 * Share-as-image: renders branded share cards and a modal with format picker + download.
 * HTML render functions are used for in-modal preview.
 * Canvas 2D renderers are used for the download path (pixel-perfect output).
 */
import type { Config } from './config';
import type { FoodPlannerState } from './config';
import type { FoodEntry, PortionResult } from './food/types';
import { ANALYTICS_EVENTS, trackEvent } from './analytics';
import { getDogPhoto } from './dog-photo';
import { isSafeDataUrl, buildFilename, getSeasonalPalette } from './share-utils';
import type { SeasonalPalette } from './share-utils';
import {
  formatAge,
  formatAgeShort,
  getWeightMilestone,
  getBreedComparison,
} from './share-milestones';
import { getBirthdayContext, drawConfetti } from './share-birthday';
import type { BirthdayContext } from './share-birthday';
import { generateCaptions } from './share-captions';
import { dobToAgeMonths } from './app-helpers';

/** Shared rendering context passed to all card renderers. */
export interface CardContext {
  ageLabel: string | null;
  ageShort: string | null;
  birthday: BirthdayContext | null;
  weightMilestone: number | null;
  breedComparison: string | null;
  seasonal: SeasonalPalette;
}

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

// ---------------------------------------------------------------------------
// HTML render helpers (for in-modal preview only)
// ---------------------------------------------------------------------------

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function brandingFooter(hasPhoto: boolean): string {
  const domain = typeof window !== 'undefined' ? window.location.host : 'puppycal.com';
  const color = hasPhoto ? 'rgba(255,255,255,0.7)' : 'rgba(156,163,175,0.5)';
  return `
    <div style="position:absolute;bottom:32px;left:32px;display:flex;align-items:center;gap:6px;opacity:1">
      <img src="/icons/icon-original.png" alt="" style="width:20px;height:auto" />
      <span style="font-family:'DM Sans',system-ui,sans-serif;font-size:12px;color:${color}">${domain}</span>
    </div>`;
}

function mascotWatermark(): string {
  return `
    <div style="position:absolute;top:50%;right:-5%;transform:translateY(-50%);width:60%;opacity:0.06;pointer-events:none">
      <img src="/icons/icon-bg-2x.png" alt="" style="width:100%;height:auto" />
    </div>`;
}

function cardWrapper(format: ShareFormat, innerHtml: string, photoSrc: string | null): string {
  const dims = FORMAT_DIMS[format];
  const safePhoto = photoSrc && isSafeDataUrl(photoSrc) ? photoSrc : null;
  const hasPhoto = !!safePhoto;

  const bgStyle = hasPhoto
    ? `background-image:url('${safePhoto}');background-size:cover;background-position:center`
    : 'background:#faf8f5';

  const overlayHtml = hasPhoto
    ? `<div style="position:absolute;inset:0;background:rgba(0,0,0,0.45)"></div>
       <div style="position:absolute;left:0;right:0;bottom:0;height:50%;background:linear-gradient(to top,rgba(0,0,0,0.5),transparent)"></div>`
    : '';

  return `
    <div style="
      width:${dims.w}px;height:${dims.h}px;
      ${bgStyle};
      font-family:'DM Sans',system-ui,sans-serif;
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      position:relative;overflow:hidden;box-sizing:border-box;
    ">
      ${overlayHtml}
      ${!hasPhoto ? mascotWatermark() : ''}
      <div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;flex:1;padding:${format === 'wide' ? '48px 56px' : format === 'square' ? '56px 48px' : '80px 48px'};box-sizing:border-box">
        ${innerHtml}
      </div>
      ${brandingFooter(hasPhoto)}
    </div>`;
}

export function renderFoodShareCard(
  config: Config,
  foodData: FoodShareData,
  format: ShareFormat,
  t: (key: string, params?: Record<string, string | number>) => string,
  cardCtx?: CardContext
): string {
  const { selectedFood, secondFood, result, mixedCanApply, mixedSplit, wetPercent } = foodData;
  if (!selectedFood || !result) return '';

  const photoSrc = getDogPhoto();
  const hasPhoto = !!photoSrc;
  const dryPercent = 100 - wetPercent;
  const isBirthday = !!cardCtx?.birthday;
  const accent = isBirthday ? '#D4A843' : (cardCtx?.seasonal.accent ?? '#2d5a3d');

  // Color palette
  const nameColor = hasPhoto ? 'rgba(255,255,255,0.8)' : '#6b7280';
  const bigNumColor = hasPhoto ? '#ffffff' : '#2d5a3d';
  const labelColor = hasPhoto ? 'rgba(255,255,255,0.6)' : '#6b7280';
  const perLabelColor = hasPhoto ? 'rgba(255,255,255,0.8)' : '#4b5563';
  const summaryColor = hasPhoto ? 'rgba(255,255,255,0.6)' : '#9ca3af';
  const pillBg = hasPhoto ? 'rgba(255,255,255,0.15)' : `${accent}1a`;
  const pillColor = hasPhoto ? '#ffffff' : accent;
  const pillSecBg = hasPhoto ? 'rgba(255,255,255,0.10)' : '#f3f4f6';
  const pillSecColor = hasPhoto ? 'rgba(255,255,255,0.8)' : '#4b5563';

  // Scaled name + age pill + birthday badge
  const nameFontSize = format === 'wide' ? '28px' : format === 'square' ? '34px' : '42px';
  const agePillFontSize = format === 'wide' ? '20px' : format === 'square' ? '22px' : '26px';
  const bdayBadgeFontSize = format === 'wide' ? '18px' : format === 'square' ? '20px' : '24px';

  const agePillHtml = cardCtx?.ageShort
    ? `<p style="font-family:'Fraunces',Georgia,serif;font-size:${agePillFontSize};font-weight:500;color:${hasPhoto ? 'rgba(255,255,255,0.7)' : accent};margin:0 0 10px 0">${t('share_puppy_age_pill', { age: cardCtx.ageShort })}</p>`
    : '';

  const birthdayBadgeHtml = isBirthday
    ? `<span style="display:inline-block;margin-bottom:16px;padding:8px 24px;border-radius:999px;background:#D4A843;color:#ffffff;font-size:${bdayBadgeFontSize};font-weight:700;letter-spacing:0.02em">${cardCtx.birthday!.type === 'today' ? t('share_birthday_turns', { name: config.name || '🐾', age: String(cardCtx.birthday!.age) }) : t('share_birthday_badge')}</span>`
    : '';

  const nameHtml = config.name
    ? `<p style="font-family:'Fraunces',Georgia,serif;font-size:${nameFontSize};font-weight:700;color:${nameColor};margin:0 0 6px 0">${escapeHtml(config.name)}</p>`
    : '';

  // For story format, push content to lower 2/3 of the card
  const storyTopSpacer = format === 'story' ? '<div style="flex:1"></div>' : '';
  const topSection = `${storyTopSpacer}${nameHtml}${agePillHtml}${birthdayBadgeHtml}`;

  // Scaled-up sizes — fill the space!
  const fontSize = format === 'wide' ? '160px' : format === 'square' ? '190px' : '260px';
  const unitSize = format === 'wide' ? '56px' : format === 'square' ? '68px' : '88px';

  if (mixedCanApply && mixedSplit) {
    const perMealWet =
      config.meals > 1 ? Math.ceil(mixedSplit.wetGrams / config.meals) : mixedSplit.wetGrams;
    const perMealDry =
      config.meals > 1 ? Math.ceil(mixedSplit.dryGrams / config.meals) : mixedSplit.dryGrams;

    const mixedFontSize = format === 'wide' ? '110px' : format === 'square' ? '140px' : '180px';
    const mixedUnitSize = format === 'wide' ? '42px' : format === 'square' ? '52px' : '64px';

    return cardWrapper(
      format,
      `
      ${topSection}
      <div style="display:flex;flex-direction:column;align-items:center;gap:10px;margin-bottom:28px">
        <span style="display:inline-flex;align-items:center;gap:6px;padding:8px 22px;border-radius:999px;background:${pillBg};color:${pillColor};font-size:20px;font-weight:500">
          <strong>${selectedFood.foodType === 'wet' ? t('food_type_wet') : t('food_type_dry')}</strong> ${escapeHtml(selectedFood.productName)}
        </span>
        ${secondFood ? `<span style="display:inline-flex;align-items:center;gap:6px;padding:8px 22px;border-radius:999px;background:${pillSecBg};color:${pillSecColor};font-size:20px;font-weight:500"><strong>${secondFood.foodType === 'wet' ? t('food_type_wet') : t('food_type_dry')}</strong> ${escapeHtml(secondFood.productName)}</span>` : ''}
      </div>
      <div style="display:flex;align-items:baseline;justify-content:center;gap:32px">
        <div style="text-align:center">
          <p style="font-family:'Fraunces',Georgia,serif;font-size:${mixedFontSize};font-weight:600;color:${bigNumColor};line-height:1;margin:0">
            ${perMealWet}<span style="font-size:${mixedUnitSize};margin-left:2px">g</span>
          </p>
          <p style="font-size:22px;color:${labelColor};margin:8px 0 0 0">${t('food_type_wet')}</p>
        </div>
        <span style="font-size:56px;color:${hasPhoto ? 'rgba(255,255,255,0.3)' : '#d1d5db'};font-weight:300">+</span>
        <div style="text-align:center">
          <p style="font-family:'Fraunces',Georgia,serif;font-size:${mixedFontSize};font-weight:600;color:${bigNumColor};line-height:1;margin:0">
            ${perMealDry}<span style="font-size:${mixedUnitSize};margin-left:2px">g</span>
          </p>
          <p style="font-size:22px;color:${labelColor};margin:8px 0 0 0">${t('food_type_dry')}</p>
        </div>
      </div>
      <p style="font-size:28px;font-weight:500;color:${perLabelColor};margin:20px 0 0 0">${config.meals > 1 ? t('result_label_per_meal') : t('result_label_per_day')}</p>
      ${config.meals > 1 ? `<span style="display:inline-block;margin-top:14px;padding:8px 22px;border-radius:999px;background:${pillBg};color:${pillColor};font-size:20px;font-weight:500">${t('result_meal_badge', { meals: String(config.meals) })}</span>` : ''}
      <p style="font-size:20px;color:${summaryColor};margin:12px 0 0 0">${t('mixed_split_applied', { wet: String(wetPercent), dry: String(dryPercent) })}</p>
      <p style="font-size:22px;color:${summaryColor};margin:8px 0 0 0">${config.meals > 1 ? t('result_daily_summary', { grams: String(result.gramsPerDay), kcal: String(result.estimatedKcalPerDay) }) : t('result_kcal', { kcal: String(result.estimatedKcalPerDay) })}</p>
    `,
      photoSrc
    );
  }

  const gramsDisplay =
    config.meals > 1 ? Math.ceil(result.gramsPerDay / config.meals) : result.gramsPerDay;

  return cardWrapper(
    format,
    `
    ${topSection}
    <p style="font-size:22px;color:${summaryColor};margin:0 0 24px 0;max-width:85%;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(selectedFood.brand)} ${escapeHtml(selectedFood.productName)} &middot; ${selectedFood.foodType === 'wet' ? t('food_type_wet') : t('food_type_dry')}</p>
    <p style="font-family:'Fraunces',Georgia,serif;font-size:${fontSize};font-weight:600;color:${bigNumColor};line-height:0.9;margin:0">
      ${gramsDisplay}<span style="font-size:${unitSize};margin-left:4px">g</span>
    </p>
    <p style="font-size:30px;font-weight:500;color:${perLabelColor};margin:20px 0 0 0">${config.meals > 1 ? t('result_label_per_meal') : t('result_label_per_day')}</p>
    ${config.meals > 1 ? `<span style="display:inline-block;margin-top:16px;padding:8px 24px;border-radius:999px;background:${pillBg};color:${pillColor};font-size:22px;font-weight:500">${t('result_meal_badge', { meals: String(config.meals) })}</span>` : ''}
    <p style="font-size:24px;color:${summaryColor};margin:24px 0 0 0">${config.meals > 1 ? t('result_daily_summary', { grams: String(result.gramsPerDay), kcal: String(result.estimatedKcalPerDay) }) : t('result_kcal', { kcal: String(result.estimatedKcalPerDay) })}</p>
  `,
    photoSrc
  );
}

export function renderDogShareCard(
  config: Config,
  foodState: FoodPlannerState,
  format: ShareFormat,
  t: (key: string, params?: Record<string, string | number>) => string,
  cardCtx?: CardContext
): string {
  const photoSrc = getDogPhoto();
  const hasPhoto = !!photoSrc;
  const isBirthday = !!cardCtx?.birthday;
  const accent = isBirthday ? '#D4A843' : (cardCtx?.seasonal.accent ?? '#2d5a3d');

  const activityLabel =
    { low: t('activity_low'), moderate: t('activity_moderate'), high: t('activity_high') }[
      foodState.activityLevel
    ] ?? foodState.activityLevel;
  const goalLabel =
    { maintain: t('goal_maintain'), lose: t('goal_lose') }[foodState.weightGoal] ??
    foodState.weightGoal;
  const breedLabel = config.breed ? t('breed_' + config.breed.replace(/-/g, '_')) : '\u2014';

  const isWide = format === 'wide';
  const isPuppy = foodState.ageMonths < 6;

  // Color palette
  const titleColor = hasPhoto ? 'rgba(255,255,255,0.8)' : '#9ca3af';
  const nameColor = hasPhoto ? '#ffffff' : '#374151';
  const boxBg = hasPhoto ? 'rgba(255,255,255,0.15)' : '#f5f0e8';
  const labelColorVal = hasPhoto ? 'rgba(255,255,255,0.6)' : '#9ca3af';
  const valueColor = hasPhoto ? '#ffffff' : '#374151';
  const accentColor = hasPhoto ? '#ffffff' : accent;
  const badgeBg = isBirthday ? '#D4A843' : hasPhoto ? 'rgba(255,255,255,0.15)' : `${accent}1a`;
  const badgeColor = isBirthday ? '#ffffff' : accentColor;

  const rows = [
    { label: t('label_weight_kg'), value: `${foodState.weightKg.toFixed(1)} kg` },
    { label: t('label_breed'), value: breedLabel },
    ...(isPuppy ? [] : [{ label: t('label_activity'), value: activityLabel }]),
    ...(isPuppy ? [] : [{ label: t('label_goal'), value: goalLabel }]),
  ];

  // Scaled-up sizes — PUPPY POWER!
  const titleSize = isWide ? '20px' : format === 'square' ? '22px' : '30px';
  const nameSize = isWide ? '56px' : format === 'square' ? '80px' : '120px';
  const ageHeroSize = isWide ? '38px' : format === 'square' ? '52px' : '80px';
  const labelSize = isWide ? '18px' : format === 'square' ? '22px' : '30px';
  const valueSize = isWide ? '22px' : format === 'square' ? '28px' : '42px';
  const boxPad = isWide ? '36px 44px' : format === 'square' ? '40px 48px' : '64px 72px';
  const boxW = isWide ? '580px' : '960px';
  const boxRadius = '28px';
  const rowGap = isWide ? '12px' : format === 'square' ? '16px' : '36px';
  const badgeFontSize = isWide ? '16px' : format === 'square' ? '18px' : '24px';
  const badgePad = isWide ? '6px 18px' : format === 'square' ? '8px 22px' : '12px 32px';

  // Birthday title replacement or normal title
  const titleText =
    isBirthday && cardCtx.birthday!.type === 'today' && config.name
      ? t('share_birthday_turns', { name: config.name, age: String(cardCtx.birthday!.age) })
      : isBirthday
        ? t('share_birthday_week')
        : t('dog_profile_title');
  const titleHtml = `<p style="font-size:${titleSize};font-weight:700;color:${isBirthday ? '#D4A843' : titleColor};text-transform:uppercase;letter-spacing:0.12em;margin:0 0 12px 0">${escapeHtml(titleText)}</p>`;

  const nameHtml = config.name
    ? `<p style="font-family:'Fraunces',Georgia,serif;font-size:${nameSize};font-weight:700;color:${nameColor};line-height:1.05;margin:0 0 12px 0">${escapeHtml(config.name)}</p>`
    : '';

  // Age hero line (below name, above info box)
  const ageHeroHtml = cardCtx?.ageLabel
    ? `<p style="font-family:'Fraunces',Georgia,serif;font-size:${ageHeroSize};font-weight:600;color:${hasPhoto ? 'rgba(255,255,255,0.9)' : accent};margin:0 0 20px 0">${escapeHtml(cardCtx.ageLabel)}</p>`
    : '';

  // Badge row (weight milestone + breed comparison) — chunky and proud
  const badges: string[] = [];
  if (cardCtx?.weightMilestone) {
    badges.push(
      `<span style="display:inline-block;padding:${badgePad};border-radius:999px;background:${badgeBg};color:${badgeColor};font-size:${badgeFontSize};font-weight:700">${t('share_weight_milestone', { weight: String(cardCtx.weightMilestone) })}</span>`
    );
  }
  if (cardCtx?.breedComparison) {
    badges.push(
      `<span style="display:inline-block;padding:${badgePad};border-radius:999px;background:${hasPhoto ? 'rgba(255,255,255,0.12)' : '#f3f4f6'};color:${hasPhoto ? 'rgba(255,255,255,0.85)' : '#4b5563'};font-size:${badgeFontSize};font-weight:500">${escapeHtml(cardCtx.breedComparison)}</span>`
    );
  }
  const badgeRowHtml =
    badges.length > 0
      ? `<div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;margin-bottom:20px">${badges.join('')}</div>`
      : '';

  // --- Grid HTML for info fields ---
  // All formats now use stacked label/value (column layout) for clarity
  const gridHtml = rows
    .map(
      (r) =>
        `<div style="display:flex;flex-direction:column;gap:2px"><span style="font-size:${labelSize};color:${labelColorVal}">${r.label}</span><span style="font-size:${valueSize};color:${valueColor};font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.value}</span></div>`
    )
    .join('');

  if (isWide) {
    // --- Wide: left hero + right info box, vertically centered ---
    return cardWrapper(
      format,
      `<div style="display:flex;align-items:center;justify-content:space-between;width:100%;gap:40px;height:100%">
        <div style="flex:1;padding:0 0 0 60px">
          ${titleHtml}
          ${nameHtml}
          ${ageHeroHtml}
          ${badgeRowHtml}
        </div>
        <div style="background:${boxBg};border-radius:${boxRadius};padding:${boxPad};width:${boxW};box-sizing:border-box;margin:0 60px 0 0">
          <div style="display:flex;flex-direction:column;gap:${rowGap};text-align:left">${gridHtml}</div>
        </div>
      </div>`,
      photoSrc
    );
  }

  if (format === 'square') {
    // --- Square: 50/50 split — hero top half, info box bottom half ---
    return cardWrapper(
      format,
      `<div style="display:flex;flex-direction:column;width:100%;height:100%">
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 48px 20px">
          ${titleHtml}
          ${nameHtml}
          ${ageHeroHtml}
          ${badgeRowHtml}
        </div>
        <div style="flex:1;display:flex;align-items:center;justify-content:center;padding:20px 48px 40px">
          <div style="background:${boxBg};border-radius:${boxRadius};padding:${boxPad};width:100%;max-width:${boxW};box-sizing:border-box">
            <div style="display:flex;flex-direction:column;gap:${rowGap};text-align:left">${gridHtml}</div>
          </div>
        </div>
      </div>`,
      photoSrc
    );
  }

  // --- Story (portrait): fill the tall space, stacked fields ---
  return cardWrapper(
    format,
    `<div style="display:flex;flex-direction:column;width:100%;height:100%">
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 48px 32px">
        ${titleHtml}
        ${nameHtml}
        ${ageHeroHtml}
        ${badgeRowHtml}
      </div>
      <div style="flex:1;display:flex;align-items:center;justify-content:center;padding:32px 48px 80px">
        <div style="background:${boxBg};border-radius:${boxRadius};padding:${boxPad};width:100%;max-width:${boxW};box-sizing:border-box">
          <div style="display:flex;flex-direction:column;gap:${rowGap};text-align:left">${gridHtml}</div>
        </div>
      </div>
    </div>`,
    photoSrc
  );
}

// ---------------------------------------------------------------------------
// Canvas 2D rendering (for download path — pixel-perfect output)
// ---------------------------------------------------------------------------

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawPill(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  bg: string,
  color: string,
  text: string,
  fontSize: number,
  fontWeight: number | string = 500,
  hPad = 24
): { width: number; height: number } {
  ctx.font = `${fontWeight} ${fontSize}px 'DM Sans', system-ui, sans-serif`;
  const m = ctx.measureText(text);
  const pw = m.width + hPad * 2;
  const ph = fontSize + 16;
  const px = cx - pw / 2;

  roundRectPath(ctx, px, y, pw, ph, ph / 2);
  ctx.fillStyle = bg;
  ctx.fill();

  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, y + ph / 2);

  return { width: pw, height: ph };
}

function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  opts: {
    font: string;
    color: string;
    align?: CanvasTextAlign;
    baseline?: CanvasTextBaseline;
    maxWidth?: number;
    letterSpacing?: string;
  }
): void {
  ctx.font = opts.font;
  ctx.fillStyle = opts.color;
  ctx.textAlign = opts.align ?? 'center';
  ctx.textBaseline = opts.baseline ?? 'middle';

  // letterSpacing support (modern browsers)
  const prevSpacing = (ctx as unknown as Record<string, unknown>).letterSpacing;
  if (opts.letterSpacing) {
    (ctx as unknown as Record<string, unknown>).letterSpacing = opts.letterSpacing;
  }

  if (opts.maxWidth) {
    const m = ctx.measureText(text);
    if (m.width > opts.maxWidth) {
      // Truncate with ellipsis
      let truncated = text;
      while (truncated.length > 1 && ctx.measureText(truncated + '\u2026').width > opts.maxWidth) {
        truncated = truncated.slice(0, -1);
      }
      ctx.fillText(truncated + '\u2026', x, y);
    } else {
      ctx.fillText(text, x, y);
    }
  } else {
    ctx.fillText(text, x, y);
  }

  if (opts.letterSpacing) {
    (ctx as unknown as Record<string, unknown>).letterSpacing = prevSpacing;
  }
}

async function ensureFontsLoaded(): Promise<void> {
  if (!document.fonts) return;
  await Promise.all([
    document.fonts.load('400 16px "DM Sans"'),
    document.fonts.load('500 16px "DM Sans"'),
    document.fonts.load('600 16px "DM Sans"'),
    document.fonts.load('600 48px "Fraunces"'),
  ]);
}

/**
 * Draw dog photo as full-bleed cover-fit background with blur + dark overlay.
 * Returns true if photo was drawn, false if fallback was used.
 */
async function drawPhotoBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  photoSrc: string | null,
  overlayAlpha = 0.45
): Promise<boolean> {
  if (!photoSrc || !isSafeDataUrl(photoSrc)) return false;

  let img: HTMLImageElement;
  try {
    img = await loadImage(photoSrc);
  } catch {
    return false;
  }

  // Cover-fit: scale to fill, crop overflow, centered
  const imgW = img.naturalWidth;
  const imgH = img.naturalHeight;
  const scale = Math.max(w / imgW, h / imgH);
  const dw = imgW * scale;
  const dh = imgH * scale;
  const dx = (w - dw) / 2;
  const dy = (h - dh) / 2;

  // Draw with blur
  ctx.save();
  ctx.filter = 'blur(16px)';
  // Draw slightly larger to avoid blur edge artifacts
  ctx.drawImage(img, dx - 20, dy - 20, dw + 40, dh + 40);
  ctx.restore();

  // Dark overlay
  ctx.fillStyle = `rgba(0,0,0,${overlayAlpha})`;
  ctx.fillRect(0, 0, w, h);

  // Bottom gradient (from rgba(0,0,0,0.5) at bottom to transparent at 50% height)
  const grad = ctx.createLinearGradient(0, h, 0, h * 0.5);
  grad.addColorStop(0, 'rgba(0,0,0,0.5)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  return true;
}

/**
 * Draw branding in the bottom-left corner.
 */
async function drawBrandingCorner(
  ctx: CanvasRenderingContext2D,
  format: ShareFormat,
  hasPhoto: boolean
): Promise<void> {
  const { h } = FORMAT_DIMS[format];
  const isWide = format === 'wide';
  const x = isWide ? 28 : 32;
  const y = isWide ? h - 32 : h - 40;

  const domain = typeof window !== 'undefined' ? window.location.host : 'puppycal.com';
  const color = hasPhoto ? 'rgba(255,255,255,0.7)' : 'rgba(156,163,175,0.5)';

  try {
    const icon = await loadImage('/icons/icon-original.png');
    const iconH = 20;
    const iconW = (icon.naturalWidth / icon.naturalHeight) * iconH;

    ctx.save();
    ctx.drawImage(icon, x, y - iconH / 2, iconW, iconH);
    ctx.font = '400 12px "DM Sans", system-ui, sans-serif';
    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(domain, x + iconW + 6, y);
    ctx.restore();
  } catch {
    ctx.save();
    drawText(ctx, domain, x + 26, y, {
      font: '400 12px "DM Sans", system-ui, sans-serif',
      color,
      align: 'left',
    });
    ctx.restore();
  }
}

/**
 * Draw the card base: photo background or cream fallback + mascot, then branding corner.
 * Returns whether a photo background was drawn (for color palette switching).
 */
async function drawCardBase(
  ctx: CanvasRenderingContext2D,
  format: ShareFormat,
  photoSrc: string | null,
  overlayAlpha = 0.45
): Promise<boolean> {
  const { w, h } = FORMAT_DIMS[format];

  // Always fill cream first as base
  ctx.fillStyle = '#faf8f5';
  ctx.fillRect(0, 0, w, h);

  const hasPhoto = await drawPhotoBackground(ctx, w, h, photoSrc, overlayAlpha);

  if (!hasPhoto) {
    // Mascot watermark (6% opacity) as fallback
    try {
      const mascot = await loadImage('/icons/icon-bg-2x.png');
      const mw = w * 0.6;
      const mh = (mascot.naturalHeight / mascot.naturalWidth) * mw;
      const mx = w - mw + w * 0.05;
      const my = (h - mh) / 2;
      ctx.save();
      ctx.globalAlpha = 0.06;
      ctx.drawImage(mascot, mx, my, mw, mh);
      ctx.restore();
    } catch {
      // Mascot missing — skip silently
    }
  }

  await drawBrandingCorner(ctx, format, hasPhoto);

  return hasPhoto;
}

async function renderDogCardToCanvas(
  config: Config,
  foodState: FoodPlannerState,
  format: ShareFormat,
  t: TranslateFn,
  cardCtx?: CardContext
): Promise<HTMLCanvasElement> {
  await ensureFontsLoaded();

  const { w, h } = FORMAT_DIMS[format];
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const photoSrc = getDogPhoto();
  const hasPhoto = await drawCardBase(ctx, format, photoSrc);
  const isBirthday = !!cardCtx?.birthday;
  const accent = isBirthday ? '#D4A843' : (cardCtx?.seasonal.accent ?? '#2d5a3d');

  const isWide = format === 'wide';
  const isPuppy = foodState.ageMonths < 6;

  // Conditional color palette
  const titleColor = isBirthday ? '#D4A843' : hasPhoto ? 'rgba(255,255,255,0.8)' : '#9ca3af';
  const nameColor = hasPhoto ? '#ffffff' : '#374151';
  const boxBg = hasPhoto ? 'rgba(255,255,255,0.15)' : '#f5f0e8';
  const labelColor = hasPhoto ? 'rgba(255,255,255,0.6)' : '#9ca3af';
  const valueColor = hasPhoto ? '#ffffff' : '#374151';
  const ageColor = hasPhoto ? 'rgba(255,255,255,0.9)' : accent;

  const activityLabel =
    { low: t('activity_low'), moderate: t('activity_moderate'), high: t('activity_high') }[
      foodState.activityLevel
    ] ?? foodState.activityLevel;
  const goalLabel =
    { maintain: t('goal_maintain'), lose: t('goal_lose') }[foodState.weightGoal] ??
    foodState.weightGoal;
  const breedLabel = config.breed ? t('breed_' + config.breed.replace(/-/g, '_')) : '\u2014';

  // Birthday title replacement
  const titleText =
    isBirthday && cardCtx.birthday!.type === 'today' && config.name
      ? t('share_birthday_turns', { name: config.name, age: String(cardCtx.birthday!.age) })
      : isBirthday
        ? t('share_birthday_week')
        : t('dog_profile_title');

  const rows = [
    { label: t('share_label_name'), value: config.name || '\u2014' },
    {
      label: t('label_dob'),
      value: config.dob ? config.dob.split('-').reverse().join('-') : '\u2014',
    },
    { label: t('label_weight_kg'), value: `${foodState.weightKg.toFixed(1)} kg` },
    { label: t('label_breed'), value: breedLabel },
    ...(isPuppy ? [] : [{ label: t('label_activity'), value: activityLabel }]),
    ...(isPuppy ? [] : [{ label: t('label_goal'), value: goalLabel }]),
  ];

  if (isWide) {
    // --- Wide layout: title+name+age left (vertically centered), info box right ---
    const titleFontSize = 20;
    const nameFontSize = 56;
    const ageFontSize = 38;

    const labelFontSize = 18;
    const valueFontSize = 22;
    const rowGap = 12;
    const rowH = labelFontSize + valueFontSize + 6;
    const gridH = rows.length * rowH + (rows.length - 1) * rowGap;
    const boxPadX = 36;
    const boxPadY = 36;
    const boxW = 580;
    const boxH = gridH + boxPadY * 2;
    const boxX = 580;
    const boxY = Math.round((h - boxH) / 2);

    // Calculate left content height for vertical centering
    let leftContentH = titleFontSize + 16;
    if (config.name) leftContentH += nameFontSize + 14;
    if (cardCtx?.ageLabel) leftContentH += ageFontSize + 14;
    if (cardCtx?.weightMilestone) leftContentH += 38;
    let leftY = Math.round((h - leftContentH) / 2);

    // Title
    drawText(ctx, titleText.toUpperCase(), 60, leftY + titleFontSize / 2, {
      font: `700 ${titleFontSize}px "DM Sans", system-ui, sans-serif`,
      color: titleColor,
      align: 'left',
      letterSpacing: '0.12em',
    });
    leftY += titleFontSize + 16;

    // Dog name
    if (config.name) {
      drawText(ctx, config.name, 60, leftY + nameFontSize / 2, {
        font: `700 ${nameFontSize}px "Fraunces", Georgia, serif`,
        color: nameColor,
        align: 'left',
        maxWidth: 500,
      });
      leftY += nameFontSize + 14;
    }

    // Age hero
    if (cardCtx?.ageLabel) {
      drawText(ctx, cardCtx.ageLabel, 60, leftY + ageFontSize / 2, {
        font: `600 ${ageFontSize}px "Fraunces", Georgia, serif`,
        color: ageColor,
        align: 'left',
      });
      leftY += ageFontSize + 14;
    }

    // Badges (weight milestone, breed comparison) — chunky
    if (cardCtx?.weightMilestone) {
      drawPill(
        ctx,
        60 + 70,
        leftY,
        isBirthday ? '#D4A843' : hasPhoto ? 'rgba(255,255,255,0.15)' : `${accent}1a`,
        isBirthday ? '#ffffff' : hasPhoto ? '#ffffff' : accent,
        t('share_weight_milestone', { weight: String(cardCtx.weightMilestone) }),
        16,
        700
      );
      leftY += 38;
    }
    if (cardCtx?.breedComparison) {
      drawPill(
        ctx,
        60 + 90,
        leftY,
        hasPhoto ? 'rgba(255,255,255,0.12)' : '#f3f4f6',
        hasPhoto ? 'rgba(255,255,255,0.85)' : '#4b5563',
        cardCtx.breedComparison,
        16,
        500
      );
    }

    // Info box (right side, vertically centered)
    roundRectPath(ctx, boxX, boxY, boxW, boxH, 28);
    ctx.fillStyle = boxBg;
    ctx.fill();

    rows.forEach((row, i) => {
      const ry = boxY + boxPadY + i * (rowH + rowGap);
      drawText(ctx, row.label, boxX + boxPadX, ry + labelFontSize / 2, {
        font: `400 ${labelFontSize}px "DM Sans", system-ui, sans-serif`,
        color: labelColor,
        align: 'left',
      });
      drawText(ctx, row.value, boxX + boxPadX, ry + labelFontSize + 6 + valueFontSize / 2, {
        font: `500 ${valueFontSize}px "DM Sans", system-ui, sans-serif`,
        color: valueColor,
        align: 'left',
        maxWidth: boxW - boxPadX * 2 - 16,
      });
    });
  } else {
    // --- Story / Square layout: 50/50 split (hero top, info bottom) ---
    const isStory = format === 'story';
    const titleFontSize = isStory ? 30 : 22;
    const nameFontSize = isStory ? 120 : 80;
    const ageFontSize = isStory ? 80 : 52;
    const labelFontSize = isStory ? 30 : 22;
    const valueFontSize = isStory ? 42 : 28;
    const rowGap = isStory ? 36 : 16;
    const boxPadX = isStory ? 72 : 48;
    const boxPadY = isStory ? 64 : 40;
    const boxMaxW = 960;

    const cx = w / 2;
    const halfH = h / 2;

    // --- Top half: hero content (vertically centered in top half) ---
    let heroContentH = titleFontSize + 20;
    if (config.name) heroContentH += nameFontSize + 16;
    if (cardCtx?.ageLabel) heroContentH += ageFontSize + 16;
    // Badges
    let badgeTotalH = 0;
    const badgeFontSize = isStory ? 22 : 18;
    if (cardCtx?.weightMilestone) badgeTotalH += badgeFontSize + 16 + 10;
    if (cardCtx?.breedComparison) badgeTotalH += badgeFontSize + 16 + 10;
    if (badgeTotalH > 0) heroContentH += badgeTotalH + 8;

    let y = Math.max(Math.round((halfH - heroContentH) / 2), isStory ? 80 : 40);

    // Title
    drawText(ctx, titleText.toUpperCase(), cx, y + titleFontSize / 2, {
      font: `700 ${titleFontSize}px "DM Sans", system-ui, sans-serif`,
      color: titleColor,
      letterSpacing: '0.12em',
    });
    y += titleFontSize + 20;

    // Dog name
    if (config.name) {
      drawText(ctx, config.name, cx, y + nameFontSize / 2, {
        font: `700 ${nameFontSize}px "Fraunces", Georgia, serif`,
        color: nameColor,
        maxWidth: boxMaxW,
      });
      y += nameFontSize + 16;
    }

    // Age hero
    if (cardCtx?.ageLabel) {
      drawText(ctx, cardCtx.ageLabel, cx, y + ageFontSize / 2, {
        font: `600 ${ageFontSize}px "Fraunces", Georgia, serif`,
        color: ageColor,
      });
      y += ageFontSize + 16;
    }

    // Badge row
    let badgeY = y;
    if (cardCtx?.weightMilestone) {
      const { height: ph } = drawPill(
        ctx,
        cx,
        badgeY,
        isBirthday ? '#D4A843' : hasPhoto ? 'rgba(255,255,255,0.15)' : `${accent}1a`,
        isBirthday ? '#ffffff' : hasPhoto ? '#ffffff' : accent,
        t('share_weight_milestone', { weight: String(cardCtx.weightMilestone) }),
        badgeFontSize,
        600
      );
      badgeY += ph + 10;
    }
    if (cardCtx?.breedComparison) {
      const { height: ph } = drawPill(
        ctx,
        cx,
        badgeY,
        hasPhoto ? 'rgba(255,255,255,0.10)' : '#f3f4f6',
        hasPhoto ? 'rgba(255,255,255,0.8)' : '#4b5563',
        cardCtx.breedComparison,
        badgeFontSize,
        500
      );
      badgeY += ph + 10;
    }

    // --- Bottom half: info box (stacked label/value, vertically centered) ---
    // All formats use stacked label+value (column) layout
    const rowH = labelFontSize + valueFontSize + 6;
    const gridH = rows.length * rowH + (rows.length - 1) * rowGap;
    const boxH = gridH + boxPadY * 2;
    const boxX = cx - boxMaxW / 2;
    const boxY = halfH + Math.round((halfH - boxH) / 2);

    roundRectPath(ctx, boxX, boxY, boxMaxW, boxH, 28);
    ctx.fillStyle = boxBg;
    ctx.fill();

    rows.forEach((row, i) => {
      const ry = boxY + boxPadY + i * (rowH + rowGap);
      drawText(ctx, row.label, boxX + boxPadX, ry + labelFontSize / 2, {
        font: `400 ${labelFontSize}px "DM Sans", system-ui, sans-serif`,
        color: labelColor,
        align: 'left',
      });
      drawText(ctx, row.value, boxX + boxPadX, ry + labelFontSize + 6 + valueFontSize / 2, {
        font: `500 ${valueFontSize}px "DM Sans", system-ui, sans-serif`,
        color: valueColor,
        align: 'left',
        maxWidth: boxMaxW - boxPadX * 2 - 16,
      });
    });
  }

  // Birthday confetti overlay (drawn last so it's on top)
  if (isBirthday && config.name) {
    const birthYear = config.dob ? new Date(config.dob).getFullYear() : 2000;
    drawConfetti(ctx, w, h, config.name, birthYear);
  }

  return canvas;
}

async function renderFoodCardToCanvas(
  config: Config,
  foodData: FoodShareData,
  format: ShareFormat,
  t: TranslateFn,
  cardCtx?: CardContext
): Promise<HTMLCanvasElement | null> {
  const { selectedFood, secondFood, result, mixedCanApply, mixedSplit, wetPercent } = foodData;
  if (!selectedFood || !result) return null;

  await ensureFontsLoaded();

  const { w, h } = FORMAT_DIMS[format];
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const photoSrc = getDogPhoto();
  // Heavier overlay for food card (more text to read)
  const hasPhoto = await drawCardBase(ctx, format, photoSrc, 0.55);

  const cx = w / 2;
  const dryPercent = 100 - wetPercent;
  const isBirthday = !!cardCtx?.birthday;
  const accent = isBirthday ? '#D4A843' : (cardCtx?.seasonal.accent ?? '#2d5a3d');

  // Conditional color palette
  const nameClr = hasPhoto ? 'rgba(255,255,255,0.8)' : '#6b7280';
  const bigNumClr = hasPhoto ? '#ffffff' : '#2d5a3d';
  const labelClr = hasPhoto ? 'rgba(255,255,255,0.6)' : '#6b7280';
  const perLabelClr = hasPhoto ? 'rgba(255,255,255,0.8)' : '#4b5563';
  const summaryClr = hasPhoto ? 'rgba(255,255,255,0.6)' : '#9ca3af';
  const pillBg = hasPhoto ? 'rgba(255,255,255,0.15)' : `${accent}1a`;
  const pillClr = hasPhoto ? '#ffffff' : accent;
  const pillSecBg = hasPhoto ? 'rgba(255,255,255,0.10)' : '#f3f4f6';
  const pillSecClr = hasPhoto ? 'rgba(255,255,255,0.8)' : '#4b5563';
  const plusClr = hasPhoto ? 'rgba(255,255,255,0.3)' : '#d1d5db';

  // Scaled-up font sizes — own the canvas!
  const bigFontSize = format === 'wide' ? 160 : format === 'square' ? 190 : 260;
  const unitFontSize = format === 'wide' ? 56 : format === 'square' ? 68 : 88;

  if (mixedCanApply && mixedSplit) {
    // --- Mixed mode (scaled up) ---
    const mixBigSize = format === 'wide' ? 110 : format === 'square' ? 140 : 180;
    const mixUnitSize = format === 'wide' ? 44 : format === 'square' ? 52 : 64;

    const perMealWet =
      config.meals > 1 ? Math.ceil(mixedSplit.wetGrams / config.meals) : mixedSplit.wetGrams;
    const perMealDry =
      config.meals > 1 ? Math.ceil(mixedSplit.dryGrams / config.meals) : mixedSplit.dryGrams;

    // Format-dependent food card sizes
    const foodNameSize = format === 'wide' ? 28 : format === 'square' ? 34 : 42;
    const foodAgePillSize = format === 'wide' ? 20 : format === 'square' ? 22 : 26;
    const foodBadgeSize = format === 'wide' ? 18 : format === 'square' ? 20 : 24;

    // Calculate total content height for vertical centering
    const nameH = config.name ? foodNameSize + 20 : 0;
    const agePillH = cardCtx?.ageShort ? foodAgePillSize + 12 : 0;
    const birthdayBadgeH = isBirthday ? 32 + 10 : 0;
    const pillsH = secondFood ? 36 + 8 + 36 + 24 : 36 + 24;
    const numbersH = mixBigSize + 20 + 20;
    const perMealH = 28 + 16;
    const badgeH = config.meals > 1 ? 40 + 12 : 0;
    const splitH = 20 + 6;
    const summaryH = 22;
    const totalH =
      nameH + agePillH + birthdayBadgeH + pillsH + numbersH + perMealH + badgeH + splitH + summaryH;
    // Story: push content to lower 2/3; others: center vertically
    let y =
      format === 'story'
        ? Math.max(h / 3 - totalH / 6, 200)
        : Math.max((h - totalH) / 2, format === 'wide' ? 48 : 80);

    // Dog name
    if (config.name) {
      drawText(ctx, config.name, cx, y + foodNameSize / 2, {
        font: `600 ${foodNameSize}px "Fraunces", Georgia, serif`,
        color: nameClr,
      });
      y += foodNameSize + 10;
    }

    // Age pill
    if (cardCtx?.ageShort) {
      drawText(
        ctx,
        t('share_puppy_age_pill', { age: cardCtx.ageShort }),
        cx,
        y + foodAgePillSize / 2,
        {
          font: `500 ${foodAgePillSize}px "Fraunces", Georgia, serif`,
          color: hasPhoto ? 'rgba(255,255,255,0.7)' : accent,
        }
      );
      y += foodAgePillSize + 10;
    }

    // Birthday badge
    if (isBirthday) {
      const badgeText =
        cardCtx.birthday!.type === 'today'
          ? t('share_birthday_turns', {
              name: config.name || '🐾',
              age: String(cardCtx.birthday!.age),
            })
          : t('share_birthday_badge');
      drawPill(ctx, cx, y, '#D4A843', '#ffffff', badgeText, foodBadgeSize, 600);
      y += 32 + 10;
    }

    // Food pills
    const foodPillSize = format === 'wide' ? 18 : 20;
    const wetLabel = `${selectedFood.foodType === 'wet' ? t('food_type_wet') : t('food_type_dry')} ${selectedFood.productName}`;
    const { height: p1h } = drawPill(ctx, cx, y, pillBg, pillClr, wetLabel, foodPillSize, 500);
    y += p1h + 8;

    if (secondFood) {
      const dryLabel = `${secondFood.foodType === 'wet' ? t('food_type_wet') : t('food_type_dry')} ${secondFood.productName}`;
      const { height: p2h } = drawPill(
        ctx,
        cx,
        y,
        pillSecBg,
        pillSecClr,
        dryLabel,
        foodPillSize,
        500
      );
      y += p2h + 24;
    } else {
      y += 16;
    }

    // Two number columns with "+"
    const numFont = `600 ${mixBigSize}px 'Fraunces', Georgia, serif`;
    const unitFont = `600 ${mixUnitSize}px 'Fraunces', Georgia, serif`;
    const colGap = 32;
    const plusW = 48;

    ctx.font = numFont;
    const wetNumW = ctx.measureText(String(perMealWet)).width;
    ctx.font = unitFont;
    const wetUnitW = ctx.measureText('g').width;
    const wetColW = wetNumW + 4 + wetUnitW;

    ctx.font = numFont;
    const dryNumW = ctx.measureText(String(perMealDry)).width;
    ctx.font = unitFont;
    const dryUnitW = ctx.measureText('g').width;
    const dryColW = dryNumW + 4 + dryUnitW;

    const totalNumW = wetColW + colGap + plusW + colGap + dryColW;
    let nx = cx - totalNumW / 2;

    const numBaseline = y + mixBigSize * 0.8;
    ctx.font = numFont;
    ctx.fillStyle = bigNumClr;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(String(perMealWet), nx, numBaseline);
    ctx.font = unitFont;
    ctx.fillText('g', nx + wetNumW + 4, numBaseline);

    const mixLabelSize = format === 'wide' ? 20 : format === 'square' ? 22 : 26;
    drawText(ctx, t('food_type_wet'), nx + wetColW / 2, numBaseline + 28, {
      font: `400 ${mixLabelSize}px "DM Sans", system-ui, sans-serif`,
      color: labelClr,
    });

    nx += wetColW + colGap;

    drawText(ctx, '+', nx + plusW / 2, y + mixBigSize * 0.45, {
      font: '300 48px "DM Sans", system-ui, sans-serif',
      color: plusClr,
    });

    nx += plusW + colGap;

    ctx.font = numFont;
    ctx.fillStyle = bigNumClr;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(String(perMealDry), nx, numBaseline);
    ctx.font = unitFont;
    ctx.fillText('g', nx + dryNumW + 4, numBaseline);

    drawText(ctx, t('food_type_dry'), nx + dryColW / 2, numBaseline + 28, {
      font: `400 ${mixLabelSize}px "DM Sans", system-ui, sans-serif`,
      color: labelClr,
    });

    y += mixBigSize + 20 + 20;

    // Per meal/day label
    const perLabelSize = format === 'wide' ? 24 : format === 'square' ? 26 : 30;
    const perLabel = config.meals > 1 ? t('result_label_per_meal') : t('result_label_per_day');
    drawText(ctx, perLabel, cx, y + perLabelSize / 2, {
      font: `500 ${perLabelSize}px "DM Sans", system-ui, sans-serif`,
      color: perLabelClr,
    });
    y += perLabelSize + 16;

    // Meal badge
    if (config.meals > 1) {
      drawPill(
        ctx,
        cx,
        y,
        pillBg,
        pillClr,
        t('result_meal_badge', { meals: String(config.meals) }),
        foodPillSize,
        500
      );
      y += 40 + 12;
    }

    // Split ratio
    const splitSize = format === 'wide' ? 18 : 20;
    drawText(
      ctx,
      t('mixed_split_applied', { wet: String(wetPercent), dry: String(dryPercent) }),
      cx,
      y + splitSize / 2,
      {
        font: `400 ${splitSize}px "DM Sans", system-ui, sans-serif`,
        color: summaryClr,
      }
    );
    y += splitSize + 6;

    // Daily summary
    const summarySize = format === 'wide' ? 20 : 22;
    const summaryText =
      config.meals > 1
        ? t('result_daily_summary', {
            grams: String(result.gramsPerDay),
            kcal: String(result.estimatedKcalPerDay),
          })
        : t('result_kcal', { kcal: String(result.estimatedKcalPerDay) });
    drawText(ctx, summaryText, cx, y + summarySize / 2, {
      font: `400 ${summarySize}px "DM Sans", system-ui, sans-serif`,
      color: summaryClr,
    });
  } else {
    // --- Single food mode (scaled up dramatically) ---
    const gramsDisplay =
      config.meals > 1 ? Math.ceil(result.gramsPerDay / config.meals) : result.gramsPerDay;

    const singleBigSize = bigFontSize;
    const singleUnitSize = unitFontSize;

    // Format-dependent single food card sizes
    const sNameSize = format === 'wide' ? 28 : format === 'square' ? 34 : 42;
    const sAgePillSize = format === 'wide' ? 20 : format === 'square' ? 22 : 26;
    const sBadgeSize = format === 'wide' ? 18 : format === 'square' ? 20 : 24;
    const sBrandSize = format === 'wide' ? 20 : format === 'square' ? 22 : 26;

    // Calculate total content height for vertical centering
    const nameH = config.name ? sNameSize + 20 : 0;
    const agePillH = cardCtx?.ageShort ? sAgePillSize + 12 : 0;
    const birthdayBadgeH = isBirthday ? 32 + 10 : 0;
    const brandH = sBrandSize + 24;
    const bigNumH = singleBigSize;
    const perLabelH = 28 + 16;
    const badgeH = config.meals > 1 ? 40 + 14 : 0;
    const summaryH = 22;
    const totalH =
      nameH + agePillH + birthdayBadgeH + brandH + bigNumH + 16 + perLabelH + badgeH + summaryH;
    // Story: push content to lower 2/3; others: center vertically
    let y =
      format === 'story'
        ? Math.max(h / 3 - totalH / 6, 200)
        : Math.max((h - totalH) / 2, format === 'wide' ? 48 : 80);

    // Dog name
    if (config.name) {
      drawText(ctx, config.name, cx, y + sNameSize / 2, {
        font: `600 ${sNameSize}px "Fraunces", Georgia, serif`,
        color: nameClr,
      });
      y += sNameSize + 10;
    }

    // Age pill
    if (cardCtx?.ageShort) {
      drawText(
        ctx,
        t('share_puppy_age_pill', { age: cardCtx.ageShort }),
        cx,
        y + sAgePillSize / 2,
        {
          font: `500 ${sAgePillSize}px "Fraunces", Georgia, serif`,
          color: hasPhoto ? 'rgba(255,255,255,0.7)' : accent,
        }
      );
      y += sAgePillSize + 10;
    }

    // Birthday badge
    if (isBirthday) {
      const badgeText =
        cardCtx.birthday!.type === 'today'
          ? t('share_birthday_turns', {
              name: config.name || '🐾',
              age: String(cardCtx.birthday!.age),
            })
          : t('share_birthday_badge');
      drawPill(ctx, cx, y, '#D4A843', '#ffffff', badgeText, sBadgeSize, 600);
      y += 32 + 10;
    }

    // Brand line
    const brandLine = `${selectedFood.brand} ${selectedFood.productName} \u00B7 ${selectedFood.foodType === 'wet' ? t('food_type_wet') : t('food_type_dry')}`;
    drawText(ctx, brandLine, cx, y + sBrandSize / 2, {
      font: `400 ${sBrandSize}px "DM Sans", system-ui, sans-serif`,
      color: summaryClr,
      maxWidth: w * 0.8,
    });
    y += sBrandSize + 24;

    // Big Fraunces number + "g"
    const numFont = `600 ${singleBigSize}px 'Fraunces', Georgia, serif`;
    const unitFont = `600 ${singleUnitSize}px 'Fraunces', Georgia, serif`;

    ctx.font = numFont;
    const numW = ctx.measureText(String(gramsDisplay)).width;
    ctx.font = unitFont;
    const unitW = ctx.measureText('g').width;
    const totalNumW = numW + 8 + unitW;
    const numX = cx - totalNumW / 2;
    const numBaseline = y + singleBigSize * 0.8;

    ctx.font = numFont;
    ctx.fillStyle = bigNumClr;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(String(gramsDisplay), numX, numBaseline);

    ctx.font = unitFont;
    ctx.fillText('g', numX + numW + 8, numBaseline);

    y += singleBigSize + 16;

    // Per meal/day label
    const sPerLabelSize = format === 'wide' ? 26 : format === 'square' ? 28 : 30;
    const perLabel = config.meals > 1 ? t('result_label_per_meal') : t('result_label_per_day');
    drawText(ctx, perLabel, cx, y + sPerLabelSize / 2, {
      font: `500 ${sPerLabelSize}px "DM Sans", system-ui, sans-serif`,
      color: perLabelClr,
    });
    y += sPerLabelSize + 16;

    // Meal badge
    const sMealPillSize = format === 'wide' ? 18 : 20;
    if (config.meals > 1) {
      drawPill(
        ctx,
        cx,
        y,
        pillBg,
        pillClr,
        t('result_meal_badge', { meals: String(config.meals) }),
        sMealPillSize,
        500
      );
      y += 40 + 14;
    }

    // Daily summary
    const sSummarySize = format === 'wide' ? 20 : format === 'square' ? 22 : 24;
    const summaryText =
      config.meals > 1
        ? t('result_daily_summary', {
            grams: String(result.gramsPerDay),
            kcal: String(result.estimatedKcalPerDay),
          })
        : t('result_kcal', { kcal: String(result.estimatedKcalPerDay) });
    drawText(ctx, summaryText, cx, y + sSummarySize / 2, {
      font: `400 ${sSummarySize}px "DM Sans", system-ui, sans-serif`,
      color: summaryClr,
    });
  }

  return canvas;
}

// ---------------------------------------------------------------------------
// Download + modal
// ---------------------------------------------------------------------------

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

  // Compute milestone/birthday/seasonal context once
  const ageLabel = config.dob ? formatAge(config.dob, t) : null;
  const ageShort = config.dob ? formatAgeShort(config.dob, t) : null;
  const ageMonths = config.dob ? dobToAgeMonths(config.dob) : null;
  const birthday = config.dob ? getBirthdayContext(config.dob) : null;
  const breedLabel = config.breed ? t('breed_' + config.breed.replace(/-/g, '_')) : '\u2014';
  const weightMilestone = getWeightMilestone(foodState.weightKg);
  const breedComparison = getBreedComparison(
    ageMonths,
    foodState.weightKg,
    foodState.breedSize,
    breedLabel,
    t
  );
  const seasonal = getSeasonalPalette();

  const cardCtx: CardContext = {
    ageLabel,
    ageShort,
    birthday,
    weightMilestone,
    breedComparison,
    seasonal,
  };

  let currentFormat: ShareFormat = 'square';
  let downloadDone = false;

  // Remove existing dialog if any
  document.querySelector('.share-dialog')?.remove();

  const dialog = document.createElement('dialog');
  dialog.className = 'share-dialog';

  function buildCardHtml(format: ShareFormat): string {
    if (cardType === 'food') {
      return renderFoodShareCard(config, foodData, format, t, cardCtx);
    }
    return renderDogShareCard(config, foodState, format, t, cardCtx);
  }

  function getPreviewScale(): number {
    const dims = FORMAT_DIMS[currentFormat];
    const maxW = 360;
    const maxH = 420;
    return Math.min(maxW / dims.w, maxH / dims.h);
  }

  function renderCaptionsHtml(): string {
    const captionCtx = {
      name: config.name || '',
      breed: breedLabel,
      ageLabel,
      ageShort,
      birthday,
      weightMilestone,
    };
    const captions = generateCaptions(captionCtx, t);
    if (captions.length === 0) return '';
    return `<div class="share-captions" id="share-captions">${captions.map((c, i) => `<button type="button" class="share-caption-btn" data-caption-idx="${i}">${escapeHtml(c)}</button>`).join('')}</div>`;
  }

  function renderDialogContent(): string {
    const dims = FORMAT_DIMS[currentFormat];
    const scale = getPreviewScale();
    const scaledW = Math.round(dims.w * scale);
    const scaledH = Math.round(dims.h * scale);

    const title = t(cardType === 'food' ? 'share_food_title' : 'share_dog_title');

    const formatButtons = FORMATS.map(
      (f) =>
        `<button type="button" class="share-format-btn ${f === currentFormat ? 'active' : ''}" data-format="${f}">${FORMAT_LABELS[f]}</button>`
    ).join('');

    const clipboardAvailable =
      typeof navigator !== 'undefined' &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === 'function';
    const copyLinkBtn = clipboardAvailable
      ? `<button type="button" class="share-copy-link-btn" id="share-copy-link-btn">
           <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
           ${t('share_copy_link')}
         </button>`
      : '';

    return `
      <div class="share-dialog-header">
        <p class="share-dialog-title">${escapeHtml(title)}</p>
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
          ${t('share_download_btn')}
        </button>
        ${copyLinkBtn}
        <p class="share-clipboard-msg" id="share-clipboard-msg"></p>
        <div id="share-captions-area">${downloadDone ? renderCaptionsHtml() : ''}</div>
      </div>`;
  }

  function showToast(text: string): void {
    const msg = dialog.querySelector('#share-clipboard-msg');
    if (!msg) return;
    msg.textContent = text;
    msg.className = 'share-toast';
    setTimeout(() => {
      msg.className = 'share-toast hidden';
      setTimeout(() => {
        if (msg) msg.textContent = '';
      }, 300);
    }, 3000);
  }

  function showError(text: string): void {
    const msg = dialog.querySelector('#share-clipboard-msg') as HTMLElement | null;
    if (!msg) return;
    msg.textContent = text;
    msg.className = 'share-clipboard-msg';
    msg.style.color = '#dc2626';
  }

  function switchFormat(newFormat: ShareFormat): void {
    if (newFormat === currentFormat) return;
    currentFormat = newFormat;

    // Cross-fade: fade out, swap content, fade in
    const wrapper = dialog.querySelector('.share-preview-wrapper') as HTMLElement | null;
    if (wrapper) {
      wrapper.classList.add('fading');
      setTimeout(() => {
        dialog.innerHTML = renderDialogContent();
        bindAll();
        const newWrapper = dialog.querySelector('.share-preview-wrapper') as HTMLElement | null;
        if (newWrapper) {
          newWrapper.classList.add('fading');
          // Force reflow then remove fading
          void newWrapper.offsetHeight;
          newWrapper.classList.remove('fading');
        }
      }, 200);
    } else {
      dialog.innerHTML = renderDialogContent();
      bindAll();
    }
  }

  function bindAll(): void {
    // Close button
    dialog.querySelector('.share-dialog-close')?.addEventListener('click', () => {
      dialog.close();
    });

    // Format buttons
    dialog.querySelectorAll('.share-format-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const format = (btn as HTMLElement).dataset.format as ShareFormat;
        if (format) switchFormat(format);
      });
    });

    // Copy link button
    dialog.querySelector('#share-copy-link-btn')?.addEventListener('click', () => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        void navigator.clipboard.writeText(canonicalUrl).then(() => {
          showToast(t('link_copied'));
        });
      }
    });

    // Download button
    dialog.querySelector('#share-download-btn')?.addEventListener('click', async () => {
      const btn = dialog.querySelector('#share-download-btn') as HTMLButtonElement;
      const originalText = btn.innerHTML;
      btn.disabled = true;
      btn.textContent = t('share_rendering');

      try {
        let canvas: HTMLCanvasElement | null;
        if (cardType === 'dog') {
          canvas = await renderDogCardToCanvas(config, foodState, currentFormat, t, cardCtx);
        } else {
          canvas = await renderFoodCardToCanvas(config, foodData, currentFormat, t, cardCtx);
        }

        if (!canvas) {
          showError(t('share_error'));
          btn.disabled = false;
          btn.innerHTML = originalText;
          return;
        }

        canvas.toBlob((blob) => {
          if (!blob) {
            showError(t('share_error'));
            btn.disabled = false;
            btn.innerHTML = originalText;
            return;
          }

          const context = birthday ? 'birthday' : cardType === 'food' ? 'food' : null;
          const filename = buildFilename(config.name, ageShort, context, currentFormat);
          triggerDownload(blob, filename);
          trackEvent(ANALYTICS_EVENTS.SHARE_IMAGE_DOWNLOADED, {
            tab: cardType,
            format: currentFormat,
            ...(birthday ? { milestone: 'birthday' } : {}),
            ...(weightMilestone ? { milestone: 'weight' } : {}),
          });

          btn.disabled = false;
          btn.innerHTML = originalText;

          // Show captions after first download
          downloadDone = true;
          const captionsArea = dialog.querySelector('#share-captions-area');
          if (captionsArea && !captionsArea.innerHTML.trim()) {
            captionsArea.innerHTML = renderCaptionsHtml();
            bindCaptions();
          }
        }, 'image/png');
      } catch {
        showError(t('share_error'));
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    });

    bindCaptions();
  }

  function bindCaptions(): void {
    dialog.querySelectorAll('.share-caption-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const text = btn.textContent || '';
        if (navigator.clipboard && navigator.clipboard.writeText) {
          void navigator.clipboard.writeText(text).then(() => {
            // Show "Copied!" inline
            const existing = btn.querySelector('.share-caption-copied');
            if (!existing) {
              const badge = document.createElement('span');
              badge.className = 'share-caption-copied';
              badge.textContent = t('share_copied');
              btn.appendChild(badge);
              setTimeout(() => badge.remove(), 2000);
            }
          });
        }
      });
    });
  }

  dialog.innerHTML = renderDialogContent();
  document.body.appendChild(dialog);
  dialog.showModal();

  trackEvent(ANALYTICS_EVENTS.SHARE_IMAGE_OPENED, { tab: cardType });

  bindAll();

  // Event: backdrop click
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });

  // Cleanup on close
  dialog.addEventListener('close', () => {
    dialog.remove();
  });
}
