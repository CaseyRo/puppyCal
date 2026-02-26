#!/usr/bin/env node
/**
 * Write VERSION file from package.json (single source of truth).
 * Run after bumping version (e.g. npm version patch) so the VERSION file stays in sync.
 */
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const root = process.cwd();
const pkgPath = join(root, 'package.json');
const versionPath = join(root, 'VERSION');

const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
const version = pkg.version;
if (!version) {
  console.error('package.json has no "version" field');
  process.exit(1);
}

writeFileSync(versionPath, version + '\n');
console.log('Wrote VERSION:', version);
