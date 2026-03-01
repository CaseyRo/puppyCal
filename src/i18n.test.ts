import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadI18n, normalizeLang } from './i18n';

describe('i18n', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('normalizes unsupported language to nl', () => {
    expect(normalizeLang('fr')).toBe('nl');
    expect(normalizeLang('en-US')).toBe('en');
  });

  it('falls back to nl strings when en key is missing', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async (...args: Parameters<typeof fetch>) => {
        const input = args[0];
        const url = String(input);
        if (url.endsWith('/i18n/nl.json') || url.endsWith('i18n/nl.json')) {
          return new Response(
            JSON.stringify({
              strings: { title: 'Puppy planner', only_nl_key: 'Alleen NL' },
              facts: {},
            }),
            { status: 200 }
          );
        }
        if (url.endsWith('/i18n/en.json') || url.endsWith('i18n/en.json')) {
          return new Response(
            JSON.stringify({
              strings: { title: 'Puppy planner EN' },
              facts: {},
            }),
            { status: 200 }
          );
        }
        return new Response('{}', { status: 404 });
      });

    const data = await loadI18n('en');
    expect(fetchMock).toHaveBeenCalled();
    expect(data.strings.title).toBe('Puppy planner EN');
    expect(data.strings.only_nl_key).toBe('Alleen NL');
  });
});
