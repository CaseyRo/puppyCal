import { describe, expect, it, beforeEach, vi } from 'vitest';
import { enqueue, flushQueue, getQueueSize } from './scan-queue';
import type { FoodEntry } from './types';

const store: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => {
    store[key] = value;
  },
  removeItem: (key: string) => {
    delete store[key];
  },
  clear: () => {
    for (const key of Object.keys(store)) delete store[key];
  },
  get length() {
    return Object.keys(store).length;
  },
  key: (_i: number) => null,
};

vi.stubGlobal('localStorage', mockLocalStorage);

const mockEntry: FoodEntry = {
  id: 'scan-1234567890123',
  supplier: 'Test',
  brand: 'Test Brand',
  productName: 'Test Product',
  isPuppy: false,
  lifeStage: '',
  breedSizeTarget: '',
  foodType: 'dry',
  packageSize: '',
  ingredients: ['chicken', 'rice', 'corn'],
  guaranteedAnalysis: {
    proteinMinPercent: 25,
    fatMinPercent: 15,
    fiberMaxPercent: 3,
    moistureMaxPercent: 12,
  },
  feedingGuide: { reference: '' },
  sourceUrl: 'https://world.openfoodfacts.org/product/1234567890123',
  sourceDate: '2026-03-07',
  source: 'scan',
};

describe('scan-queue', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  it('starts with empty queue', () => {
    expect(getQueueSize()).toBe(0);
  });

  it('enqueues and reads back', () => {
    enqueue('1234567890123', mockEntry, { product_name: 'Test' });
    expect(getQueueSize()).toBe(1);
  });

  it('enforces size limit of 50', () => {
    for (let i = 0; i < 60; i++) {
      const barcode = String(10000000000000 + i);
      enqueue(barcode, mockEntry, {});
    }
    expect(getQueueSize()).toBe(50);
  });

  it('flushes successfully submitted items', async () => {
    enqueue('1234567890123', mockEntry, {});
    enqueue('1234567890124', mockEntry, {});

    const flushed = await flushQueue(async () => true);
    expect(flushed).toBe(2);
    expect(getQueueSize()).toBe(0);
  });

  it('keeps failed items in queue', async () => {
    enqueue('1234567890123', mockEntry, {});
    enqueue('1234567890124', mockEntry, {});

    const flushed = await flushQueue(async () => false);
    expect(flushed).toBe(0);
    expect(getQueueSize()).toBe(2);
  });

  it('discards expired items during flush', async () => {
    const oldItem = {
      barcode: '1234567890123',
      foodEntry: mockEntry,
      rawResponse: {},
      queuedAt: Date.now() - 8 * 24 * 60 * 60 * 1000,
    };
    mockLocalStorage.setItem('puppycal_scan_queue', JSON.stringify([oldItem]));

    const flushed = await flushQueue(async () => true);
    expect(flushed).toBe(0);
    expect(getQueueSize()).toBe(0);
  });

  it('discards items with invalid barcode format', () => {
    const items = [
      { barcode: 'not-a-barcode', foodEntry: mockEntry, rawResponse: {}, queuedAt: Date.now() },
      { barcode: '../../admin', foodEntry: mockEntry, rawResponse: {}, queuedAt: Date.now() },
    ];
    mockLocalStorage.setItem('puppycal_scan_queue', JSON.stringify(items));
    expect(getQueueSize()).toBe(0);
  });

  it('discards items with null foodEntry', () => {
    const items = [
      { barcode: '1234567890123', foodEntry: null, rawResponse: {}, queuedAt: Date.now() },
    ];
    mockLocalStorage.setItem('puppycal_scan_queue', JSON.stringify(items));
    expect(getQueueSize()).toBe(0);
  });

  it('handles corrupted localStorage gracefully', () => {
    mockLocalStorage.setItem('puppycal_scan_queue', 'not json');
    expect(getQueueSize()).toBe(0);
  });
});
