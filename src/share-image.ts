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
  const breedLabel = config.breed ? t('breed_' + config.breed.replace(/-/g, '_')) : '\u2014';

  const isWide = format === 'wide';
  const gridStyle = isWide
    ? 'display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px 32px;text-align:left'
    : 'display:grid;grid-template-columns:auto 1fr;gap:10px 20px;text-align:left';

  const isPuppy = foodState.ageMonths < 6;

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

function drawCircleImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cx: number,
  cy: number,
  radius: number,
  borderWidth = 6
): void {
  // White border
  ctx.beginPath();
  ctx.arc(cx, cy, radius + borderWidth, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  // Shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.1)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, radius + borderWidth, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Clipped image
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(img, cx - radius, cy - radius, radius * 2, radius * 2);
  ctx.restore();
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

async function drawCardBase(ctx: CanvasRenderingContext2D, format: ShareFormat): Promise<void> {
  const { w, h } = FORMAT_DIMS[format];

  // Background
  ctx.fillStyle = '#faf8f5';
  ctx.fillRect(0, 0, w, h);

  // Mascot watermark (10% opacity)
  try {
    const mascot = await loadImage('/icons/icon-bg-2x.png');
    const mw = w * 0.6;
    const mh = (mascot.naturalHeight / mascot.naturalWidth) * mw;
    const mx = w - mw + w * 0.05;
    const my = (h - mh) / 2;
    ctx.save();
    ctx.globalAlpha = 0.1;
    ctx.drawImage(mascot, mx, my, mw, mh);
    ctx.restore();
  } catch {
    // Mascot missing — skip silently
  }

  // Branding footer
  const domain = typeof window !== 'undefined' ? window.location.host : 'puppycal.com';
  const footerY = h - 48;
  try {
    const icon = await loadImage('/icons/icon-original.png');
    const iconH = 26;
    const iconW = (icon.naturalWidth / icon.naturalHeight) * iconH;

    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.font = '400 14px "DM Sans", system-ui, sans-serif';
    const textW = ctx.measureText(domain).width;
    const totalW = iconW + 8 + textW;
    const startX = (w - totalW) / 2;

    ctx.drawImage(icon, startX, footerY - iconH / 2, iconW, iconH);
    ctx.fillStyle = '#6b7280';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(domain, startX + iconW + 8, footerY);
    ctx.restore();
  } catch {
    // Icon missing — draw text only
    ctx.save();
    ctx.globalAlpha = 0.6;
    drawText(ctx, domain, w / 2, footerY, {
      font: '400 14px "DM Sans", system-ui, sans-serif',
      color: '#6b7280',
    });
    ctx.restore();
  }
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

  await drawCardBase(ctx, format);

  const isWide = format === 'wide';
  const isPuppy = foodState.ageMonths < 6;

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

  // Calculate content dimensions
  const photoRadius = isWide ? 40 : 48;
  const dogPhotoSrc = getDogPhoto();
  let dogImg: HTMLImageElement | null = null;
  if (dogPhotoSrc) {
    try {
      dogImg = await loadImage(dogPhotoSrc);
    } catch {
      dogImg = null;
    }
  }

  // Measure grid
  const boxPadX = isWide ? 40 : 32;
  const boxPadY = isWide ? 32 : 28;
  const boxMaxW = isWide ? w - 112 : Math.min(500, w - 96);
  const innerW = boxMaxW - boxPadX * 2;

  let gridH: number;
  if (isWide) {
    // 3-column layout
    const cols = 3;
    const rowCount = Math.ceil(rows.length / cols);
    gridH = rowCount * (18 + 22 + 12) - 12; // label + value + gap
  } else {
    // 2-column key-value layout
    gridH = rows.length * (22 + 10) - 10; // row height + gap
  }
  const boxH = gridH + boxPadY * 2;

  // Total content height
  const photoH = dogImg ? (photoRadius + 6) * 2 + 16 : 0;
  const titleH = 18 + 20; // title text + margin
  const totalH = photoH + titleH + boxH;
  let y = (h - totalH) / 2;

  // Clamp to reasonable range
  const minTop = isWide ? 48 : 80;
  const maxBottom = h - 80;
  if (y < minTop) y = minTop;
  if (y + totalH > maxBottom) y = minTop;

  const cx = w / 2;

  // Dog photo
  if (dogImg) {
    drawCircleImage(ctx, dogImg, cx, y + photoRadius + 6, photoRadius);
    y += (photoRadius + 6) * 2 + 16;
  }

  // "MY DOG" title
  drawText(ctx, t('dog_profile_title').toUpperCase(), cx, y + 9, {
    font: '600 13px "DM Sans", system-ui, sans-serif',
    color: '#9ca3af',
    letterSpacing: '0.05em',
  });
  y += titleH;

  // Beige container
  const boxX = cx - boxMaxW / 2;
  roundRectPath(ctx, boxX, y, boxMaxW, boxH, 16);
  ctx.fillStyle = '#f5f0e8';
  ctx.fill();

  // Draw grid rows
  if (isWide) {
    const cols = 3;
    const colW = innerW / cols;
    const gapY = 12;
    rows.forEach((row, i) => {
      const col = i % cols;
      const rowIdx = Math.floor(i / cols);
      const rx = boxX + boxPadX + col * colW;
      const ry = y + boxPadY + rowIdx * (18 + 22 + gapY);

      drawText(ctx, row.label, rx, ry + 9, {
        font: '400 13px "DM Sans", system-ui, sans-serif',
        color: '#9ca3af',
        align: 'left',
      });
      drawText(ctx, row.value, rx, ry + 18 + 11, {
        font: '500 16px "DM Sans", system-ui, sans-serif',
        color: '#374151',
        align: 'left',
        maxWidth: colW - 16,
      });
    });
  } else {
    const labelColW = 120;
    const valueColW = innerW - labelColW - 20;
    const rowH = 22;
    const gapY = 10;
    rows.forEach((row, i) => {
      const ry = y + boxPadY + i * (rowH + gapY);

      drawText(ctx, row.label, boxX + boxPadX, ry + rowH / 2, {
        font: '400 14px "DM Sans", system-ui, sans-serif',
        color: '#9ca3af',
        align: 'left',
      });
      drawText(ctx, row.value, boxX + boxPadX + labelColW + 20, ry + rowH / 2, {
        font: '500 16px "DM Sans", system-ui, sans-serif',
        color: '#374151',
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

  await drawCardBase(ctx, format);

  const cx = w / 2;
  const dryPercent = 100 - wetPercent;

  const bigFontSize = format === 'wide' ? 72 : format === 'square' ? 80 : 96;
  const unitFontSize = format === 'wide' ? 28 : 32;

  if (mixedCanApply && mixedSplit) {
    // --- Mixed mode ---
    const perMealWet =
      config.meals > 1 ? Math.ceil(mixedSplit.wetGrams / config.meals) : mixedSplit.wetGrams;
    const perMealDry =
      config.meals > 1 ? Math.ceil(mixedSplit.dryGrams / config.meals) : mixedSplit.dryGrams;

    // Calculate total content height for vertical centering
    const nameH = config.name ? 18 + 16 : 0;
    const pillsH = secondFood ? 30 + 6 + 30 + 20 : 30 + 20;
    const numbersH = bigFontSize + 14 + 16; // big number + type label
    const perMealH = 18 + 12;
    const badgeH = config.meals > 1 ? 30 + 8 : 0;
    const splitH = 14 + 4;
    const summaryH = 15;
    const totalH = nameH + pillsH + numbersH + perMealH + badgeH + splitH + summaryH;
    let y = Math.max((h - totalH) / 2, format === 'wide' ? 48 : 80);

    // Dog name
    if (config.name) {
      drawText(ctx, config.name, cx, y + 9, {
        font: '400 18px "DM Sans", system-ui, sans-serif',
        color: '#6b7280',
      });
      y += 18 + 16;
    }

    // Food pills
    const wetLabel = `${selectedFood.foodType === 'wet' ? t('food_type_wet') : t('food_type_dry')} ${selectedFood.productName}`;
    const { height: p1h } = drawPill(
      ctx,
      cx,
      y,
      'rgba(45,90,61,0.1)',
      '#2d5a3d',
      wetLabel,
      13,
      500
    );
    y += p1h + 6;

    if (secondFood) {
      const dryLabel = `${secondFood.foodType === 'wet' ? t('food_type_wet') : t('food_type_dry')} ${secondFood.productName}`;
      const { height: p2h } = drawPill(ctx, cx, y, '#f3f4f6', '#4b5563', dryLabel, 13, 500);
      y += p2h + 20;
    } else {
      y += 14;
    }

    // Two number columns with "+"
    const numFont = `600 ${bigFontSize}px 'Fraunces', Georgia, serif`;
    const unitFont = `600 ${unitFontSize}px 'Fraunces', Georgia, serif`;
    const colGap = 24;
    const plusW = 36;

    // Measure columns
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

    // Wet number
    const numBaseline = y + bigFontSize * 0.8;
    ctx.font = numFont;
    ctx.fillStyle = '#2d5a3d';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(String(perMealWet), nx, numBaseline);
    ctx.font = unitFont;
    ctx.fillText('g', nx + wetNumW + 4, numBaseline);

    // Wet label
    drawText(ctx, t('food_type_wet'), nx + wetColW / 2, numBaseline + 18, {
      font: '400 14px "DM Sans", system-ui, sans-serif',
      color: '#6b7280',
    });

    nx += wetColW + colGap;

    // Plus sign
    drawText(ctx, '+', nx + plusW / 2, y + bigFontSize * 0.45, {
      font: '300 36px "DM Sans", system-ui, sans-serif',
      color: '#d1d5db',
    });

    nx += plusW + colGap;

    // Dry number
    ctx.font = numFont;
    ctx.fillStyle = '#2d5a3d';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(String(perMealDry), nx, numBaseline);
    ctx.font = unitFont;
    ctx.fillText('g', nx + dryNumW + 4, numBaseline);

    // Dry label
    drawText(ctx, t('food_type_dry'), nx + dryColW / 2, numBaseline + 18, {
      font: '400 14px "DM Sans", system-ui, sans-serif',
      color: '#6b7280',
    });

    y += bigFontSize + 14 + 16;

    // Per meal/day label
    const perLabel = config.meals > 1 ? t('result_label_per_meal') : t('result_label_per_day');
    drawText(ctx, perLabel, cx, y + 9, {
      font: '500 16px "DM Sans", system-ui, sans-serif',
      color: '#4b5563',
    });
    y += 18 + 12;

    // Meal badge
    if (config.meals > 1) {
      drawPill(
        ctx,
        cx,
        y,
        'rgba(45,90,61,0.1)',
        '#2d5a3d',
        t('result_meal_badge', { meals: String(config.meals) }),
        13,
        500
      );
      y += 30 + 8;
    }

    // Split ratio
    drawText(
      ctx,
      t('mixed_split_applied', { wet: String(wetPercent), dry: String(dryPercent) }),
      cx,
      y + 7,
      {
        font: '400 13px "DM Sans", system-ui, sans-serif',
        color: '#9ca3af',
      }
    );
    y += 14 + 4;

    // Daily summary
    const summaryText =
      config.meals > 1
        ? t('result_daily_summary', {
            grams: String(result.gramsPerDay),
            kcal: String(result.estimatedKcalPerDay),
          })
        : t('result_kcal', { kcal: String(result.estimatedKcalPerDay) });
    drawText(ctx, summaryText, cx, y + 7, {
      font: '400 14px "DM Sans", system-ui, sans-serif',
      color: '#9ca3af',
    });
  } else {
    // --- Single food mode ---
    const gramsDisplay =
      config.meals > 1 ? Math.ceil(result.gramsPerDay / config.meals) : result.gramsPerDay;

    const singleBigSize = format === 'wide' ? 96 : 120;
    const singleUnitSize = format === 'wide' ? 36 : 42;

    // Calculate total content height for vertical centering
    const nameH = config.name ? 18 + 16 : 0;
    const brandH = 14 + 16;
    const bigNumH = singleBigSize;
    const perLabelH = 18 + 12;
    const badgeH = config.meals > 1 ? 30 + 10 : 0;
    const summaryH = 16;
    const totalH = nameH + brandH + bigNumH + 12 + perLabelH + badgeH + summaryH;
    let y = Math.max((h - totalH) / 2, format === 'wide' ? 48 : 80);

    // Dog name
    if (config.name) {
      drawText(ctx, config.name, cx, y + 9, {
        font: '400 18px "DM Sans", system-ui, sans-serif',
        color: '#6b7280',
      });
      y += 18 + 16;
    }

    // Brand line
    const brandLine = `${selectedFood.brand} ${selectedFood.productName} \u00B7 ${selectedFood.foodType === 'wet' ? t('food_type_wet') : t('food_type_dry')}`;
    drawText(ctx, brandLine, cx, y + 7, {
      font: '400 14px "DM Sans", system-ui, sans-serif',
      color: '#9ca3af',
      maxWidth: w * 0.8,
    });
    y += 14 + 16;

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
    ctx.fillStyle = '#2d5a3d';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(String(gramsDisplay), numX, numBaseline);

    ctx.font = unitFont;
    ctx.fillText('g', numX + numW + 8, numBaseline);

    y += singleBigSize + 12;

    // Per meal/day label
    const perLabel = config.meals > 1 ? t('result_label_per_meal') : t('result_label_per_day');
    drawText(ctx, perLabel, cx, y + 9, {
      font: '500 18px "DM Sans", system-ui, sans-serif',
      color: '#4b5563',
    });
    y += 18 + 12;

    // Meal badge
    if (config.meals > 1) {
      drawPill(
        ctx,
        cx,
        y,
        'rgba(45,90,61,0.1)',
        '#2d5a3d',
        t('result_meal_badge', { meals: String(config.meals) }),
        14,
        500
      );
      y += 30 + 10;
    }

    // Daily summary
    const summaryText =
      config.meals > 1
        ? t('result_daily_summary', {
            grams: String(result.gramsPerDay),
            kcal: String(result.estimatedKcalPerDay),
          })
        : t('result_kcal', { kcal: String(result.estimatedKcalPerDay) });
    drawText(ctx, summaryText, cx, y + 8, {
      font: '400 15px "DM Sans", system-ui, sans-serif',
      color: '#9ca3af',
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
