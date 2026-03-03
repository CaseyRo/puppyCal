/**
 * Shared utilities for the share card system.
 */

/**
 * Validate that a string is a safe data:image URL (base64-encoded JPEG, PNG, or WebP).
 * Used to guard localStorage photo values before interpolating into CSS, HTML, or Canvas.
 */
export function isSafeDataUrl(src: string): boolean {
  return /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(src);
}

export type SeasonName = 'spring' | 'summer' | 'autumn' | 'winter';

export interface SeasonalPalette {
  accent: string;
  name: SeasonName;
}

/**
 * Returns a seasonal color palette based on the given date (defaults to today).
 * Spring (Mar-May): warm green, Summer (Jun-Aug): golden,
 * Autumn (Sep-Nov): amber, Winter (Dec-Feb): cool blue.
 */
export function getSeasonalPalette(date?: Date): SeasonalPalette {
  const d = date ?? new Date();
  const month = d.getMonth(); // 0-based
  if (month >= 2 && month <= 4) return { accent: '#4A7C59', name: 'spring' };
  if (month >= 5 && month <= 7) return { accent: '#B8860B', name: 'summer' };
  if (month >= 8 && month <= 10) return { accent: '#C67D30', name: 'autumn' };
  return { accent: '#4A6FA5', name: 'winter' };
}

/**
 * Slugify a name for use in filenames: lowercase, spaces→hyphens, strip non-ASCII and special chars.
 */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Build a contextual download filename for a share card.
 */
export function buildFilename(
  name: string | undefined,
  ageLabel: string | null,
  context: 'birthday' | 'food' | null,
  format: string
): string {
  const parts = ['puppycal'];
  const slug = name ? slugify(name) : '';
  if (slug) parts.push(slug);

  if (context === 'birthday') {
    parts.push('birthday');
  } else if (context === 'food') {
    parts.push('food');
  } else if (ageLabel) {
    // e.g. "14 weeks" → "14weeks"
    parts.push(ageLabel.replace(/\s+/g, ''));
  } else {
    parts.push('dog');
  }

  parts.push(format);
  return parts.join('-') + '.png';
}
