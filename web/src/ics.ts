/**
 * RFC 5545 ICS generation. Pure function: generateICS(config, i18n) -> string.
 */

import type { Config } from './config';
import type { I18nData } from './i18n';
import { formatString } from './i18n';

/** RFC 5545: escape \ , ; and newlines in text values */
export function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function allDayEvent(
  date: Date,
  summary: string,
  description: string,
  uidSuffix: string,
  comment?: string
): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const dtStart = `${y}${m}${d}`;
  const endDate = new Date(date);
  endDate.setDate(endDate.getDate() + 1);
  const ye = endDate.getFullYear();
  const me = String(endDate.getMonth() + 1).padStart(2, '0');
  const de = String(endDate.getDate()).padStart(2, '0');
  const dtEnd = `${ye}${me}${de}`;
  const lines = [
    'BEGIN:VEVENT',
    `DTSTART;VALUE=DATE:${dtStart}`,
    `DTEND;VALUE=DATE:${dtEnd}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
  ];
  if (comment) lines.push(`COMMENT:${escapeIcsText(comment)}`);
  lines.push(`UID:${dtStart}-${uidSuffix}@puppy-schedule`);
  lines.push('STATUS:CONFIRMED', 'TRANSP:TRANSPARENT', 'END:VEVENT');
  return lines.join('\r\n');
}

function parseDate(s: string): Date | null {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

function weeksBetween(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  return Math.floor(ms / (7 * 24 * 60 * 60 * 1000));
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function generateICS(config: Config, i18n: I18nData): string {
  const name = config.name || 'Puppy';
  const strings = i18n.strings;
  const facts = i18n.facts;
  const factCount = facts.length;

  const dobDate = parseDate(config.dob);
  const startDate = parseDate(config.start);
  if (!dobDate || !startDate) return '';

  const months = Math.max(1, Math.min(3, config.months));
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + months);

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//Puppy Schedule//${name}//EN`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  // Birth event
  const birthSummary = formatString(strings.birth_summary ?? '{name} was born!', { name });
  const birthDesc = formatString(strings.birth_desc ?? '{name} the Stabyhoun was born on this day.', { name });
  lines.push(allDayEvent(dobDate, birthSummary, birthDesc, 'birth', birthDesc));

  let factIndex = 0;
  let current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  const planDays = Math.ceil((end.getTime() - current.getTime()) / (24 * 60 * 60 * 1000));
  const totalPlanDays = planDays;

  while (current.getTime() < end.getTime()) {
    const ageWeeks = weeksBetween(dobDate, current);
    const walkMins = Math.max(0, ageWeeks);

    const walkSummary = formatString(strings.walk_summary ?? '{name} - Walk: {mins} mins (x2)', {
      name,
      mins: walkMins,
    });
    const walkRule = formatString(strings.walk_rule ?? 'Rule: {mins} minutes per walk, twice a day.', {
      mins: walkMins,
    });
    const fact = facts[factIndex % factCount] ?? '';
    factIndex++;
    const todaysFact = formatString(strings.todays_fact ?? "Today's fact: {fact}", { fact });
    const source = strings.source ?? 'Source: 5-minute rule (Puppy Culture/Kennel Clubs).';
    const description = `${walkRule}\n\n${todaysFact}\n\n${source}`;
    lines.push(allDayEvent(current, walkSummary, description, 'walk', fact));

    // Weekly age milestone (Monday = 1)
    if (current.getDay() === 1) {
      const ageSummary = formatString(strings.age_summary ?? '{name} is {weeks} Weeks Old Today!', {
        name,
        weeks: ageWeeks,
      });
      const ageDesc = formatString(strings.age_desc ?? '{name} the Stabyhoun is now {weeks} weeks old.', {
        name,
        weeks: ageWeeks,
      });
      lines.push(allDayEvent(current, ageSummary, ageDesc, 'age', ageDesc));
    }

    // Birthday
    if (config.birthday && current.getMonth() === dobDate.getMonth() && current.getDate() === dobDate.getDate()) {
      const yearsOld = Math.floor(weeksBetween(dobDate, current) / 52);
      if (yearsOld >= 1) {
        const bdaySummary =
          yearsOld === 1
            ? formatString(strings.birthday_summary_1 ?? "{name}'s 1st Birthday!", { name })
            : formatString(strings.birthday_summary_n ?? "{name}'s {n}th Birthday!", { name, n: yearsOld });
        const bdayDesc = formatString(strings.birthday_desc ?? `Happy birthday to ${name}!`, { name });
        lines.push(allDayEvent(current, bdaySummary, bdayDesc, 'birthday', bdayDesc));
      }
    }

    // Feeding events: one per meal per day (times 8, 12, 18, …)
    if (config.feeding && config.meals >= 1) {
      const dayIndex = Math.floor((current.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
      const t = totalPlanDays <= 1 ? 1 : dayIndex / (totalPlanDays - 1);
      const gramsToday = Math.round(config.gramsStart + t * (config.gramsEnd - config.gramsStart));
      const gramsPerMeal = (gramsToday / config.meals).toFixed(0);
      const feedSummary = formatString(strings.feed_summary ?? '{name} – Feed: {grams}g', {
        name,
        grams: gramsPerMeal,
      });
      const feedDesc = `${gramsToday}g per day, ${config.meals} meals (≈${gramsPerMeal}g per meal)`;
      const hours = [8, 12, 18, 7, 13, 19]; // fallback for >3 meals
      for (let i = 0; i < config.meals; i++) {
        const hour = hours[i] ?? 8 + i * 4;
        lines.push(timedEvent(current, hour, feedSummary, feedDesc, `feed-${i}`));
      }
    }

    current = addDays(current, 1);
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function timedEvent(
  date: Date,
  hour: number,
  summary: string,
  description: string,
  uidSuffix: string
): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(hour).padStart(2, '0');
  const dtStart = `${y}${m}${d}T${h}0000`;
  const dtEnd = `${y}${m}${d}T${String(hour + 1).padStart(2, '0')}0000`;
  const lines = [
    'BEGIN:VEVENT',
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `UID:${dtStart}-${uidSuffix}@puppy-schedule`,
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    'END:VEVENT',
  ];
  return lines.join('\r\n');
}
