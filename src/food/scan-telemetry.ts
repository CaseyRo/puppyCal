import type { FoodEntry } from './types';
import { enqueue, flushQueue, getQueueSize, type ScanPayload } from './scan-queue';

export interface TelemetryResponse {
  isNew: boolean;
  scanCount: number;
}

async function postScan(
  barcode: string,
  foodEntry: FoodEntry,
  rawResponse: Record<string, unknown>
): Promise<TelemetryResponse> {
  const res = await fetch('/api/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ barcode, foodEntry, rawResponse }),
  });

  if (!res.ok) {
    throw new Error(`Telemetry POST failed: ${res.status}`);
  }

  return (await res.json()) as TelemetryResponse;
}

export async function submitScan(
  barcode: string,
  foodEntry: FoodEntry,
  rawResponse: Record<string, unknown>
): Promise<TelemetryResponse | null> {
  try {
    const result = await postScan(barcode, foodEntry, rawResponse);

    // Piggyback flush of queued items on success
    flushQueue(async (payload: ScanPayload) => {
      try {
        await postScan(
          payload.barcode,
          payload.foodEntry,
          payload.rawResponse as Record<string, unknown>
        );
        return true;
      } catch {
        return false;
      }
    }).catch(() => {});

    return result;
  } catch {
    // Silently enqueue for retry
    enqueue(barcode, foodEntry, rawResponse);
    return null;
  }
}

export function flushQueueOnStartup(): void {
  if (getQueueSize() === 0) return;

  flushQueue(async (payload: ScanPayload) => {
    try {
      await postScan(
        payload.barcode,
        payload.foodEntry,
        payload.rawResponse as Record<string, unknown>
      );
      return true;
    } catch {
      return false;
    }
  }).catch(() => {});
}

export { getQueueSize };
