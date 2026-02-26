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

function vevent(
  startDate: Date,
  summary: string,
  description: string,
  uidSuffix: string,
  comment?: string
): string {
  const dtStart = toYYYYMMDD(startDate);
  const endDate = new Date(startDate);
  endDate.setUTCDate(endDate.getUTCDate() + 1);
  const dtEnd = toYYYYMMDD(endDate);
  const commentLine = comment ? `COMMENT:${escapeICS(comment)}\r\n` : '';
  return [
    'BEGIN:VEVENT',
    `DTSTART;VALUE=DATE:${dtStart}`,
    `DTEND;VALUE=DATE:${dtEnd}`,
    `SUMMARY:${escapeICS(summary)}`,
    `DESCRIPTION:${escapeICS(description)}`,
    commentLine,
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

  let factIndex = 0;
  const walkMins = (weeks: number) => Math.max(1, weeks);
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);
  const endTime = end.getTime();

  while (current.getTime() < endTime) {
    const weeks = ageInWeeks(birth, current);
    const mins = walkMins(weeks);
    const fact = i18n.facts[factIndex % i18n.facts.length] ?? '';
    factIndex += 1;
    const walkSummary = tr(i18n, 'walk_summary', { name, mins });
    const walkRule = tr(i18n, 'walk_rule', { mins });
    const todaysFact = tr(i18n, 'todays_fact', { fact });
    const source = tr(i18n, 'source', {});
    const walkDesc = `${walkRule}\n\n${todaysFact}\n\n${source}`;
    lines.push(vevent(current, walkSummary, walkDesc, 'walk', fact));

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
