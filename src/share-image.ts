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
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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
  const hasPhoto = !!photoSrc;

  const bgStyle = hasPhoto
    ? `background-image:url('${photoSrc}');background-size:cover;background-position:center`
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
      <div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;flex:1;padding:${format === 'wide' ? '48px 56px' : format === 'square' ? '56px 48px' : '80px 48px'}">
        ${innerHtml}
      </div>
      ${brandingFooter(hasPhoto)}
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

  const photoSrc = getDogPhoto();
  const hasPhoto = !!photoSrc;
  const dryPercent = 100 - wetPercent;

  // Color palette
  const nameColor = hasPhoto ? 'rgba(255,255,255,0.8)' : '#6b7280';
  const bigNumColor = hasPhoto ? '#ffffff' : '#2d5a3d';
  const labelColor = hasPhoto ? 'rgba(255,255,255,0.6)' : '#6b7280';
  const perLabelColor = hasPhoto ? 'rgba(255,255,255,0.8)' : '#4b5563';
  const summaryColor = hasPhoto ? 'rgba(255,255,255,0.6)' : '#9ca3af';
  const pillBg = hasPhoto ? 'rgba(255,255,255,0.15)' : 'rgba(45,90,61,0.1)';
  const pillColor = hasPhoto ? '#ffffff' : '#2d5a3d';
  const pillSecBg = hasPhoto ? 'rgba(255,255,255,0.10)' : '#f3f4f6';
  const pillSecColor = hasPhoto ? 'rgba(255,255,255,0.8)' : '#4b5563';

  const nameHtml = config.name
    ? `<p style="font-family:'DM Sans',system-ui,sans-serif;font-size:24px;color:${nameColor};margin:0 0 16px 0">${escapeHtml(config.name)}</p>`
    : '';

  // Scaled-up sizes
  const fontSize = format === 'wide' ? '130px' : format === 'square' ? '150px' : '200px';
  const unitSize = format === 'wide' ? '48px' : format === 'square' ? '56px' : '72px';

  if (mixedCanApply && mixedSplit) {
    const perMealWet =
      config.meals > 1 ? Math.ceil(mixedSplit.wetGrams / config.meals) : mixedSplit.wetGrams;
    const perMealDry =
      config.meals > 1 ? Math.ceil(mixedSplit.dryGrams / config.meals) : mixedSplit.dryGrams;

    const mixedFontSize = format === 'wide' ? '90px' : format === 'square' ? '110px' : '140px';
    const mixedUnitSize = format === 'wide' ? '36px' : format === 'square' ? '44px' : '52px';

    return cardWrapper(
      format,
      `
      ${nameHtml}
      <div style="display:flex;flex-direction:column;align-items:center;gap:8px;margin-bottom:24px">
        <span style="display:inline-flex;align-items:center;gap:4px;padding:6px 16px;border-radius:999px;background:${pillBg};color:${pillColor};font-size:16px;font-weight:500">
          <strong>${selectedFood.foodType === 'wet' ? t('food_type_wet') : t('food_type_dry')}</strong> ${escapeHtml(selectedFood.productName)}
        </span>
        ${secondFood ? `<span style="display:inline-flex;align-items:center;gap:4px;padding:6px 16px;border-radius:999px;background:${pillSecBg};color:${pillSecColor};font-size:16px;font-weight:500"><strong>${secondFood.foodType === 'wet' ? t('food_type_wet') : t('food_type_dry')}</strong> ${escapeHtml(secondFood.productName)}</span>` : ''}
      </div>
      <div style="display:flex;align-items:baseline;justify-content:center;gap:32px">
        <div style="text-align:center">
          <p style="font-family:'Fraunces',Georgia,serif;font-size:${mixedFontSize};font-weight:600;color:${bigNumColor};line-height:1;margin:0">
            ${perMealWet}<span style="font-size:${mixedUnitSize};margin-left:2px">g</span>
          </p>
          <p style="font-size:18px;color:${labelColor};margin:6px 0 0 0">${t('food_type_wet')}</p>
        </div>
        <span style="font-size:48px;color:${hasPhoto ? 'rgba(255,255,255,0.3)' : '#d1d5db'};font-weight:300">+</span>
        <div style="text-align:center">
          <p style="font-family:'Fraunces',Georgia,serif;font-size:${mixedFontSize};font-weight:600;color:${bigNumColor};line-height:1;margin:0">
            ${perMealDry}<span style="font-size:${mixedUnitSize};margin-left:2px">g</span>
          </p>
          <p style="font-size:18px;color:${labelColor};margin:6px 0 0 0">${t('food_type_dry')}</p>
        </div>
      </div>
      <p style="font-size:22px;font-weight:500;color:${perLabelColor};margin:16px 0 0 0">${config.meals > 1 ? t('result_label_per_meal') : t('result_label_per_day')}</p>
      ${config.meals > 1 ? `<span style="display:inline-block;margin-top:12px;padding:6px 16px;border-radius:999px;background:${pillBg};color:${pillColor};font-size:16px;font-weight:500">${t('result_meal_badge', { meals: String(config.meals) })}</span>` : ''}
      <p style="font-size:16px;color:${summaryColor};margin:10px 0 0 0">${t('mixed_split_applied', { wet: String(wetPercent), dry: String(dryPercent) })}</p>
      <p style="font-size:18px;color:${summaryColor};margin:6px 0 0 0">${config.meals > 1 ? t('result_daily_summary', { grams: String(result.gramsPerDay), kcal: String(result.estimatedKcalPerDay) }) : t('result_kcal', { kcal: String(result.estimatedKcalPerDay) })}</p>
    `,
      photoSrc
    );
  }

  const gramsDisplay =
    config.meals > 1 ? Math.ceil(result.gramsPerDay / config.meals) : result.gramsPerDay;

  return cardWrapper(
    format,
    `
    ${nameHtml}
    <p style="font-size:18px;color:${summaryColor};margin:0 0 20px 0;max-width:80%;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(selectedFood.brand)} ${escapeHtml(selectedFood.productName)} &middot; ${selectedFood.foodType === 'wet' ? t('food_type_wet') : t('food_type_dry')}</p>
    <p style="font-family:'Fraunces',Georgia,serif;font-size:${fontSize};font-weight:600;color:${bigNumColor};line-height:1;margin:0">
      ${gramsDisplay}<span style="font-size:${unitSize};margin-left:4px">g</span>
    </p>
    <p style="font-size:24px;font-weight:500;color:${perLabelColor};margin:16px 0 0 0">${config.meals > 1 ? t('result_label_per_meal') : t('result_label_per_day')}</p>
    ${config.meals > 1 ? `<span style="display:inline-block;margin-top:14px;padding:6px 18px;border-radius:999px;background:${pillBg};color:${pillColor};font-size:18px;font-weight:500">${t('result_meal_badge', { meals: String(config.meals) })}</span>` : ''}
    <p style="font-size:20px;color:${summaryColor};margin:20px 0 0 0">${config.meals > 1 ? t('result_daily_summary', { grams: String(result.gramsPerDay), kcal: String(result.estimatedKcalPerDay) }) : t('result_kcal', { kcal: String(result.estimatedKcalPerDay) })}</p>
  `,
    photoSrc
  );
}

