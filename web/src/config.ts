/**
 * App config: single source of truth from URL.
 * Design: lang, dob, months, start, birthday, name, notes; when feeding: feeding, meals, gramsStart, gramsEnd.
 */

export interface Config {
  lang: 'en' | 'nl';
  dob: string;
  months: number;
  start: string;
  birthday: boolean;
  name: string;
  notes: string;
  feeding: boolean;
  meals: number;
  gramsStart: number;
  gramsEnd: number;
}

const DEFAULT_LANG: Config['lang'] = 'nl';
const DEFAULT_MONTHS = 3;
const DEFAULT_BIRTHDAY = true;
const DEFAULT_FEEDING = false;
const DEFAULT_MEALS = 3;
const DEFAULT_GRAMS_START = 200;
const DEFAULT_GRAMS_END = 280;

function todayISO(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export function defaultConfig(): Config {
  return {
    lang: DEFAULT_LANG,
    dob: '',
    months: DEFAULT_MONTHS,
    start: todayISO(),
    birthday: DEFAULT_BIRTHDAY,
    name: '',
    notes: '',
    feeding: DEFAULT_FEEDING,
    meals: DEFAULT_MEALS,
    gramsStart: DEFAULT_GRAMS_START,
    gramsEnd: DEFAULT_GRAMS_END,
  };
}

export function parseSearchParams(search: string): Partial<Config> {
  const params = new URLSearchParams(search);
  const out: Partial<Config> = {};

  const lang = params.get('lang');
  if (lang === 'en' || lang === 'nl') out.lang = lang;

  const dob = params.get('dob');
  if (dob != null && dob !== '') out.dob = dob;

  const months = params.get('months');
  if (months != null) {
    const n = parseInt(months, 10);
    if (n >= 1 && n <= 3) out.months = n;
  }

  const start = params.get('start');
  if (start != null && start !== '') out.start = start;

  const birthday = params.get('birthday');
  if (birthday === 'on' || birthday === '1' || birthday === 'true') out.birthday = true;
  else if (birthday === 'off' || birthday === '0' || birthday === 'false') out.birthday = false;

  const name = params.get('name');
  if (name != null) out.name = name;

  const notes = params.get('notes');
  if (notes != null) out.notes = notes;

  const feeding = params.get('feeding');
  if (feeding === 'on' || feeding === '1' || feeding === 'true') out.feeding = true;
  else if (feeding === 'off' || feeding === '0' || feeding === 'false') out.feeding = false;

  const meals = params.get('meals');
  if (meals != null) {
    const n = parseInt(meals, 10);
    if (n >= 1) out.meals = n;
  }

  const gramsStart = params.get('gramsStart');
  if (gramsStart != null) {
    const n = parseFloat(gramsStart);
    if (!Number.isNaN(n) && n >= 0) out.gramsStart = n;
  }

  const gramsEnd = params.get('gramsEnd');
  if (gramsEnd != null) {
    const n = parseFloat(gramsEnd);
    if (!Number.isNaN(n) && n >= 0) out.gramsEnd = n;
  }

  return out;
}

export function configFromURL(url: URL): Config {
  const defaults = defaultConfig();
  const partial = parseSearchParams(url.search);
  return { ...defaults, ...partial };
}

/** Serialize config to query string; omit defaults to keep URL short. */
export function configToSearchParams(config: Config): string {
  const p = new URLSearchParams();

  if (config.lang !== DEFAULT_LANG) p.set('lang', config.lang);
  if (config.dob !== '') p.set('dob', config.dob);
  if (config.months !== DEFAULT_MONTHS) p.set('months', String(config.months));
  if (config.start !== todayISO()) p.set('start', config.start);
  if (!config.birthday) p.set('birthday', 'off');
  if (config.name !== '') p.set('name', config.name);
  if (config.notes !== '') p.set('notes', config.notes);

  if (config.feeding) {
    p.set('feeding', 'on');
    if (config.meals !== DEFAULT_MEALS) p.set('meals', String(config.meals));
    if (config.gramsStart !== DEFAULT_GRAMS_START) p.set('gramsStart', String(config.gramsStart));
    if (config.gramsEnd !== DEFAULT_GRAMS_END) p.set('gramsEnd', String(config.gramsEnd));
  }

  return p.toString();
}

export function pushConfigToURL(config: Config): void {
  const query = configToSearchParams(config);
  const newUrl = query
    ? `${window.location.pathname}?${query}`
    : window.location.pathname;
  window.history.replaceState(null, '', newUrl);
}
