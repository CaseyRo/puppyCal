/**
 * Calendar preview: generates a 7-day agenda strip for the walkies tab.
 */
import type { Config } from './config';
import type { I18nData } from './i18n';
import { tr } from './i18n';

interface PreviewEvent {
  type: 'walk' | 'age' | 'birthday' | 'feeding';
  label: string;
}

interface PreviewDay {
  date: Date;
  events: PreviewEvent[];
}

function parseDate(s: string): Date | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(s + 'T12:00:00Z');
  return isNaN(d.getTime()) ? null : d;
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000));
}

function ageInWeeks(birth: Date, day: Date): number {
  return Math.max(0, Math.floor(daysBetween(birth, day) / 7));
}

const EN_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const NL_DAYS = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];
const EN_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const NL_MONTHS = [
  'jan',
  'feb',
  'mrt',
  'apr',
  'mei',
  'jun',
  'jul',
  'aug',
  'sep',
  'okt',
  'nov',
  'dec',
];

function formatDate(d: Date, lang: string): string {
  const day = d.getUTCDay();
  const date = d.getUTCDate();
  const month = d.getUTCMonth();
  if (lang === 'en') {
    return `${EN_DAYS[day]} ${date} ${EN_MONTHS[month]}`;
  }
  return `${NL_DAYS[day]} ${date} ${NL_MONTHS[month]}`;
}

export function generatePreviewDays(
  config: Config,
  i18n: I18nData,
  numDays = 7
): PreviewDay[] | null {
  const birth = parseDate(config.dob);
  const start = parseDate(config.start);
  if (!birth || !start) return null;

  const end = new Date(start);
  end.setMonth(end.getMonth() + Math.min(3, Math.max(1, config.months)));
  const endTime = end.getTime();

  const days: PreviewDay[] = [];
  const current = new Date(start);

  for (let i = 0; i < numDays && current.getTime() < endTime; i++) {
    const events: PreviewEvent[] = [];
    const weeks = ageInWeeks(birth, current);
    const mins = Math.max(1, weeks);

    // Walk event — every day
    events.push({
      type: 'walk',
      label: tr(i18n, 'preview_walk', { mins }),
    });

    // Age milestone — Mondays only
    if (current.getUTCDay() === 1) {
      events.push({
        type: 'age',
        label: tr(i18n, 'preview_age', { weeks }),
      });
    }

    // Birthday
    const sameMonthDay =
      current.getUTCMonth() === birth.getUTCMonth() && current.getUTCDate() === birth.getUTCDate();
    if (sameMonthDay && config.birthday && daysBetween(birth, current) > 0) {
      events.push({
        type: 'birthday',
        label: tr(i18n, 'preview_birthday'),
      });
    }

    // Feeding
    if (config.feeding && config.meals >= 1) {
      const totalDays = daysBetween(start, end);
      const dayIndex = daysBetween(start, current);
      const t = totalDays <= 0 ? 1 : dayIndex / totalDays;
      const gramsPerDay = config.gramsStart + t * (config.gramsEnd - config.gramsStart);
      const perMeal = Math.round(gramsPerDay / config.meals);
      events.push({
        type: 'feeding',
        label: `${perMeal}g × ${config.meals}`,
      });
    }

    days.push({ date: new Date(current), events });
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return days;
}

const BADGE_STYLES: Record<PreviewEvent['type'], string> = {
  walk: 'bg-emerald-50 text-emerald-700',
  age: 'bg-amber-50 text-amber-700',
  birthday: 'bg-pink-50 text-pink-700',
  feeding: 'bg-blue-50 text-blue-700',
};

const BADGE_ICONS: Record<PreviewEvent['type'], string> = {
  walk: '\u{1F43E}',
  age: '\u{1F4C5}',
  birthday: '\u{1F382}',
  feeding: '\u{1F372}',
};

export function renderCalendarPreview(
  config: Config,
  i18n: I18nData,
  t: (key: string, params?: Record<string, string | number>) => string,
  lang: string
): string {
  const days = generatePreviewDays(config, i18n);

  if (!days) {
    return `
      <div class="mt-4 rounded-xl border border-dashed border-gray-200 p-4">
        <p class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">${t('preview_title')}</p>
        <p class="text-sm text-gray-400">${t('preview_empty')}</p>
      </div>`;
  }

  const rows = days
    .map(
      (day, i) => `
      <div class="flex items-start gap-3 py-2 ${i > 0 ? 'border-t border-gray-100' : ''}">
        <span class="text-xs text-gray-500 whitespace-nowrap w-20 pt-0.5 font-medium">${formatDate(day.date, lang)}</span>
        <div class="flex flex-wrap gap-1">
          ${day.events
            .map(
              (ev) =>
                `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium ${BADGE_STYLES[ev.type]}">${BADGE_ICONS[ev.type]} ${ev.label}</span>`
            )
            .join('')}
        </div>
      </div>`
    )
    .join('');

  return `
    <div class="mt-4 rounded-xl bg-surface p-4">
      <p class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">${t('preview_title')}</p>
      ${rows}
      <p class="text-[11px] text-gray-400 mt-3">${t('preview_hint')}</p>
    </div>`;
}
