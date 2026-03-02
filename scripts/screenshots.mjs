#!/usr/bin/env node
/**
 * Screenshot script.
 * Captures phone and desktop viewports for all 3 tabs (food, walkies, dog)
 * with realistic filled-in data.
 * No-ops with exit 0 if no built app (dist/ or build/) exists.
 */
import { spawn } from 'child_process';
import {
  createReadStream,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
} from 'fs';
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

// ── Device mockup constants ─────────────────────────────────────────────────

const PHONE = {
  screenW: 390,
  screenH: 844,
  bodyW: 414,
  bodyH: 868,
  screenX: 12,
  screenY: 12,
  pad: 80,
  outerRx: 48,
  innerRx: 40,
};
const MONITOR = {
  screenW: 1280,
  screenH: 720,
  bodyW: 1300,
  bodyH: 740,
  screenX: 10,
  screenY: 10,
  pad: 100,
  outerRx: 12,
  // Stand dimensions
  neckTop: 80,
  neckBottom: 100,
  neckHeight: 100,
  baseW: 300,
  baseH: 10,
  baseRx: 5,
};

// ── SVG generators ──────────────────────────────────────────────────────────

function bgSvg(w, h) {
  const cx = Math.round(w / 2);
  const cy = Math.round(h * 0.4);
  const r = Math.round(Math.max(w, h) * 0.8);
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
      <defs>
        <radialGradient id="g" cx="${cx}" cy="${cy}" r="${r}" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#f5f0e8"/>
          <stop offset="70%" stop-color="#ebe4d8"/>
          <stop offset="100%" stop-color="#ddd5c5"/>
        </radialGradient>
      </defs>
      <rect width="${w}" height="${h}" fill="url(#g)"/>
    </svg>`
  );
}

function phoneFrameSvg() {
  const { bodyW: w, bodyH: h, screenX: sx, screenY: sy, screenW: sw, screenH: sh, outerRx, innerRx } = PHONE;
  const diW = 120, diH = 36, diRx = 18;
  const diX = Math.round((w - diW) / 2);
  const diY = Math.round(sy / 2 - diH / 2 + 2);
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
      <defs>
        <mask id="m">
          <rect width="${w}" height="${h}" rx="${outerRx}" fill="white"/>
          <rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" rx="${innerRx}" fill="black"/>
        </mask>
      </defs>
      <!-- Body with screen cutout -->
      <rect width="${w}" height="${h}" rx="${outerRx}" fill="#1A1A1C" mask="url(#m)"/>
      <!-- Stainless steel edge highlight -->
      <rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="${outerRx}" fill="none"
            stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
      <!-- Dynamic Island -->
      <rect x="${diX}" y="${diY}" width="${diW}" height="${diH}" rx="${diRx}" fill="#0A0A0A"/>
      <!-- Side buttons: power (right) -->
      <rect x="${w - 1}" y="180" width="3" height="60" rx="1.5" fill="#2A2A2C"/>
      <!-- Volume up (left) -->
      <rect x="-2" y="160" width="3" height="36" rx="1.5" fill="#2A2A2C"/>
      <!-- Volume down (left) -->
      <rect x="-2" y="210" width="3" height="36" rx="1.5" fill="#2A2A2C"/>
      <!-- Mute switch (left) -->
      <rect x="-2" y="130" width="3" height="18" rx="1.5" fill="#2A2A2C"/>
      <!-- Screen inset stroke -->
      <rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" rx="${innerRx}" fill="none"
            stroke="rgba(0,0,0,0.2)" stroke-width="0.5"/>
    </svg>`
  );
}

function monitorFrameSvg() {
  const { bodyW: w, bodyH: h, screenX: sx, screenY: sy, screenW: sw, screenH: sh, outerRx,
          neckTop, neckBottom, neckHeight, baseW, baseH, baseRx } = MONITOR;
  const cx = w / 2;
  const totalH = h + neckHeight + baseH;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${totalH}">
      <defs>
        <mask id="m">
          <rect width="${w}" height="${h}" rx="${outerRx}" fill="white"/>
          <rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" rx="4" fill="black"/>
        </mask>
        <linearGradient id="stand" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#A8A8AC"/>
          <stop offset="50%" stop-color="#C0C0C4"/>
          <stop offset="100%" stop-color="#A8A8AC"/>
        </linearGradient>
      </defs>
      <!-- Display body: dark space-gray bezels -->
      <rect width="${w}" height="${h}" rx="${outerRx}" fill="#2C2C2E" mask="url(#m)"/>
      <!-- Subtle edge highlight -->
      <rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="${outerRx}" fill="none"
            stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
      <!-- Screen inset stroke -->
      <rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" rx="4" fill="none"
            stroke="rgba(0,0,0,0.15)" stroke-width="0.5"/>
      <!-- Stand neck (tapered trapezoid) -->
      <path d="M${cx - neckTop / 2},${h} L${cx + neckTop / 2},${h} L${cx + neckBottom / 2},${h + neckHeight} L${cx - neckBottom / 2},${h + neckHeight} Z"
            fill="url(#stand)"/>
      <!-- Stand base -->
      <rect x="${cx - baseW / 2}" y="${h + neckHeight}" width="${baseW}" height="${baseH}" rx="${baseRx}" fill="url(#stand)"/>
    </svg>`
  );
}

function phoneGlareSvg(w, h, rx) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
      <defs>
        <linearGradient id="glare" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="rgba(255,255,255,0.10)"/>
          <stop offset="50%" stop-color="rgba(255,255,255,0.03)"/>
          <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
        </linearGradient>
        <clipPath id="clip"><rect width="${w}" height="${h}" rx="${rx}"/></clipPath>
      </defs>
      <rect width="${w}" height="${h}" rx="${rx}" fill="url(#glare)" clip-path="url(#clip)"/>
    </svg>`
  );
}

