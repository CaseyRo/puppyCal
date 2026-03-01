#!/usr/bin/env tsx
/**
 * Footer Config Validation Script
 * 
 * Validates footer configuration files to ensure they match the FooterConfig type.
 * 
 * Usage:
 *   tsx scripts/validate-config.ts <path-to-config-file>
 * 
 * Example:
 *   tsx scripts/validate-config.ts examples/writings.config.ts
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { FooterConfig } from '../src/types';

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function validateConfig(config: FooterConfig): ValidationResult {
  const errors: string[] = [];

  // Check required fields
  if (!config.outlet) {
    errors.push('"outlet" is required');
  }
  if (!config.network?.title) {
    errors.push('"network.title" is required');
  }
  if (!config.columns?.primary?.title) {
    errors.push('"columns.primary.title" is required');
  }
  if (!config.meta?.copyrightText) {
    errors.push('"meta.copyrightText" is required');
  }
  if (!config.meta?.madeWithTextKey) {
    errors.push('"meta.madeWithTextKey" is required');
  }

  // Validate outlet value
  if (config.outlet) {
    const validOutlets = ['cdit', 'cv', 'writings'];
    if (!validOutlets.includes(config.outlet)) {
      errors.push(`"outlet" must be one of ${validOutlets.join(', ')}, got "${config.outlet}"`);
    }
  }

  // Validate network.items
  if (config.network?.items) {
    if (!Array.isArray(config.network.items)) {
      errors.push('"network.items" must be an array');
    } else if (config.network.items.length === 0) {
      errors.push('"network.items" must contain at least one item');
    }
  }

  // Validate columns.primary.items
  if (config.columns?.primary?.items) {
    if (!Array.isArray(config.columns.primary.items)) {
      errors.push('"columns.primary.items" must be an array');
    }
  }

  // Validate meta.rightSide
  if (config.meta?.rightSide) {
    if (config.meta.rightSide.type === 'legal') {
      if (!config.meta.rightSide.items || !Array.isArray(config.meta.rightSide.items)) {
        errors.push('"meta.rightSide.items" must be an array when type is "legal"');
      }
    } else if (config.meta.rightSide.type === 'location') {
      if (!config.meta.rightSide.text || typeof config.meta.rightSide.text !== 'string') {
        errors.push('"meta.rightSide.text" must be a string when type is "location"');
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

async function main() {
  const configPath = process.argv[2];

  if (!configPath) {
    console.error('Error: Config file path is required');
    console.error('Usage: tsx scripts/validate-config.ts <path-to-config-file>');
    process.exit(1);
  }

  const resolvedPath = resolve(configPath);
  
  console.log(`Validating config file: ${resolvedPath}`);
  
  // Note: Config files that use import.meta.env (Astro-specific) cannot be validated
  // outside of Astro's build context. Check if file uses import.meta.env
  const fileContent = readFileSync(resolvedPath, 'utf-8');
  if (fileContent.includes('import.meta.env')) {
    console.warn('⚠ Warning: Config file uses import.meta.env (Astro-specific)');
    console.warn('  This validation script cannot validate configs with import.meta.env');
    console.warn('  outside of Astro context. Configs will be validated at build time.');
    console.warn('  Consider creating a test config without env vars for pre-commit validation.');
    console.log('✓ Skipping validation (expected for Astro configs with env vars)');
    process.exit(0);
  }

  try {
    // Try to import the config file
    const module = await import(resolvedPath);
    const config = module.footerConfig || module.default;

    if (!config) {
      console.error('Error: Config file must export "footerConfig" or a default export');
      process.exit(1);
    }

    const result = validateConfig(config);

    if (result.valid) {
      console.log('✓ Config is valid');
      process.exit(0);
    } else {
      console.error('✗ Config validation failed:');
      result.errors.forEach((error) => {
        console.error(`  - ${error}`);
      });
      process.exit(1);
    }
  } catch (error) {
    console.error(`Error reading config file: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

main();