export function renderDogShareCard(
  config: Config,
  foodState: FoodPlannerState,
  format: ShareFormat,
  t: (key: string, params?: Record<string, string | number>) => string
): string {
  const photoSrc = getDogPhoto();
  const hasPhoto = !!photoSrc;

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

  const rows = [
    { label: t('label_name'), value: config.name ? escapeHtml(config.name) : '\u2014' },
    {
      label: t('label_dob'),
      value: config.dob ? config.dob.split('-').reverse().join('-') : '\u2014',
    },
    { label: t('label_weight_kg'), value: `${foodState.weightKg.toFixed(1)} kg` },
    { label: t('label_breed'), value: breedLabel },
    ...(isPuppy ? [] : [{ label: t('label_activity'), value: activityLabel }]),
    ...(isPuppy ? [] : [{ label: t('label_goal'), value: goalLabel }]),
  ];

  // Scaled-up sizes
  const titleSize = isWide ? '16px' : format === 'square' ? '18px' : '20px';
  const nameSize = isWide ? '38px' : format === 'square' ? '44px' : '52px';
  const labelSize = isWide ? '16px' : format === 'square' ? '18px' : '20px';
  const valueSize = isWide ? '20px' : format === 'square' ? '24px' : '26px';
  const boxPad = isWide ? '32px 40px' : format === 'square' ? '36px 44px' : '44px 52px';
  const boxW = isWide ? '580px' : '960px';
  const boxRadius = '24px';
  const rowGap = isWide ? '10px' : format === 'square' ? '14px' : '18px';

  let gridStyle: string;
  let gridHtml: string;
  let tag: string;

  if (isWide) {
    // Single-column stacked (label above value)
    gridStyle = `display:flex;flex-direction:column;gap:${rowGap};text-align:left`;
    gridHtml = rows
      .map(
        (r) =>
          `<div style="display:flex;flex-direction:column;gap:2px"><span style="font-size:${labelSize};color:${labelColorVal}">${r.label}</span><span style="font-size:${valueSize};color:${valueColor};font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.value}</span></div>`
      )
      .join('');
    tag = 'div';
  } else {
    // 2-column key-value
    gridStyle = `display:grid;grid-template-columns:auto 1fr;gap:${rowGap} 24px;text-align:left`;
    gridHtml = rows
      .map(
        (r) =>
          `<dt style="font-size:${labelSize};color:${labelColorVal}">${r.label}</dt><dd style="font-size:${valueSize};color:${valueColor};font-weight:500;margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.value}</dd>`
      )
      .join('');
    tag = 'dl';
  }

  // Title + name as hero text (no circle avatar)
  const titleHtml = `<p style="font-size:${titleSize};font-weight:600;color:${titleColor};text-transform:uppercase;letter-spacing:0.05em;margin:0 0 8px 0">${t('dog_profile_title')}</p>`;
  const nameHtml = config.name
    ? `<p style="font-family:'Fraunces',Georgia,serif;font-size:${nameSize};font-weight:700;color:${nameColor};margin:0 0 24px 0">${escapeHtml(config.name)}</p>`
    : '';

  const wideLayout = isWide
    ? `<div style="display:flex;align-items:flex-start;justify-content:space-between;width:100%;gap:40px">
        <div style="flex:1;padding:60px 0 0 60px">
          ${titleHtml}
          ${nameHtml}
        </div>
        <div style="background:${boxBg};border-radius:${boxRadius};padding:${boxPad};width:${boxW};box-sizing:border-box;margin:56px 60px 56px 0">
          <${tag} style="${gridStyle}">${gridHtml}</${tag}>
        </div>
      </div>`
    : '';

  if (isWide) {
    return cardWrapper(format, wideLayout, photoSrc);
  }

  return cardWrapper(
    format,
    `
    ${titleHtml}
    ${nameHtml}
    <div style="background:${boxBg};border-radius:${boxRadius};padding:${boxPad};width:100%;max-width:${boxW};box-sizing:border-box">
      <${tag} style="${gridStyle}">
        ${gridHtml}
      </${tag}>
    </div>
  `,
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
  if (!photoSrc) return false;

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
  t: TranslateFn
): Promise<HTMLCanvasElement> {
  await ensureFontsLoaded();

  const { w, h } = FORMAT_DIMS[format];
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const photoSrc = getDogPhoto();
  const hasPhoto = await drawCardBase(ctx, format, photoSrc);

  const isWide = format === 'wide';
  const isPuppy = foodState.ageMonths < 6;

  // Conditional color palette
  const titleColor = hasPhoto ? 'rgba(255,255,255,0.8)' : '#9ca3af';
  const nameColor = hasPhoto ? '#ffffff' : '#374151';
  const boxBg = hasPhoto ? 'rgba(255,255,255,0.15)' : '#f5f0e8';
  const labelColor = hasPhoto ? 'rgba(255,255,255,0.6)' : '#9ca3af';
  const valueColor = hasPhoto ? '#ffffff' : '#374151';

  const activityLabel =
    { low: t('activity_low'), moderate: t('activity_moderate'), high: t('activity_high') }[
      foodState.activityLevel
    ] ?? foodState.activityLevel;
  const goalLabel =
    { maintain: t('goal_maintain'), lose: t('goal_lose') }[foodState.weightGoal] ??
    foodState.weightGoal;
  const breedLabel = config.breed ? t('breed_' + config.breed.replace(/-/g, '_')) : '\u2014';

  const rows = [
    { label: t('label_name'), value: config.name || '\u2014' },
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
    // --- Wide layout: title+name left, info box right ---
    const titleFontSize = 16;
    const nameFontSize = 38;

    // Title
    drawText(ctx, t('dog_profile_title').toUpperCase(), 60, 80 + titleFontSize / 2, {
      font: `600 ${titleFontSize}px "DM Sans", system-ui, sans-serif`,
      color: titleColor,
      align: 'left',
      letterSpacing: '0.05em',
    });

    // Dog name
    if (config.name) {
      drawText(ctx, config.name, 60, 112 + nameFontSize / 2, {
        font: `700 ${nameFontSize}px "Fraunces", Georgia, serif`,
        color: nameColor,
        align: 'left',
        maxWidth: 500,
      });
    }

    // Info box (right side)
    const boxX = 580;
    const boxY = 56;
    const boxW = 580;
    const boxPadX = 32;
    const boxPadY = 32;

    // Single-column stacked
    const labelFontSize = 16;
    const valueFontSize = 20;
    const rowGap = 10;
    const rowH = labelFontSize + valueFontSize + 6;
    const gridH = rows.length * rowH + (rows.length - 1) * rowGap;
    const boxH = gridH + boxPadY * 2;

    roundRectPath(ctx, boxX, boxY, boxW, boxH, 24);
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
    // --- Story / Square layout ---
    const isStory = format === 'story';
    const titleFontSize = isStory ? 20 : 18;
    const nameFontSize = isStory ? 52 : 44;
    const labelFontSize = isStory ? 20 : 18;
    const valueFontSize = isStory ? 26 : 24;
    const rowGap = isStory ? 18 : 14;
    const boxPadX = isStory ? 52 : 44;
    const boxPadY = isStory ? 44 : 36;
    const boxMaxW = 960;

    // Starting Y positions
    const titleY = isStory ? 280 : 120;
    const nameY = isStory ? 320 : 156;
    const boxTopY = isStory ? 420 : 240;

    const cx = w / 2;

    // Title
    drawText(ctx, t('dog_profile_title').toUpperCase(), cx, titleY + titleFontSize / 2, {
      font: `600 ${titleFontSize}px "DM Sans", system-ui, sans-serif`,
      color: titleColor,
      letterSpacing: '0.05em',
    });

    // Dog name
    if (config.name) {
      drawText(ctx, config.name, cx, nameY + nameFontSize / 2, {
        font: `700 ${nameFontSize}px "Fraunces", Georgia, serif`,
        color: nameColor,
        maxWidth: boxMaxW,
      });
    }

    // Info box
    const innerW = boxMaxW - boxPadX * 2;
    const labelColW = 160;
    const valueColW = innerW - labelColW - 24;
    const rowH = Math.max(labelFontSize, valueFontSize) + 4;
    const gridH = rows.length * rowH + (rows.length - 1) * rowGap;
    const boxH = gridH + boxPadY * 2;
    const boxX = cx - boxMaxW / 2;

    roundRectPath(ctx, boxX, boxTopY, boxMaxW, boxH, 24);
    ctx.fillStyle = boxBg;
    ctx.fill();

    rows.forEach((row, i) => {
      const ry = boxTopY + boxPadY + i * (rowH + rowGap);

      drawText(ctx, row.label, boxX + boxPadX, ry + rowH / 2, {
        font: `400 ${labelFontSize}px "DM Sans", system-ui, sans-serif`,
        color: labelColor,
        align: 'left',
      });
      drawText(ctx, row.value, boxX + boxPadX + labelColW + 24, ry + rowH / 2, {
        font: `500 ${valueFontSize}px "DM Sans", system-ui, sans-serif`,
        color: valueColor,
        align: 'left',
        maxWidth: valueColW,
      });
    });
  }

  return canvas;
}

async function renderFoodCardToCanvas(
  config: Config,
  foodData: FoodShareData,
  format: ShareFormat,
  t: TranslateFn
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

  // Conditional color palette
  const nameClr = hasPhoto ? 'rgba(255,255,255,0.8)' : '#6b7280';
  const bigNumClr = hasPhoto ? '#ffffff' : '#2d5a3d';
  const labelClr = hasPhoto ? 'rgba(255,255,255,0.6)' : '#6b7280';
  const perLabelClr = hasPhoto ? 'rgba(255,255,255,0.8)' : '#4b5563';
  const summaryClr = hasPhoto ? 'rgba(255,255,255,0.6)' : '#9ca3af';
  const pillBg = hasPhoto ? 'rgba(255,255,255,0.15)' : 'rgba(45,90,61,0.1)';
  const pillClr = hasPhoto ? '#ffffff' : '#2d5a3d';
  const pillSecBg = hasPhoto ? 'rgba(255,255,255,0.10)' : '#f3f4f6';
  const pillSecClr = hasPhoto ? 'rgba(255,255,255,0.8)' : '#4b5563';
  const plusClr = hasPhoto ? 'rgba(255,255,255,0.3)' : '#d1d5db';

  // Scaled-up font sizes
  const bigFontSize = format === 'wide' ? 130 : format === 'square' ? 150 : 200;
  const unitFontSize = format === 'wide' ? 48 : format === 'square' ? 56 : 72;

  if (mixedCanApply && mixedSplit) {
    // --- Mixed mode (scaled up) ---
    const mixBigSize = format === 'wide' ? 90 : format === 'square' ? 110 : 140;
    const mixUnitSize = format === 'wide' ? 36 : format === 'square' ? 44 : 52;

    const perMealWet =
      config.meals > 1 ? Math.ceil(mixedSplit.wetGrams / config.meals) : mixedSplit.wetGrams;
    const perMealDry =
      config.meals > 1 ? Math.ceil(mixedSplit.dryGrams / config.meals) : mixedSplit.dryGrams;

    // Calculate total content height for vertical centering
    const nameH = config.name ? 24 + 20 : 0;
    const pillsH = secondFood ? 36 + 8 + 36 + 24 : 36 + 24;
    const numbersH = mixBigSize + 20 + 20;
    const perMealH = 24 + 16;
    const badgeH = config.meals > 1 ? 36 + 12 : 0;
    const splitH = 18 + 6;
    const summaryH = 20;
    const totalH = nameH + pillsH + numbersH + perMealH + badgeH + splitH + summaryH;
    let y = Math.max((h - totalH) / 2, format === 'wide' ? 48 : 80);

    // Dog name
    if (config.name) {
      drawText(ctx, config.name, cx, y + 12, {
        font: '400 24px "DM Sans", system-ui, sans-serif',
        color: nameClr,
      });
      y += 24 + 20;
    }

    // Food pills
    const wetLabel = `${selectedFood.foodType === 'wet' ? t('food_type_wet') : t('food_type_dry')} ${selectedFood.productName}`;
    const { height: p1h } = drawPill(ctx, cx, y, pillBg, pillClr, wetLabel, 16, 500);
    y += p1h + 8;

    if (secondFood) {
      const dryLabel = `${secondFood.foodType === 'wet' ? t('food_type_wet') : t('food_type_dry')} ${secondFood.productName}`;
      const { height: p2h } = drawPill(ctx, cx, y, pillSecBg, pillSecClr, dryLabel, 16, 500);
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

    drawText(ctx, t('food_type_wet'), nx + wetColW / 2, numBaseline + 24, {
      font: '400 18px "DM Sans", system-ui, sans-serif',
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

    drawText(ctx, t('food_type_dry'), nx + dryColW / 2, numBaseline + 24, {
      font: '400 18px "DM Sans", system-ui, sans-serif',
      color: labelClr,
    });

    y += mixBigSize + 20 + 20;

    // Per meal/day label
    const perLabel = config.meals > 1 ? t('result_label_per_meal') : t('result_label_per_day');
    drawText(ctx, perLabel, cx, y + 12, {
      font: '500 22px "DM Sans", system-ui, sans-serif',
      color: perLabelClr,
    });
    y += 24 + 16;

    // Meal badge
    if (config.meals > 1) {
      drawPill(
        ctx,
        cx,
        y,
        pillBg,
        pillClr,
        t('result_meal_badge', { meals: String(config.meals) }),
        16,
        500
      );
      y += 36 + 12;
    }

    // Split ratio
    drawText(
      ctx,
      t('mixed_split_applied', { wet: String(wetPercent), dry: String(dryPercent) }),
      cx,
      y + 9,
      {
        font: '400 16px "DM Sans", system-ui, sans-serif',
        color: summaryClr,
      }
    );
    y += 18 + 6;

    // Daily summary
    const summaryText =
      config.meals > 1
        ? t('result_daily_summary', {
            grams: String(result.gramsPerDay),
            kcal: String(result.estimatedKcalPerDay),
          })
        : t('result_kcal', { kcal: String(result.estimatedKcalPerDay) });
    drawText(ctx, summaryText, cx, y + 10, {
      font: '400 18px "DM Sans", system-ui, sans-serif',
      color: summaryClr,
    });
  } else {
    // --- Single food mode (scaled up dramatically) ---
    const gramsDisplay =
      config.meals > 1 ? Math.ceil(result.gramsPerDay / config.meals) : result.gramsPerDay;

    const singleBigSize = bigFontSize;
    const singleUnitSize = unitFontSize;

    // Calculate total content height for vertical centering
    const nameH = config.name ? 24 + 20 : 0;
    const brandH = 18 + 20;
    const bigNumH = singleBigSize;
    const perLabelH = 24 + 16;
    const badgeH = config.meals > 1 ? 36 + 14 : 0;
    const summaryH = 20;
    const totalH = nameH + brandH + bigNumH + 16 + perLabelH + badgeH + summaryH;
    let y = Math.max((h - totalH) / 2, format === 'wide' ? 48 : 80);

    // Dog name
    if (config.name) {
      drawText(ctx, config.name, cx, y + 12, {
        font: '400 24px "DM Sans", system-ui, sans-serif',
        color: nameClr,
      });
      y += 24 + 20;
    }

    // Brand line
    const brandLine = `${selectedFood.brand} ${selectedFood.productName} \u00B7 ${selectedFood.foodType === 'wet' ? t('food_type_wet') : t('food_type_dry')}`;
    drawText(ctx, brandLine, cx, y + 9, {
      font: '400 18px "DM Sans", system-ui, sans-serif',
      color: summaryClr,
      maxWidth: w * 0.8,
    });
    y += 18 + 20;

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
    const perLabel = config.meals > 1 ? t('result_label_per_meal') : t('result_label_per_day');
    drawText(ctx, perLabel, cx, y + 12, {
      font: '500 24px "DM Sans", system-ui, sans-serif',
      color: perLabelClr,
    });
    y += 24 + 16;

    // Meal badge
    if (config.meals > 1) {
      drawPill(
        ctx,
        cx,
        y,
        pillBg,
        pillClr,
        t('result_meal_badge', { meals: String(config.meals) }),
        18,
        500
      );
      y += 36 + 14;
    }

    // Daily summary
    const summaryText =
      config.meals > 1
        ? t('result_daily_summary', {
            grams: String(result.gramsPerDay),
            kcal: String(result.estimatedKcalPerDay),
          })
        : t('result_kcal', { kcal: String(result.estimatedKcalPerDay) });
    drawText(ctx, summaryText, cx, y + 10, {
      font: '400 20px "DM Sans", system-ui, sans-serif',
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
      const btn = dialog.querySelector('#share-download-btn') as HTMLButtonElement;
      const originalText = btn.innerHTML;
      btn.disabled = true;
      btn.textContent = 'Rendering...';

      try {
        let canvas: HTMLCanvasElement | null;
        if (cardType === 'dog') {
          canvas = await renderDogCardToCanvas(config, foodState, currentFormat, t);
        } else {
          canvas = await renderFoodCardToCanvas(config, foodData, currentFormat, t);
        }

        if (!canvas) {
          btn.disabled = false;
          btn.innerHTML = originalText;
          return;
        }

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