function monitorGlareSvg(w, h, rx) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
      <defs>
        <linearGradient id="glare" x1="0" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stop-color="rgba(255,255,255,0.08)"/>
          <stop offset="40%" stop-color="rgba(255,255,255,0.02)"/>
          <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
        </linearGradient>
        <clipPath id="clip"><rect width="${w}" height="${h}" rx="${rx}"/></clipPath>
      </defs>
      <rect width="${w}" height="${h}" rx="${rx}" fill="url(#glare)" clip-path="url(#clip)"/>
    </svg>`
  );
}

// ── Sharp pipeline helpers ──────────────────────────────────────────────────

async function createBackground(sharp, w, h) {
  return sharp(bgSvg(w, h)).ensureAlpha().toBuffer();
}

async function createShadow(sharp, bodyW, bodyH, rx, offsetY, blur, opacity, canvasW, canvasH) {
  // Build the shadow at canvas size so it never exceeds composite bounds
  const cx = Math.round(canvasW / 2);
  const cy = Math.round(canvasH / 2) + offsetY;
  const x = cx - Math.round(bodyW / 2);
  const y = cy - Math.round(bodyH / 2);
  const shadowSvg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasW}" height="${canvasH}">
      <rect x="${x}" y="${y}" width="${bodyW}" height="${bodyH}" rx="${rx}" fill="rgba(0,0,0,${opacity})"/>
    </svg>`
  );
  return sharp(shadowSvg).blur(blur).toBuffer();
}

