import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(__dirname, '..');
const INDEX_HTML_PATH = path.join(ROOT, 'src', 'index.html');
const PUBLIC_DIR = path.join(ROOT, 'public');

function getLocalAssetPathsFromIndexHtml(): string[] {
  const html = readFileSync(INDEX_HTML_PATH, 'utf8');
  const paths = new Set<string>();

  const addMatches = (regex: RegExp, attr: string) => {
    for (const match of html.matchAll(regex)) {
      const value = match.groups?.[attr];
      if (!value) continue;
      if (!value.startsWith('/')) continue;
      // Ignore external/network paths; we only validate local static assets.
      if (value.startsWith('//')) continue;
      paths.add(value);
    }
  };

  addMatches(/<meta[^>]+property="og:image"[^>]+content="(?<content>[^"]+)"/g, 'content');
  addMatches(/<meta[^>]+name="twitter:image"[^>]+content="(?<content>[^"]+)"/g, 'content');
  addMatches(/<link[^>]+rel="icon"[^>]+href="(?<href>[^"]+)"/g, 'href');
  addMatches(/<link[^>]+rel="apple-touch-icon"[^>]+href="(?<href>[^"]+)"/g, 'href');
  addMatches(/<link[^>]+rel="manifest"[^>]+href="(?<href>[^"]+)"/g, 'href');

  return [...paths];
}

describe('static asset references', () => {
  it('keeps local icon/share image references in index.html resolvable', () => {
    const assetPaths = getLocalAssetPathsFromIndexHtml();
    expect(assetPaths.length).toBeGreaterThan(0);

    const missing = assetPaths.filter(
      (assetPath) => !existsSync(path.join(PUBLIC_DIR, assetPath.slice(1)))
    );
    expect(missing).toEqual([]);
  });
});
