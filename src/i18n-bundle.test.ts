import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function readStrings(file: string): Record<string, string> {
  const path = resolve(process.cwd(), 'i18n', file);
  return JSON.parse(readFileSync(path, 'utf8')).strings as Record<string, string>;
}

describe('planner i18n bundles', () => {
  const requiredKeys = [
    'hint_dob',
    'hint_months',
    'hint_start',
    'hint_name',
    'hint_notes',
    'footer_about_1',
    'footer_about_2',
    'footer_disclaimer',
    'label_age_years',
    'error_months_max',
  ];

  it('contains required keys in nl bundle', () => {
    const strings = readStrings('nl.json');
    requiredKeys.forEach((key) => expect(strings[key]).toBeTruthy());
  });

  it('contains required keys in en bundle', () => {
    const strings = readStrings('en.json');
    requiredKeys.forEach((key) => expect(strings[key]).toBeTruthy());
  });
});
