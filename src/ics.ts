/**
 * RFC 5545 ICS generation (pure function).
 * Walking: 1 minute per week of age; optional feeding with linear interpolation.
 */
import type { Config } from './config';
import type { I18nData } from './i18n';
import { tr } from './i18n';

function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function toYYYYMMDD(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

function parseDate(s: string): Date | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(s + 'T12:00:00Z');
  return isNaN(d.getTime()) ? null : d;
}

function daysBetween(a: Date, b: Date): number {
  const t = (b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000);
  return Math.floor(t);
}

function ageInWeeks(birth: Date, day: Date): number {
  const days = daysBetween(birth, day);
  return Math.max(0, Math.floor(days / 7));
}

function isMonday(d: Date): boolean {
  return d.getUTCDay() === 1;
}

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function shuffledIndices(length: number, seed: number): number[] {
  const indices = Array.from({ length }, (_, i) => i);
  let state = seed || 1;
  for (let i = indices.length - 1; i > 0; i -= 1) {
    state = Math.imul(1664525, state) + 1013904223;
    const r = (state >>> 0) % (i + 1);
    const tmp = indices[i];
    indices[i] = indices[r];
    indices[r] = tmp;
  }
  return indices;
}

function vevent(
  startDate: Date,
  summary: string,
  description: string,
  uidSuffix: string,
  comment?: string,
  sourceUrl?: string
): string {
  const dtStart = toYYYYMMDD(startDate);
  const endDate = new Date(startDate);
  endDate.setUTCDate(endDate.getUTCDate() + 1);
  const dtEnd = toYYYYMMDD(endDate);
  const commentLine = comment ? `COMMENT:${escapeICS(comment)}\r\n` : '';
  const urlLine = sourceUrl ? `URL:${escapeICS(sourceUrl)}\r\n` : '';
  return [
    'BEGIN:VEVENT',
    `DTSTART;VALUE=DATE:${dtStart}`,
    `DTEND;VALUE=DATE:${dtEnd}`,
    `SUMMARY:${escapeICS(summary)}`,
    `DESCRIPTION:${escapeICS(description)}`,
    commentLine,
    urlLine,
    `UID:${dtStart}-${uidSuffix}@puppycal`,
    'STATUS:CONFIRMED',
    'TRANSP:TRANSPARENT',
    'END:VEVENT',
  ].join('\r\n');
}

export function generateICS(config: Config, i18n: I18nData): string {
  const name = config.name || 'Puppy';
  const birth = parseDate(config.dob);
  const start = parseDate(config.start);
  if (!birth || !start) return '';

  const months = Math.min(3, Math.max(1, config.months));
  const end = new Date(start);
  end.setMonth(end.getMonth() + months);

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PuppyCal//1.0//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  const birthSummary = tr(i18n, 'birth_summary', { name });
  const birthDesc = tr(i18n, 'birth_desc', { name });
  lines.push(vevent(birth, birthSummary, birthDesc, 'birth', birthDesc));

  const facts = i18n.facts;
  const factOrder = shuffledIndices(
    facts.length,
    hashSeed(`${config.dob}|${config.start}|${config.name}|${config.breed}`)
  );
  const walkMins = (weeks: number) => Math.max(1, weeks);
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);
  const endTime = end.getTime();

  while (current.getTime() < endTime) {
    const dayIndex = daysBetween(start, current);
    const weeks = ageInWeeks(birth, current);
    const mins = walkMins(weeks);
    const factEntry =
      facts.length > 0 ? facts[factOrder[dayIndex % factOrder.length] ?? 0] : undefined;
    const fact = factEntry?.text ?? '';
    const source = factEntry?.sourceLabel ?? tr(i18n, 'source', {});
    const sourceText = factEntry?.sourceUrl ? `${source} (${factEntry.sourceUrl})` : source;
    const walkSummary = tr(i18n, 'walk_summary', { name, mins });
    const walkRule = tr(i18n, 'walk_rule', { mins });
    const todaysFact = tr(i18n, 'todays_fact', { fact });
    const walkDesc = `${walkRule}\n\n${todaysFact}\n\nSource: ${sourceText}`;
    lines.push(vevent(current, walkSummary, walkDesc, 'walk', fact, factEntry?.sourceUrl));

    if (isMonday(current)) {
      const ageSummary = tr(i18n, 'age_summary', { name, weeks });
      const ageDesc = tr(i18n, 'age_desc', { name, weeks });
      lines.push(vevent(current, ageSummary, ageDesc, 'age', ageDesc));
    }

    const sameMonthDay =
      current.getUTCMonth() === birth.getUTCMonth() && current.getUTCDate() === birth.getUTCDate();
    if (sameMonthDay && config.birthday) {
      const years = Math.floor(daysBetween(birth, current) / 365);
      const bdaySummary =
        years === 1
          ? tr(i18n, 'birthday_summary_1', { name })
          : tr(i18n, 'birthday_summary_n', { name, n: years });
      const bdayDesc = tr(i18n, 'birthday_desc', { name });
      lines.push(vevent(current, bdaySummary, bdayDesc, 'birthday', bdayDesc));
    }

    if (config.feeding && config.meals >= 1) {
      const totalDays = daysBetween(start, end);
      const dayIndex = daysBetween(start, current);
      const t = totalDays <= 0 ? 1 : dayIndex / totalDays;
      const gramsPerDay = config.gramsStart + t * (config.gramsEnd - config.gramsStart);
      const perMeal = gramsPerDay / config.meals;
      for (let m = 0; m < config.meals; m++) {
        const feedSummary = `${name} – Feeding (${Math.round(perMeal)}g)`;
        const feedDesc = `Meal ${m + 1}/${config.meals}, ~${Math.round(perMeal)}g. Daily total: ${Math.round(gramsPerDay)}g.`;
        lines.push(vevent(current, feedSummary, feedDesc, `feed-${m}`, feedDesc));
      }
    }

    current.setUTCDate(current.getUTCDate() + 1);
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
