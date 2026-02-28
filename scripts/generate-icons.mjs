/**
 * Icon generation script.
 * Reads images/icon.png and outputs all required sizes/formats to public/icons/.
 * Run: npm run generate-icons
 */
import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INPUT = path.join(__dirname, '..', 'images', 'icon.png');
const OUT_DIR = path.join(__dirname, '..', 'public', 'icons');
const FAVICON_OUT = path.join(__dirname, '..', 'public', 'favicon.ico');

await fs.mkdir(OUT_DIR, { recursive: true });

// PNG sizes
const pngSizes = [16, 32, 48, 180, 192, 512];
for (const size of pngSizes) {
  const out = path.join(OUT_DIR, `icon-${size}.png`);
  await sharp(INPUT).resize(size, size).png().toFile(out);
  console.log(`✓ icon-${size}.png`);
}

// favicon.ico — written as a 32×32 PNG (modern browsers accept this)
await sharp(INPUT).resize(32, 32).png().toFile(FAVICON_OUT);
console.log('✓ favicon.ico');

// AVIF versions for 192 and 512
for (const size of [192, 512]) {
  const out = path.join(OUT_DIR, `icon-${size}.avif`);
  await sharp(INPUT).resize(size, size).avif({ quality: 70 }).toFile(out);
  console.log(`✓ icon-${size}.avif`);
}

// OG share image: 1200×630 with warm background (letterboxed)
const BG = { r: 249, g: 245, b: 240, alpha: 1 };
const imgSize = 630;
const canvasW = 1200;
const padH = Math.floor((canvasW - imgSize) / 2);

for (const [ext, options] of [
  ['png', {}],
  ['avif', { quality: 70 }],
]) {
  const out = path.join(OUT_DIR, `share-1200x630.${ext}`);
  const pipeline = sharp(INPUT)
    .resize(imgSize, imgSize, { fit: 'contain', background: BG })
    .extend({ top: 0, bottom: 0, left: padH, right: canvasW - imgSize - padH, background: BG });

  if (ext === 'avif') {
    await pipeline.avif(options).toFile(out);
  } else {
    await pipeline.png().toFile(out);
  }
  console.log(`✓ share-1200x630.${ext}`);
}

console.log('\nAll icons generated.');
