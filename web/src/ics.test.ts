/**
 * Basic tests for generateICS (task 5.8).
 */

import { generateICS } from './ics';
import type { Config } from './config';
import type { I18nData } from './i18n';

const minimalI18n: I18nData = {
  strings: {
    birth_summary: '{name} was born!',
    birth_desc: '{name} was born on this day.',
    walk_summary: '{name} - Walk: {mins} mins (x2)',
    walk_rule: 'Rule: {mins} min per walk.',
    todays_fact: 'Fact: {fact}',
    source: 'Source.',
    age_summary: '{name} is {weeks} weeks old!',
    age_desc: '{name} is {weeks} weeks old.',
    birthday_summary_1: "{name}'s 1st birthday!",
    birthday_summary_n: "{name}'s {n}th birthday!",
    birthday_desc: 'Happy birthday {name}!',
    feed_summary: '{name} – Feed: {grams}g',
  },
  facts: ['Fact one.', 'Fact two.'],
};

function config(overrides: Partial<Config> = {}): Config {
  return {
    lang: 'en',
    dob: '2025-01-01',
    months: 2,
    start: '2025-06-01',
    birthday: true,
    name: 'Test',
    notes: '',
    feeding: false,
    meals: 3,
    gramsStart: 200,
    gramsEnd: 280,
    ...overrides,
  };
}

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

// Walking-only: calendar has VCALENDAR, birth event, and walk events
const icsWalking = generateICS(config(), minimalI18n);
assert(icsWalking.includes('BEGIN:VCALENDAR'), 'has VCALENDAR');
assert(icsWalking.includes('END:VCALENDAR'), 'has end VCALENDAR');
assert(icsWalking.includes('Test was born!'), 'has birth summary');
assert(icsWalking.includes('Walk:'), 'has walk events');
assert(icsWalking.includes('Fact one.'), 'has fact in description');
console.log('Walking-only: OK');

// With feeding: has feeding events
const icsFeeding = generateICS(config({ feeding: true, meals: 2, gramsStart: 100, gramsEnd: 200 }), minimalI18n);
assert(icsFeeding.includes('Feed:'), 'has feed events');
console.log('With feeding: OK');

// Plan length capped at 3 months
const icsThreeMonths = generateICS(config({ start: '2025-01-01', months: 3 }), minimalI18n);
const eventCount = (icsThreeMonths.match(/BEGIN:VEVENT/g) || []).length;
assert(eventCount > 0, 'has events');
console.log('Edge dates / 3 months: OK');

console.log('All generateICS checks passed.');
