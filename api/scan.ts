import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

export const config = {
  api: { bodyParser: { sizeLimit: '50kb' } },
};

const BARCODE_RE = /^\d{8,14}$/;

// Lazy-init Redis and Ratelimit (only when env vars exist)
let redis: Redis | null = null;
let ratelimit: Ratelimit | null = null;

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return redis;
}

function getRatelimit(): Ratelimit {
  if (!ratelimit) {
    ratelimit = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(10, '1 h'),
    });
  }
  return ratelimit;
}

function sanitizeString(value: unknown, maxLen: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLen);
}

function whitelistRawResponse(raw: unknown): Record<string, unknown> {
  if (typeof raw !== 'object' || raw === null) return {};
  const r = raw as Record<string, unknown>;
  return {
    product_name: sanitizeString(r.product_name, 500),
    brands: sanitizeString(r.brands, 200),
    ingredients_text: sanitizeString(r.ingredients_text, 5000),
    nutriments: typeof r.nutriments === 'object' && r.nutriments !== null ? r.nutriments : {},
  };
}

function validateBarcode(barcode: unknown): barcode is string {
  return typeof barcode === 'string' && BARCODE_RE.test(barcode);
}

function validateFoodEntry(entry: unknown): boolean {
  if (typeof entry !== 'object' || entry === null) return false;
  const e = entry as Record<string, unknown>;
  return (
    typeof e.id === 'string' &&
    typeof e.brand === 'string' &&
    typeof e.productName === 'string' &&
    typeof e.sourceUrl === 'string' &&
    typeof e.sourceDate === 'string'
  );
}

function getAllowedOrigin(req: VercelRequest): string | null {
  const origin = req.headers.origin;
  if (!origin) return null;

  // Allow the production domain and Vercel preview deployments
  if (
    origin === process.env.ALLOWED_ORIGIN ||
    (typeof origin === 'string' && origin.endsWith('.vercel.app'))
  ) {
    return origin;
  }

  // Allow localhost in development
  if (typeof origin === 'string' && origin.startsWith('http://localhost')) {
    return origin;
  }

  return null;
}

function setCorsHeaders(req: VercelRequest, res: VercelResponse): boolean {
  const allowed = getAllowedOrigin(req);
  if (allowed) {
    res.setHeader('Access-Control-Allow-Origin', allowed);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Vary', 'Origin');
  }

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}

interface StoredScan {
  foodEntry: Record<string, unknown>;
  rawResponse: Record<string, unknown>;
  firstSeenAt: string;
  scanCount: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    // CORS
    if (setCorsHeaders(req, res)) return;

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    // Rate limiting
    const ip = String(req.headers['x-forwarded-for'] ?? req.headers['x-real-ip'] ?? 'anonymous')
      .split(',')[0]
      .trim();

    try {
      const { success } = await getRatelimit().limit(ip);
      if (!success) {
        res.status(429).json({ error: 'Too many requests' });
        return;
      }
    } catch (err) {
      console.error('[api/scan] rate limit error:', err);
      // Continue if rate limiting fails (Redis down) — don't block legitimate users
    }

    const body = req.body as Record<string, unknown>;

    // Validate barcode
    if (!validateBarcode(body.barcode)) {
      res.status(400).json({ error: 'Invalid barcode' });
      return;
    }

    // Validate foodEntry
    if (!validateFoodEntry(body.foodEntry)) {
      res.status(400).json({ error: 'Invalid food entry' });
      return;
    }

    const barcode = body.barcode;
    const safeRaw = whitelistRawResponse(body.rawResponse);
    const kvKey = `scan:${barcode}`;

    const r = getRedis();
    const existing = await r.get<StoredScan>(kvKey);

    if (existing) {
      const updated = { ...existing, scanCount: existing.scanCount + 1 };
      await r.set(kvKey, updated);
      res.status(200).json({ isNew: false, scanCount: updated.scanCount });
      return;
    }

    // New entry
    const entry: StoredScan = {
      foodEntry: body.foodEntry as Record<string, unknown>,
      rawResponse: safeRaw,
      firstSeenAt: new Date().toISOString(),
      scanCount: 1,
    };
    await r.set(kvKey, entry);

    // Slack notification (fire-and-forget)
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (webhookUrl) {
      const fe = body.foodEntry as Record<string, unknown>;
      const productName = sanitizeString(fe.productName, 200);
      const brand = sanitizeString(fe.brand, 200);
      const offUrl = `https://world.openfoodfacts.org/product/${barcode}`;

      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🐾 New food scanned!\n*${productName}* by ${brand}\nBarcode: ${barcode}\n<${offUrl}|View on Open Food Facts>`,
        }),
      }).catch((err) => {
        console.error('[api/scan] Slack webhook error:', err);
      });
    }

    res.status(200).json({ isNew: true, scanCount: 1 });
  } catch (err) {
    console.error('[api/scan] error:', err);
    res.status(500).json({ error: 'Submission failed' });
  }
}
