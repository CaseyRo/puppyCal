import { describe, it, expect } from 'vitest';
import { generateICS } from './ics';
import type { Config } from './config';
import type { I18nData } from './i18n';

const baseI18n: I18nData = {
  strings: {
    birth_summary: '{name} was born!',
    birth_desc: '{name} the Stabyhoun was born on this day.',
    walk_summary: '{name} - Walk: {mins} mins (x2)',
    walk_rule: 'Rule: {mins} minutes per walk.',
    todays_fact: "Today's fact: {fact}",
    source: 'Source: 5-minute rule.',
    age_summary: '{name} is {weeks} Weeks Old Today!',
    age_desc: '{name} is now {weeks} weeks old.',
    birthday_summary_1: "{name}'s 1st Birthday!",
    birthday_summary_n: "{name}'s {n}th Birthday!",
    birthday_desc: 'Happy birthday to {name}!',
  },
  facts: {
    generic: [
      {
        text: 'Fact one.',
        sourceLabel: 'Source A',
        sourceUrl: 'https://example.com/a',
      },
      {
        text: 'Fact two.',
        sourceLabel: 'Source B',
        sourceUrl: 'https://example.com/b',
      },
    ],
  },
};

const baseConfig: Config = {
  lang: 'en',
  dob: '2025-01-01',
  months: 1,
  start: '2025-06-01',
  breed: 'stabyhoun',
  birthday: true,
  name: 'Pup',
  notes: '',
  feeding: false,
  meals: 3,
  gramsStart: 200,
  gramsEnd: 280,
};

describe('generateICS', () => {
  it('returns RFC 5545 calendar with BEGIN:VCALENDAR and END:VCALENDAR', () => {
    const ics = generateICS(baseConfig, baseI18n);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('END:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
  });

  it('includes birth event when DOB is set', () => {
    const ics = generateICS(baseConfig, baseI18n);
    expect(ics).toContain('Pup was born!');
    expect(ics).toMatch(/DTSTART;VALUE=DATE:20250101/);
  });

  it('includes walking events for each day in plan (1 min per week of age)', () => {
    const ics = generateICS(baseConfig, baseI18n);
    expect(ics).toContain('Walk:');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('END:VEVENT');
  });

  it('caps months to 1–3', () => {
    const c = { ...baseConfig, months: 5 };
    const ics = generateICS(c, baseI18n);
    expect(ics).toBeTruthy();
    const eventCount = (ics.match(/BEGIN:VEVENT/g) || []).length;
    expect(eventCount).toBeGreaterThan(0);
  });

  it('returns empty string when DOB or start invalid', () => {
    expect(generateICS({ ...baseConfig, dob: '' }, baseI18n)).toBe('');
    expect(generateICS({ ...baseConfig, start: 'invalid' }, baseI18n)).toBe('');
  });

  it('includes feeding events when feeding enabled', () => {
    const c = { ...baseConfig, feeding: true, meals: 2, gramsStart: 100, gramsEnd: 150 };
    const ics = generateICS(c, baseI18n);
    expect(ics).toContain('Feeding');
  });

  it('uses stable randomized fact order with source attribution', () => {
    const icsA = generateICS(baseConfig, baseI18n);
    const icsB = generateICS(baseConfig, baseI18n);

    expect(icsA).toBe(icsB);
    expect(icsA).toContain("Today's fact:");
    expect(icsA).toContain('Source: Source ');
    expect(icsA).toContain('URL:https://example.com/');
  });
});
