import { describe, expect, it } from 'vitest';
import { isSafeDataUrl, getSeasonalPalette, buildFilename } from './share-utils';

describe('isSafeDataUrl', () => {
  it('accepts valid JPEG data URL', () => {
    expect(isSafeDataUrl('data:image/jpeg;base64,abc123+/=')).toBe(true);
  });

  it('accepts valid PNG data URL', () => {
    expect(isSafeDataUrl('data:image/png;base64,AAAA')).toBe(true);
  });

  it('accepts valid WebP data URL', () => {
    expect(isSafeDataUrl('data:image/webp;base64,AAAA')).toBe(true);
  });

  it('rejects SVG data URL', () => {
    expect(isSafeDataUrl('data:image/svg+xml;base64,AAAA')).toBe(false);
  });

  it('rejects non-base64 data URL', () => {
    expect(isSafeDataUrl('data:image/png;charset=utf-8,<svg>')).toBe(false);
  });

  it('rejects javascript: URL', () => {
    expect(isSafeDataUrl('javascript:alert(1)')).toBe(false);
  });

  it('rejects HTTP URL', () => {
    expect(isSafeDataUrl('https://example.com/photo.jpg')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isSafeDataUrl('')).toBe(false);
  });

  it('rejects data URL with invalid base64 characters', () => {
    expect(isSafeDataUrl('data:image/png;base64,<script>alert(1)</script>')).toBe(false);
  });
});

describe('getSeasonalPalette', () => {
  it('returns spring for March', () => {
    expect(getSeasonalPalette(new Date(2026, 2, 15))).toEqual({
      accent: '#4A7C59',
      name: 'spring',
    });
  });

  it('returns summer for July', () => {
    expect(getSeasonalPalette(new Date(2026, 6, 1))).toEqual({ accent: '#B8860B', name: 'summer' });
  });

  it('returns autumn for October', () => {
    expect(getSeasonalPalette(new Date(2026, 9, 15))).toEqual({
      accent: '#C67D30',
      name: 'autumn',
    });
  });

  it('returns winter for January', () => {
    expect(getSeasonalPalette(new Date(2026, 0, 15))).toEqual({
      accent: '#4A6FA5',
      name: 'winter',
    });
  });

  it('returns winter for December', () => {
    expect(getSeasonalPalette(new Date(2026, 11, 25))).toEqual({
      accent: '#4A6FA5',
      name: 'winter',
    });
  });

  it('returns spring for May (boundary)', () => {
    expect(getSeasonalPalette(new Date(2026, 4, 31))).toEqual({
      accent: '#4A7C59',
      name: 'spring',
    });
  });

  it('returns summer for June (boundary)', () => {
    expect(getSeasonalPalette(new Date(2026, 5, 1))).toEqual({ accent: '#B8860B', name: 'summer' });
  });
});

describe('buildFilename', () => {
  it('builds filename with name and age', () => {
    expect(buildFilename('Biko', '14 weeks', null, 'square')).toBe(
      'puppycal-biko-14weeks-square.png'
    );
  });

  it('builds filename without name', () => {
    expect(buildFilename(undefined, '3 months', null, 'story')).toBe('puppycal-3months-story.png');
  });

  it('builds birthday filename', () => {
    expect(buildFilename('Biko', '1 year', 'birthday', 'wide')).toBe(
      'puppycal-biko-birthday-wide.png'
    );
  });

  it('builds food filename', () => {
    expect(buildFilename('Biko', null, 'food', 'square')).toBe('puppycal-biko-food-square.png');
  });

  it('falls back to dog when no age or context', () => {
    expect(buildFilename('Biko', null, null, 'square')).toBe('puppycal-biko-dog-square.png');
  });

  it('strips special characters from name', () => {
    expect(buildFilename('Björk & Friends!', null, null, 'square')).toBe(
      'puppycal-bjrk-friends-dog-square.png'
    );
  });

  it('handles empty name', () => {
    expect(buildFilename('', null, null, 'square')).toBe('puppycal-dog-square.png');
  });
});
