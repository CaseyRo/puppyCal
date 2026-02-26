#!/usr/bin/env node
/**
 * Pre-commit screenshot script.
 * Captures phone, laptop (portrait + landscape), and desktop viewports.
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
  { name: 'laptop-portrait', width: 768, height: 1024 },
  { name: 'laptop-landscape', width: 1024, height: 768 },
  { name: 'desktop', width: 1920, height: 1080 },
];

const DEFAULT_PORT = Number(process.env.SCREENSHOTS_PORT || 34567);
const SCREENSHOTS_DIR = join(root, 'screenshots');

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
      const path = req.url === '/' ? '/index.html' : req.url;
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
    const page = await browser.newPage();
    const baseUrl = `http://127.0.0.1:${port}`;

    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(baseUrl, { waitUntil: 'networkidle' });
      const out = join(SCREENSHOTS_DIR, `${vp.name}.png`);
      await page.screenshot({ path: out });
      console.log(`Saved ${vp.name}.png`);
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
