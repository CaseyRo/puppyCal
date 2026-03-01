#!/usr/bin/env node
/**
 * Screenshot script.
 * Captures phone and desktop viewports for all 3 tabs (food, walkies, dog)
 * with realistic filled-in data.
 * No-ops with exit 0 if no built app (dist/ or build/) exists.
 */
import { spawn } from 'child_process';
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync } from 'fs';
import { createServer } from 'http';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const VIEWPORTS = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'desktop', width: 1920, height: 1080 },
];

const TABS = ['food', 'walkies', 'dog'];

const DEFAULT_PORT = Number(process.env.SCREENSHOTS_PORT || 34567);
const SCREENSHOTS_DIR = join(root, 'screenshots');

// Realistic dog data
const DOG = {
  name: 'Bram',
  dob: '2025-11-01', // ~4 months old puppy
  start: '2025-03-01',
  weightKg: 7,
  weightG: 300,
  breedSize: 'medium',
  activity: 'moderate',
  neutered: false,
  goal: 'maintain',
  meals: 3,
  months: 3,
};

// Primary (dry) food
const DRY_FOOD = {
  supplier: 'royal-canin',
  productId: 'royal-canin-medium-puppy-dry',
};

// Second (wet) food for mixed mode
const WET_FOOD = {
  supplier: 'kivo',
  productId: 'kivo-rund-kip-compleet-portie',
};

// Mixed slider value (between 10–80)
const WET_PERCENT = 35;

function findBuildDir() {
  const dist = join(root, 'dist', 'index.html');
  const build = join(root, 'build', 'index.html');
  if (existsSync(dist)) return join(root, 'dist');
  if (existsSync(build)) return join(root, 'build');
  return null;
}

function startServer(server, port) {
  return new Promise((resolve, reject) => {
    server.listen(port, () => {
      const address = server.address();
      if (address && typeof address === 'object') {
        resolve(address.port);
      } else {
        reject(new Error('Failed to resolve screenshot server port'));
      }
    });
    server.on('error', reject);
  });
}

async function serveStatic(dir) {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const urlPath = new URL(req.url ?? '/', 'http://localhost').pathname;
      const path = urlPath === '/' ? '/index.html' : urlPath;
      const file = join(dir, path.replace(/^\//, ''));
      if (!file.startsWith(dir)) {
        res.writeHead(403).end();
        return;
      }
      if (!existsSync(file)) {
        res.writeHead(404).end();
        return;
      }
      const stat = statSync(file);
      if (stat.isDirectory()) {
        const index = join(file, 'index.html');
        if (existsSync(index)) {
          createReadStream(index).pipe(res);
        } else {
          res.writeHead(404).end();
        }
        return;
      }
      createReadStream(file).pipe(res);
    });
    startServer(server, DEFAULT_PORT)
      .then((port) => resolve({ server, port }))
      .catch(async (error) => {
        if (error.code !== 'EADDRINUSE') {
          reject(error);
          return;
        }
        try {
          const port = await startServer(server, 0);
          resolve({ server, port });
        } catch (fallbackError) {
          reject(fallbackError);
        }
      });
  });
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runBuild() {
  const pkgPath = join(root, 'package.json');
  if (!existsSync(pkgPath)) return false;
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  if (!pkg.scripts?.build) return true;
  return new Promise((resolve) => {
    const child = spawn('npm', ['run', 'build'], {
      cwd: root,
      stdio: 'inherit',
      shell: true,
    });
    child.on('close', (code) => resolve(code === 0));
  });
}

/**
 * Fill in all form data and select the food tab with a dry food selected.
 * This runs once after page load so all subsequent tab switches show populated data.
 */
async function fillData(page) {
  // --- Dog tab: fill in profile ---
  await page.click('#tab-dog');
  await page.waitForSelector('#dog-weight-kg', { timeout: 5000 });

  await page.fill('#dog-name', DOG.name);
  await page.fill('#dog-dob', DOG.dob);
  await page.fill('#dog-weight-kg', String(DOG.weightKg));
  await page.fill('#dog-weight-g', String(DOG.weightG));
  await page.selectOption('#dog-breed-size', DOG.breedSize);
  await page.selectOption('#dog-activity', DOG.activity);
  await page.selectOption('#dog-goal', DOG.goal);
  await page.selectOption('#dog-meals', String(DOG.meals));
  // fire change events so the app picks up the values
  await page.dispatchEvent('#dog-weight-kg', 'change');
  await page.dispatchEvent('#dog-weight-g', 'change');
  await page.dispatchEvent('#dog-dob', 'change');
  await wait(200);

  // --- Walkies tab: set name + dob + start ---
  await page.click('#tab-walkies');
  await page.waitForSelector('#dob', { timeout: 5000 });

  const nameInput = await page.$('#name');
  if (nameInput) {
    await nameInput.fill(DOG.name);
    await page.dispatchEvent('#name', 'change');
  }
  const dobInput = await page.$('#dob');
  if (dobInput) {
    await dobInput.fill(DOG.dob);
    await page.dispatchEvent('#dob', 'change');
  }
  const startInput = await page.$('#start');
  if (startInput) {
    await startInput.fill(DOG.start);
    await page.dispatchEvent('#start', 'change');
  }
  await wait(200);

  // --- Food tab: select dry food + enable mixed mode with wet food ---
  await page.click('#tab-food');
  await page.waitForSelector('#food-supplier', { timeout: 5000 });

  // Primary food: dry
  await page.selectOption('#food-supplier', DRY_FOOD.supplier);
  await wait(200);
  await page.selectOption('#food-product', DRY_FOOD.productId);
  await wait(200);

  // Enable mixed mode
  const mixedCheckbox = await page.$('#food-mixed-mode');
  if (mixedCheckbox) {
    const checked = await mixedCheckbox.isChecked();
    if (!checked) await mixedCheckbox.click();
    await wait(300);
  }

  // Second food: wet
  const secondSupplierEl = await page.$('#food-second-supplier');
  if (secondSupplierEl) {
    await page.selectOption('#food-second-supplier', WET_FOOD.supplier);
    await wait(200);
    await page.selectOption('#food-second-product', WET_FOOD.productId);
    await wait(200);
  }

  // Set wet/dry slider
  const sliderEl = await page.$('#food-wet-percent');
  if (sliderEl) {
    await sliderEl.evaluate((el, val) => {
      el.value = String(val);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, WET_PERCENT);
    await wait(200);
  }
}

async function main() {
  let dir = findBuildDir();
  if (!dir) {
    await runBuild();
    dir = findBuildDir();
    if (!dir) {
      console.log('No built app to screenshot (no dist/ or build/). Skipping.');
      process.exit(0);
    }
  }

  mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  const { server, port } = await serveStatic(dir);
  await wait(500);

  try {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch();
    const baseUrl = `http://127.0.0.1:${port}?lang=nl`;

    for (const vp of VIEWPORTS) {
      const page = await browser.newPage();
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(baseUrl, { waitUntil: 'networkidle' });
      await wait(400);

      // Fill all data once
      await fillData(page);

      // Screenshot each tab
      for (const tab of TABS) {
        await page.click(`#tab-${tab}`);
        await wait(400);

        const filename = `${vp.name}-${tab}.png`;
        const out = join(SCREENSHOTS_DIR, filename);
        await page.screenshot({ path: out, fullPage: vp.name === 'phone' });
        console.log(`Saved ${filename}`);
      }

      await page.close();
    }

    await browser.close();
  } finally {
    server.close();
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
