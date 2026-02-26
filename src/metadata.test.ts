import { describe, expect, it } from 'vitest';
import { composePlannerMetadata } from './metadata';

describe('planner metadata', () => {
  it('composes SEO/GEO fields for walkies tab', () => {
    const meta = composePlannerMetadata({
      activeTab: 'walkies',
      canonicalUrl: 'https://example.com/?tab=walkies',
    });

    expect(meta.canonical).toBe('https://example.com/?tab=walkies');
    expect(meta.description.toLowerCase()).toContain('seo + geo');
    expect(meta.jsonLd['@type']).toBe('WebApplication');
  });

  it('changes title/action for food tab', () => {
    const meta = composePlannerMetadata({
      activeTab: 'food',
      canonicalUrl: 'https://example.com/?tab=food',
    });

    expect(meta.title).toContain('food');
    expect(JSON.stringify(meta.jsonLd)).toContain('Calculate daily food portion');
  });
});