function roundCornersMask(w, h, rx) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
      <rect width="${w}" height="${h}" rx="${rx}" fill="white"/>
    </svg>`
  );
}

// ── Mockup builders ─────────────────────────────────────────────────────────

async function createPhoneMockup(sharp, tab, outputPath) {
  const phoneSrc = join(SCREENSHOTS_DIR, `phone-${tab}.png`);
  if (!existsSync(phoneSrc)) return;

  const { pad, bodyW, bodyH, screenX, screenY, screenW, screenH, outerRx, innerRx } = PHONE;
  const cw = bodyW + pad * 2;
  const ch = bodyH + pad * 2;

  // Round-corner the screen content
  const rawScreen = await sharp(phoneSrc)
    .resize(screenW, screenH, { fit: 'cover', position: 'top' })
    .ensureAlpha()
    .toBuffer();
  const mask = roundCornersMask(screenW, screenH, innerRx);
  const screen = await sharp(rawScreen)
    .composite([{ input: mask, blend: 'dest-in' }])
    .toBuffer();

  const shadow = await createShadow(sharp, bodyW, bodyH, outerRx, 15, 40, 0.22, cw, ch);
  const bg = await createBackground(sharp, cw, ch);
  const glare = phoneGlareSvg(screenW, screenH, innerRx);

  await sharp(bg)
    .composite([
      { input: shadow, left: 0, top: 0 },
      { input: screen, left: pad + screenX, top: pad + screenY },
      { input: phoneFrameSvg(), left: pad, top: pad },
      { input: glare, left: pad + screenX, top: pad + screenY, blend: 'screen' },
    ])
    .png()
    .toFile(outputPath);
  console.log(`Mockup: ${outputPath.split('/').pop()}`);
}

async function createMonitorMockup(sharp, tab, outputPath) {
  const desktopSrc = join(SCREENSHOTS_DIR, `desktop-${tab}.png`);
  if (!existsSync(desktopSrc)) return;

  const { pad, bodyW, bodyH, screenX, screenY, screenW, screenH, outerRx,
          neckHeight, baseH } = MONITOR;
  const totalDeviceH = bodyH + neckHeight + baseH;
  const cw = bodyW + pad * 2;
  const ch = totalDeviceH + pad * 2;

  const rawScreen = await sharp(desktopSrc)
    .resize(screenW, screenH, { fit: 'cover', position: 'top' })
    .ensureAlpha()
    .toBuffer();
  const mask = roundCornersMask(screenW, screenH, 4);
  const screen = await sharp(rawScreen)
    .composite([{ input: mask, blend: 'dest-in' }])
    .toBuffer();

  const shadow = await createShadow(sharp, bodyW, bodyH, outerRx, 15, 40, 0.20, cw, ch);
  const bg = await createBackground(sharp, cw, ch);
  const glare = monitorGlareSvg(screenW, screenH, 4);

  await sharp(bg)
    .composite([
      { input: shadow, left: 0, top: 0 },
      { input: screen, left: pad + screenX, top: pad + screenY },
      { input: monitorFrameSvg(), left: pad, top: pad },
      { input: glare, left: pad + screenX, top: pad + screenY, blend: 'screen' },
    ])
    .png()
    .toFile(outputPath);
  console.log(`Mockup: ${outputPath.split('/').pop()}`);
}

async function createDeviceOnTransparent(sharp, type, tab) {
  const isPhone = type === 'phone';
  const src = join(SCREENSHOTS_DIR, `${isPhone ? 'phone' : 'desktop'}-${tab}.png`);
  if (!existsSync(src)) return null;

  const cfg = isPhone ? PHONE : MONITOR;
  const { bodyW, bodyH, screenX, screenY, screenW, screenH, outerRx } = cfg;
  const totalH = isPhone ? bodyH : bodyH + MONITOR.neckHeight + MONITOR.baseH;
  const shadowPad = 120;

  const rawScreen = await sharp(src)
    .resize(screenW, screenH, { fit: 'cover', position: 'top' })
    .ensureAlpha()
    .toBuffer();
  const innerRx = isPhone ? cfg.innerRx : 4;
  const mask = roundCornersMask(screenW, screenH, innerRx);
  const screen = await sharp(rawScreen)
    .composite([{ input: mask, blend: 'dest-in' }])
    .toBuffer();

  const canvasW = bodyW + shadowPad;
  const canvasH = totalH + shadowPad + 15;
  const offX = Math.round((canvasW - bodyW) / 2);
  const offY = Math.round((canvasH - totalH) / 2);

  const shadow = await createShadow(sharp, bodyW, bodyH, outerRx, 15, 35, isPhone ? 0.28 : 0.20, canvasW, canvasH);

  const frame = isPhone ? phoneFrameSvg() : monitorFrameSvg();
  const glare = isPhone
    ? phoneGlareSvg(screenW, screenH, innerRx)
    : monitorGlareSvg(screenW, screenH, innerRx);

  const transparent = await sharp({
    create: { width: canvasW, height: canvasH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([
      { input: shadow, left: 0, top: 0 },
      { input: screen, left: offX + screenX, top: offY + screenY },
      { input: frame, left: offX, top: offY },
      { input: glare, left: offX + screenX, top: offY + screenY, blend: 'screen' },
    ])
    .png()
    .toBuffer();

  return { buffer: transparent, width: canvasW, height: canvasH, deviceLeft: offX, deviceTop: offY };
}

async function createHeroComposition(sharp, tab, outputPath) {
  const heroW = 1600, heroH = 1000;

  const [desktop, phone] = await Promise.all([
    createDeviceOnTransparent(sharp, 'desktop', tab),
    createDeviceOnTransparent(sharp, 'phone', tab),
  ]);
  if (!desktop && !phone) return;

  const bg = await createBackground(sharp, heroW, heroH);
  const layers = [];

  if (desktop) {
    const desktopScale = 1200 / desktop.width;
    const dW = Math.round(desktop.width * desktopScale);
    const dH = Math.round(desktop.height * desktopScale);
    const desktopBuf = await sharp(desktop.buffer).resize(dW, dH).toBuffer();
    layers.push({ input: desktopBuf, left: 60, top: 50 });
  }

  if (phone) {
    const phoneScale = 280 / phone.width;
    const pW = Math.round(phone.width * phoneScale);
    const pH = Math.round(phone.height * phoneScale);
    const phoneBuf = await sharp(phone.buffer).resize(pW, pH).toBuffer();
    layers.push({ input: phoneBuf, left: 1100, top: 420 });
  }

  await sharp(bg)
    .composite(layers)
    .png()
    .toFile(outputPath);
  console.log(`Hero: ${outputPath.split('/').pop()}`);
}

async function createMockups() {
  const { default: sharp } = await import('sharp');
  const mockupDir = join(SCREENSHOTS_DIR, 'mockups');
  mkdirSync(mockupDir, { recursive: true });
  // Clear stale mockups
  readdirSync(mockupDir)
    .filter((f) => f.endsWith('.png'))
    .forEach((f) => rmSync(join(mockupDir, f)));

  for (const tab of TABS) {
    await createPhoneMockup(sharp, tab, join(mockupDir, `phone-${tab}.png`));
    await createMonitorMockup(sharp, tab, join(mockupDir, `desktop-${tab}.png`));
    await createHeroComposition(sharp, tab, join(mockupDir, `hero-${tab}.png`));
  }
}

async function main() {
  const buildOk = await runBuild();
  if (!buildOk) {
    console.error('Build failed. Aborting screenshots.');
    process.exit(1);
  }
  const dir = findBuildDir();
  if (!dir) {
    console.log('No built app to screenshot (no dist/ or build/). Skipping.');
    process.exit(0);
  }

  mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  // Remove existing screenshots before capturing fresh ones
  readdirSync(SCREENSHOTS_DIR)
    .filter((f) => f.endsWith('.png'))
    .forEach((f) => rmSync(`${SCREENSHOTS_DIR}/${f}`));

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

  await createMockups();

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
