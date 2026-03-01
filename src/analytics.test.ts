import { describe, expect, it, vi } from 'vitest';
import { ANALYTICS_EVENTS, trackEvent } from './analytics';

describe('analytics tracking', () => {
  it('sends non-PII allowlisted properties only', () => {
    const track = vi.fn();
    (globalThis as unknown as { window: Window }).window = {
      umami: { track },
    } as unknown as Window;

    trackEvent(ANALYTICS_EVENTS.SHARE_SENT, {
      tab: 'walkies',
      platform: 'telegram',
      surface: 'footer',
      lang: 'nl',
      supplier: 'royal-canin',
      breed: 'stabyhoun',
      size: 'medium',
      enabled: 'true',
      email: 'nope@example.com',
    } as unknown as Record<string, string>);

    expect(track).toHaveBeenCalledWith(ANALYTICS_EVENTS.SHARE_SENT, {
      tab: 'walkies',
      platform: 'telegram',
      surface: 'footer',
      lang: 'nl',
      supplier: 'royal-canin',
      breed: 'stabyhoun',
      size: 'medium',
      enabled: 'true',
    });
  });

  it('does not throw when umami is unavailable', () => {
    (globalThis as unknown as { window: Window }).window = {} as unknown as Window;
    expect(() =>
      trackEvent(ANALYTICS_EVENTS.CTA_GENERAL_EMAIL_CLICK, { tab: 'walkies', surface: 'footer' })
    ).not.toThrow();
  });
});
