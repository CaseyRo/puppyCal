/**
 * Load i18n by lang; normalize en/nl, fallback to en. Default lang when param missing is nl (handled in config).
 */

export interface I18nData {
  strings: Record<string, string>;
  facts: string[];
}

const cache: Partial<Record<'en' | 'nl', I18nData>> = {};

function normalizeLang(lang: string): 'en' | 'nl' {
  const n = lang.split(/[-_]/)[0].toLowerCase();
  return n === 'nl' ? 'nl' : 'en';
}

export async function loadI18n(lang: string): Promise<I18nData> {
  const key = normalizeLang(lang);
  if (cache[key]) return cache[key]!;

  const path = `i18n/${key}.json`;
  try {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as I18nData;
    const out: I18nData = {
      strings: data.strings ?? {},
      facts: Array.isArray(data.facts) ? data.facts : [],
    };
    cache[key] = out;
    return out;
  } catch {
    if (key === 'en') {
      cache.en = { strings: {}, facts: [] };
      return cache.en;
    }
    return loadI18n('en');
  }
}

export function formatString(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}
