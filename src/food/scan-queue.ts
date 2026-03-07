import type { FoodEntry } from './types';

const QUEUE_KEY = 'puppycal_scan_queue';
const MAX_QUEUE_SIZE = 50;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const BARCODE_RE = /^\d{8,14}$/;

export interface ScanPayload {
  barcode: string;
  foodEntry: FoodEntry;
  rawResponse: Record<string, unknown>;
  queuedAt: number;
}

function isValidPayload(item: unknown): item is ScanPayload {
  if (typeof item !== 'object' || item === null) return false;
  const p = item as Record<string, unknown>;
  return (
    BARCODE_RE.test(String(p.barcode ?? '')) &&
    typeof p.foodEntry === 'object' &&
    p.foodEntry !== null &&
    typeof p.queuedAt === 'number'
  );
}

function loadQueue(): ScanPayload[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidPayload);
  } catch {
    return [];
  }
}

function saveQueue(queue: ScanPayload[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function enqueue(
  barcode: string,
  foodEntry: FoodEntry,
  rawResponse: Record<string, unknown>
): void {
  const queue = loadQueue();
  queue.push({ barcode, foodEntry, rawResponse, queuedAt: Date.now() });

  // Enforce size limit — drop oldest
  while (queue.length > MAX_QUEUE_SIZE) {
    queue.shift();
  }

  saveQueue(queue);
}

export function getQueueSize(): number {
  return loadQueue().length;
}

export async function flushQueue(
  submitFn: (payload: ScanPayload) => Promise<boolean>
): Promise<number> {
  const queue = loadQueue();
  if (queue.length === 0) return 0;

  const now = Date.now();
  const remaining: ScanPayload[] = [];
  let flushed = 0;

  for (const item of queue) {
    // Drop expired items
    if (now - item.queuedAt > MAX_AGE_MS) continue;

    // Validate before replay
    if (!isValidPayload(item)) continue;

    try {
      const success = await submitFn(item);
      if (success) {
        flushed++;
      } else {
        remaining.push(item);
      }
    } catch {
      remaining.push(item);
    }
  }

  saveQueue(remaining);
  return flushed;
}
