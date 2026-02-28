/**
 * Load i18n by lang (fetch i18n/{lang}.json), normalize en/nl, fallback to nl.
 * Default lang=nl when param missing is applied in config, not here.
 */
export interface I18nData {
  strings: Record<string, string>;
  facts: FactEntry[];
}

export interface FactEntry {
  text: string;
  sourceLabel?: string;
  sourceUrl?: string;
}

const cache: Record<string, I18nData> = {};
let nlFallback: I18nData | null = null;

export function normalizeLang(lang: string): 'en' | 'nl' {
  const n = (lang || 'nl').split(/[_-]/)[0].toLowerCase();
  return n === 'en' ? 'en' : 'nl';
}

async function loadLocale(lang: 'en' | 'nl'): Promise<I18nData | null> {
  try {
    const base =
      typeof window !== 'undefined' &&
      (window as unknown as { __BASE__?: string }).__BASE__ !== undefined
        ? (window as unknown as { __BASE__: string }).__BASE__
        : '';
    const res = await fetch(`${base}i18n/${lang}.json`);
    if (!res.ok) throw new Error(`i18n ${lang} failed`);
    const data = (await res.json()) as {
      strings?: Record<string, string>;
      facts?: unknown[];
    };
    const defaultFactSourceLabel = data.strings?.fact_source_default_label;
    const defaultFactSourceUrl = data.strings?.fact_source_default_url;
    const facts = Array.isArray(data.facts)
      ? data.facts
          .map((entry): FactEntry | null => {
            if (typeof entry === 'string') {
              return {
                text: entry,
                sourceLabel: defaultFactSourceLabel,
                sourceUrl: defaultFactSourceUrl,
              };
            }
            if (entry && typeof entry === 'object') {
              const factLike = entry as {
                text?: unknown;
                sourceLabel?: unknown;
                sourceUrl?: unknown;
              };
              if (typeof factLike.text !== 'string') return null;
              return {
                text: factLike.text,
                sourceLabel:
                  typeof factLike.sourceLabel === 'string'
                    ? factLike.sourceLabel
                    : defaultFactSourceLabel,
                sourceUrl:
                  typeof factLike.sourceUrl === 'string'
                    ? factLike.sourceUrl
                    : defaultFactSourceUrl,
              };
            }
            return null;
          })
          .filter((entry): entry is FactEntry => Boolean(entry))
      : [];

    return {
      strings: data.strings ?? {},
      facts,
    };
  } catch {
    return null;
  }
}

export async function loadI18n(lang: string): Promise<I18nData> {
  const normalized = normalizeLang(lang);
  if (cache[normalized]) return cache[normalized];

  if (!nlFallback) {
    nlFallback = (await loadLocale('nl')) ?? { strings: {}, facts: [] };
    cache.nl = nlFallback;
  }

  if (normalized === 'nl') {
    return nlFallback;
  }

  const specific = await loadLocale('en');
  const merged: I18nData = specific
    ? {
        strings: { ...nlFallback.strings, ...specific.strings },
        facts: specific.facts.length ? specific.facts : nlFallback.facts,
      }
    : nlFallback;
  cache.en = merged;
  return merged;
}

export function tr(
  data: I18nData,
  key: string,
  params: Record<string, string | number> = {}
): string {
  const s = data.strings[key] ?? key;
  return Object.keys(params).reduce(
    (acc, k) => acc.replace(new RegExp(`\\{${k}\\}`, 'g'), String(params[k])),
    s
  );
}
