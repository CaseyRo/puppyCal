import { describe, expect, it } from 'vitest';
import { generateCaptions, getShareText } from './share-captions';
import type { CaptionContext } from './share-captions';

const t = (key: string, params: Record<string, string | number> = {}): string => {
  const base: Record<string, string> = {
    share_caption_age: `${params.age} of chaos and cuddles`,
    share_caption_growing: 'Growing into those paws',
    share_caption_meet: `Meet ${params.name}, our ${params.breed}`,
    share_caption_birthday: `The birthday pup! ${params.name} is ${params.age} today!`,
    share_caption_weight: `${params.name} hit ${params.weight}kg!`,
    share_caption_generic: `Life with ${params.name}`,
    share_prefill_default: `${params.name} is ${params.age}! Check out`,
    share_prefill_birthday: `It's ${params.name}'s birthday! ${params.age} today!`,
    share_prefill_no_name: "Plan your puppy's food and walks",
  };
  return base[key] ?? key;
};

describe('generateCaptions', () => {
  it('generates captions with age context', () => {
    const ctx: CaptionContext = {
      name: 'Biko',
      breed: 'Stabyhoun',
      ageLabel: '14 weeks old',
      ageShort: '14 weeks',
      birthday: null,
      weightMilestone: null,
    };
    const captions = generateCaptions(ctx, t);
    expect(captions.length).toBeGreaterThanOrEqual(2);
    expect(captions.length).toBeLessThanOrEqual(3);
    expect(captions.some((c) => c.includes('14 weeks'))).toBe(true);
    expect(captions.every((c) => c.includes('puppycal.vercel.app'))).toBe(true);
  });

  it('generates birthday caption when birthday context active', () => {
    const ctx: CaptionContext = {
      name: 'Biko',
      breed: 'Stabyhoun',
      ageLabel: '1 year old',
      ageShort: '12 months',
      birthday: { type: 'today', age: 1, daysSince: 0 },
      weightMilestone: null,
    };
    const captions = generateCaptions(ctx, t);
    expect(captions.some((c) => c.includes('birthday'))).toBe(true);
  });

  it('generates weight milestone caption', () => {
    const ctx: CaptionContext = {
      name: 'Biko',
      breed: 'Stabyhoun',
      ageLabel: null,
      ageShort: null,
      birthday: null,
      weightMilestone: 10,
    };
    const captions = generateCaptions(ctx, t);
    expect(captions.some((c) => c.includes('10kg'))).toBe(true);
  });

  it('returns captions for name-only context', () => {
    const ctx: CaptionContext = {
      name: 'Biko',
      breed: '',
      ageLabel: null,
      ageShort: null,
      birthday: null,
      weightMilestone: null,
    };
    const captions = generateCaptions(ctx, t);
    expect(captions.length).toBeGreaterThanOrEqual(1);
    expect(captions.some((c) => c.includes('Biko'))).toBe(true);
  });

  it('returns empty for no name, no context', () => {
    const ctx: CaptionContext = {
      name: '',
      breed: '',
      ageLabel: null,
      ageShort: null,
      birthday: null,
      weightMilestone: null,
    };
    const captions = generateCaptions(ctx, t);
    expect(captions.length).toBe(0);
  });

  it('returns at most 3 captions', () => {
    const ctx: CaptionContext = {
      name: 'Biko',
      breed: 'Stabyhoun',
      ageLabel: '14 weeks old',
      ageShort: '14 weeks',
      birthday: { type: 'today', age: 1, daysSince: 0 },
      weightMilestone: 10,
    };
    const captions = generateCaptions(ctx, t);
    expect(captions.length).toBeLessThanOrEqual(3);
  });
});

describe('getShareText', () => {
  it('returns birthday prefill when birthday', () => {
    const ctx: CaptionContext = {
      name: 'Biko',
      breed: 'Stabyhoun',
      ageLabel: '1 year old',
      ageShort: '12 months',
      birthday: { type: 'today', age: 1, daysSince: 0 },
      weightMilestone: null,
    };
    const text = getShareText(ctx, t);
    expect(text).toContain('birthday');
    expect(text).toContain('Biko');
  });

  it('returns default prefill with name and age', () => {
    const ctx: CaptionContext = {
      name: 'Biko',
      breed: 'Stabyhoun',
      ageLabel: '14 weeks old',
      ageShort: '14 weeks',
      birthday: null,
      weightMilestone: null,
    };
    const text = getShareText(ctx, t);
    expect(text).toContain('Biko');
    expect(text).toContain('14 weeks old');
  });

  it('returns no-name fallback', () => {
    const ctx: CaptionContext = {
      name: '',
      breed: '',
      ageLabel: null,
      ageShort: null,
      birthday: null,
      weightMilestone: null,
    };
    const text = getShareText(ctx, t);
    expect(text).toContain('puppycal.vercel.app');
  });
});
