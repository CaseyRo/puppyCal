/**
 * Caption generation for post-download sharing and pre-filled share text.
 */

import type { BirthdayContext } from './share-birthday';

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

export interface CaptionContext {
  name: string;
  breed: string;
  ageLabel: string | null; // e.g. "14 weeks old"
  ageShort: string | null; // e.g. "14 weeks"
  birthday: BirthdayContext | null;
  weightMilestone: number | null; // e.g. 10 (kg)
}

const APP_URL = 'puppycal.vercel.app';

/**
 * Generate 2-3 contextual caption suggestions for post-download sharing.
 * Each caption includes the app URL.
 */
export function generateCaptions(ctx: CaptionContext, t: TranslateFn): string[] {
  const captions: string[] = [];

  if (ctx.birthday) {
    captions.push(
      `${t('share_caption_birthday', { name: ctx.name || '🐾', age: String(ctx.birthday.age) })} — ${APP_URL}`
    );
  }

  if (ctx.weightMilestone && ctx.name) {
    captions.push(
      `${t('share_caption_weight', { name: ctx.name, weight: String(ctx.weightMilestone) })} — ${APP_URL}`
    );
  }

  if (ctx.ageShort) {
    captions.push(`${t('share_caption_age', { age: ctx.ageShort })} — ${APP_URL}`);
    captions.push(`${t('share_caption_growing')} — ${APP_URL}`);
  }

  if (ctx.name && ctx.breed && ctx.breed !== '\u2014') {
    captions.push(`${t('share_caption_meet', { name: ctx.name, breed: ctx.breed })} — ${APP_URL}`);
  }

  if (ctx.name) {
    captions.push(`${t('share_caption_generic', { name: ctx.name })} — ${APP_URL}`);
  }

  // Return first 3 unique captions
  return [...new Set(captions)].slice(0, 3);
}

/**
 * Generate pre-filled share text for the link-share flow (WhatsApp, Telegram, etc.).
 */
export function getShareText(ctx: CaptionContext, t: TranslateFn): string {
  const url = APP_URL;

  if (ctx.birthday && ctx.name && ctx.ageLabel) {
    return `${t('share_prefill_birthday', { name: ctx.name, age: ctx.ageLabel })} ${url}`;
  }

  if (ctx.name && ctx.ageLabel) {
    return `${t('share_prefill_default', { name: ctx.name, age: ctx.ageLabel })} ${url}`;
  }

  return `${t('share_prefill_no_name')} — ${url}`;
}
