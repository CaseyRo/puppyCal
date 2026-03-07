/**
 * Barcode scanner module — lazy-loaded via dynamic import().
 * Handles camera lifecycle, barcode detection, OFF lookup, safety check,
 * telemetry submission, and result card rendering.
 */
import type { I18nData } from './i18n';
import { tr } from './i18n';
import type { FoodEntry } from './food/types';
import { lookupBarcode, mapOffProductToFoodEntry, sanitizeOffString } from './food/open-food-facts';
import {
  checkIngredientSafety,
  type SafetyResult,
  type SafetyVerdict,
} from './food/toxic-ingredients';
import { submitScan, getQueueSize, type TelemetryResponse } from './food/scan-telemetry';
import { saveScannedFood } from './food/scan-storage';

const SCAN_TIMEOUT_MS = 60_000;

interface ScannerState {
  scanner: unknown; // Html5Qrcode instance
  locked: boolean;
  timeoutId: ReturnType<typeof setTimeout> | null;
  visibilityHandler: (() => void) | null;
  popstateHandler: (() => void) | null;
}

let state: ScannerState | null = null;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function verdictColor(verdict: SafetyVerdict): { bg: string; text: string; border: string } {
  switch (verdict) {
    case 'danger':
      return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
    case 'warning':
    case 'incomplete':
      return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
    case 'data-unavailable':
      return { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' };
    default:
      return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' };
  }
}

function verdictIcon(verdict: SafetyVerdict): string {
  switch (verdict) {
    case 'danger':
      return '<svg class="w-6 h-6 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
    case 'warning':
    case 'incomplete':
      return '<svg class="w-6 h-6 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
    case 'data-unavailable':
      return '<svg class="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
    default:
      return '<svg class="w-6 h-6 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
  }
}

function verdictLabel(
  verdict: SafetyVerdict,
  t: (key: string, params?: Record<string, string | number>) => string
): string {
  switch (verdict) {
    case 'danger':
      return t('scan_verdict_danger');
    case 'warning':
      return t('scan_verdict_warning');
    case 'incomplete':
      return t('scan_verdict_incomplete');
    case 'data-unavailable':
      return t('scan_verdict_unavailable');
    default:
      return t('scan_verdict_safe');
  }
}

function renderSafetyVerdict(
  safety: SafetyResult,
  rawIngredientsText: string,
  parsedIngredients: string[],
  t: (key: string, params?: Record<string, string | number>) => string
): string {
  const colors = verdictColor(safety.verdict);
  const icon = verdictIcon(safety.verdict);
  const label = verdictLabel(safety.verdict, t);

  const matchesHtml =
    safety.matches.length > 0
      ? `<div class="mt-3 space-y-1">
        ${safety.matches
          .map((m) => {
            const sevColor =
              m.matched.severity === 'danger'
                ? 'text-red-600'
                : m.matched.severity === 'warning'
                  ? 'text-amber-600'
                  : 'text-gray-500';
            return `<div class="flex items-start gap-2 text-xs">
              <span class="font-medium ${sevColor}">${escapeHtml(m.matched.name)}</span>
              <span class="text-gray-500">${escapeHtml(m.matched.context)}</span>
            </div>`;
          })
          .join('')}
      </div>`
      : '';

  const ingredientsSection =
    parsedIngredients.length > 0
      ? `<details class="mt-3">
          <summary class="text-xs font-medium text-gray-500 cursor-pointer select-none hover:text-gray-700">${t('scan_ingredients_label')}</summary>
          <div class="mt-2 space-y-2">
            <p class="text-xs text-gray-500 italic">${escapeHtml(rawIngredientsText)}</p>
            <div class="flex flex-wrap gap-1">
              ${parsedIngredients
                .map((ing) => {
                  const isFlagged = safety.matches.some((m) => m.ingredient === ing);
                  const cls = isFlagged
                    ? 'bg-red-100 text-red-700 border-red-200'
                    : 'bg-gray-100 text-gray-600 border-gray-200';
                  return `<span class="text-[10px] px-1.5 py-0.5 rounded border ${cls}">${escapeHtml(ing)}</span>`;
                })
                .join('')}
            </div>
          </div>
        </details>`
      : '';

  return `
    <div class="rounded-xl ${colors.bg} border ${colors.border} p-4">
      <div class="flex items-center gap-3">
        ${icon}
        <span class="text-sm font-semibold ${colors.text}">${label}</span>
      </div>
      ${matchesHtml}
      ${ingredientsSection}
    </div>`;
}

function renderResultCard(
  entry: FoodEntry,
  safety: SafetyResult,
  rawIngredientsText: string,
  parsedIngredients: string[],
  telemetry: TelemetryResponse | null,
  t: (key: string, params?: Record<string, string | number>) => string
): string {
  const queueSize = getQueueSize();
  const queueNote =
    queueSize > 0
      ? `<p class="text-xs text-gray-400 mt-2 italic">${t('scan_queue_pending')}</p>`
      : '';

  const verdictHtml = renderSafetyVerdict(safety, rawIngredientsText, parsedIngredients, t);

  // Determine animation class
  let animClass = '';
  if (telemetry === null) {
    animClass = 'scan-anim-pulse';
  } else if (telemetry.isNew && safety.verdict !== 'danger') {
    animClass = 'scan-anim-celebrate';
  } else {
    animClass = 'scan-anim-pulse';
  }

  const newBadge =
    telemetry?.isNew && safety.verdict !== 'danger'
      ? `<span class="inline-block px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium">${t('scan_new_food')}</span>`
      : telemetry && !telemetry.isNew
        ? `<span class="inline-block px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-medium">${t('scan_known_food')}</span>`
        : '';

  return `
    <div class="p-4 space-y-4 animate-scale-in">
      <div class="text-center">
        <div id="scan-anim-target" class="${animClass} inline-block">
          <img src="/icons/icon-original.png" alt="" class="h-16 w-auto mx-auto" width="64" height="69" />
        </div>
        ${newBadge}
      </div>

      <div class="text-center">
        <h3 class="text-lg font-semibold text-gray-900">${escapeHtml(entry.productName)}</h3>
        <p class="text-sm text-gray-500">${escapeHtml(entry.brand)}</p>
        <p class="text-xs text-gray-400 mt-1">${t('scan_scanned_on', { date: entry.sourceDate })}</p>
      </div>

      ${verdictHtml}

      <p class="text-[10px] text-gray-400 text-center">${t('scan_disclaimer')}</p>

      ${queueNote}

      <div class="flex flex-col gap-2">
        <button type="button" id="scan-btn-save"
          class="w-full py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors">
          ${t('scan_add_to_foods')}
        </button>
        <div class="flex gap-2">
          <button type="button" id="scan-btn-another"
            class="flex-1 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            ${t('scan_another')}
          </button>
          <button type="button" id="scan-btn-dismiss"
            class="flex-1 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            ${t('scan_dismiss')}
          </button>
        </div>
      </div>
    </div>`;
}

function renderNotFound(
  barcode: string,
  t: (key: string, params?: Record<string, string | number>) => string
): string {
  return `
    <div class="p-6 text-center space-y-4 animate-scale-in">
      <div class="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
        <svg class="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
      </div>
      <h3 class="text-lg font-semibold text-gray-900">${t('scan_not_found_title')}</h3>
      <p class="text-sm text-gray-500">${t('scan_not_found_desc')}</p>
      <a href="https://world.openfoodfacts.org/cgi/product.pl?code=${barcode}" target="_blank" rel="noreferrer"
        class="inline-block text-xs text-primary underline hover:opacity-80">${t('scan_contribute_off')}</a>
      <div class="flex gap-2 mt-2">
        <button type="button" id="scan-btn-another"
          class="flex-1 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors">
          ${t('scan_another')}
        </button>
        <button type="button" id="scan-btn-dismiss"
          class="flex-1 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
          ${t('scan_dismiss')}
        </button>
      </div>
    </div>`;
}

function renderError(t: (key: string, params?: Record<string, string | number>) => string): string {
  return `
    <div class="p-6 text-center space-y-4 animate-scale-in">
      <div class="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
        <svg class="w-6 h-6 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
      </div>
      <h3 class="text-lg font-semibold text-gray-900">${t('scan_error_title')}</h3>
      <p class="text-sm text-gray-500">${t('scan_error_desc')}</p>
      <div class="flex gap-2">
        <button type="button" id="scan-btn-retry"
          class="flex-1 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors">
          ${t('scan_retry')}
        </button>
        <button type="button" id="scan-btn-dismiss"
          class="flex-1 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
          ${t('scan_dismiss')}
        </button>
      </div>
    </div>`;
}

function renderTimeout(
  t: (key: string, params?: Record<string, string | number>) => string
): string {
  return `
    <div class="p-6 text-center space-y-4">
      <p class="text-sm text-gray-500">${t('scan_timeout')}</p>
      <button type="button" id="scan-btn-retry"
        class="py-2 px-6 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors">
        ${t('scan_retry')}
      </button>
    </div>`;
}

function renderPermissionDenied(
  t: (key: string, params?: Record<string, string | number>) => string
): string {
  return `
    <div class="p-6 text-center space-y-4">
      <div class="mx-auto w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
        <svg class="w-6 h-6 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
      </div>
      <h3 class="text-lg font-semibold text-gray-900">${t('scan_permission_denied_title')}</h3>
      <p class="text-sm text-gray-500">${t('scan_permission_denied_desc')}</p>
      <button type="button" id="scan-btn-dismiss"
        class="py-2 px-6 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
        ${t('scan_dismiss')}
      </button>
    </div>`;
}

function renderLoadError(
  t: (key: string, params?: Record<string, string | number>) => string
): string {
  return `
    <div class="p-6 text-center space-y-4">
      <p class="text-sm text-gray-500">${t('scan_load_error')}</p>
      <button type="button" id="scan-btn-retry-load"
        class="py-2 px-6 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors">
        ${t('scan_retry')}
      </button>
    </div>`;
}

async function stopScanner(): Promise<void> {
  if (!state) return;

  if (state.timeoutId) {
    clearTimeout(state.timeoutId);
    state.timeoutId = null;
  }

  if (state.visibilityHandler) {
    document.removeEventListener('visibilitychange', state.visibilityHandler);
    state.visibilityHandler = null;
  }

  if (state.popstateHandler) {
    window.removeEventListener('popstate', state.popstateHandler);
    state.popstateHandler = null;
  }

  try {
    const scanner = state.scanner as { stop?: () => Promise<void>; clear?: () => void };
    if (scanner.stop) await scanner.stop();
    if (scanner.clear) scanner.clear();
  } catch {
    // Scanner may already be stopped
  }

  state = null;
}

function closeModal(): void {
  const modal = document.getElementById('scanner-modal');
  if (modal) {
    void stopScanner();
    modal.remove();
  }
  // Remove history entry if we pushed one
  if (window.history.state === 'scanner-open') {
    window.history.back();
  }
}

function showContent(contentHtml: string, i18nData: I18nData, onRerender: () => void): void {
  const contentEl = document.getElementById('scanner-content');
  if (!contentEl) return;
  contentEl.innerHTML = contentHtml;

  // Wire up buttons
  contentEl.querySelector('#scan-btn-save')?.addEventListener('click', () => {
    const entryJson = contentEl.getAttribute('data-entry');
    if (entryJson) {
      try {
        const entry = JSON.parse(entryJson) as FoodEntry;
        saveScannedFood(entry);
      } catch {
        /* ignore */
      }
    }
    closeModal();
    onRerender();
  });

  contentEl.querySelector('#scan-btn-another')?.addEventListener('click', () => {
    void startScanning(i18nData, onRerender);
  });

  contentEl.querySelector('#scan-btn-dismiss')?.addEventListener('click', () => {
    closeModal();
  });

  contentEl.querySelector('#scan-btn-retry')?.addEventListener('click', () => {
    void startScanning(i18nData, onRerender);
  });

  contentEl.querySelector('#scan-btn-retry-load')?.addEventListener('click', () => {
    void openScannerModal(i18nData, onRerender);
  });
}

async function handleBarcodeDetected(
  barcode: string,
  i18nData: I18nData,
  onRerender: () => void
): Promise<void> {
  const t = (key: string, params?: Record<string, string | number>) => tr(i18nData, key, params);
  const contentEl = document.getElementById('scanner-content');
  if (!contentEl) return;

  // Show loading
  contentEl.innerHTML = `
    <div class="p-6 text-center">
      <div class="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto"></div>
      <p class="text-sm text-gray-500 mt-3">${t('scan_looking_up')}</p>
    </div>`;

  try {
    const result = await lookupBarcode(barcode);

    if (!result.found || !result.product) {
      showContent(renderNotFound(barcode, t), i18nData, onRerender);
      return;
    }

    const entry = mapOffProductToFoodEntry(result.product, barcode);
    const rawIngredientsText = sanitizeOffString(result.product.ingredients_text, 5000);
    const safety = checkIngredientSafety(entry.ingredients);

    // Submit telemetry (non-blocking)
    const telemetryPromise = submitScan(barcode, entry, {
      product_name: sanitizeOffString(result.product.product_name, 500),
      brands: sanitizeOffString(result.product.brands, 200),
      ingredients_text: rawIngredientsText,
      nutriments: result.product.nutriments ?? {},
    });

    // Render verdict immediately
    const telemetry = await telemetryPromise;

    const html = renderResultCard(
      entry,
      safety,
      rawIngredientsText,
      entry.ingredients,
      telemetry,
      t
    );
    contentEl.setAttribute('data-entry', JSON.stringify(entry));
    showContent(html, i18nData, onRerender);

    // Trigger animation with delay (verdict-first sequencing)
    setTimeout(() => {
      const animTarget = document.getElementById('scan-anim-target');
      if (animTarget) {
        animTarget.classList.add('scan-anim-active');
      }
    }, 1500);
  } catch {
    showContent(renderError(t), i18nData, onRerender);
  }
}

async function startScanning(i18nData: I18nData, onRerender: () => void): Promise<void> {
  const t = (key: string, params?: Record<string, string | number>) => tr(i18nData, key, params);
  const contentEl = document.getElementById('scanner-content');
  if (!contentEl) return;

  await stopScanner();

  contentEl.innerHTML = `
    <div id="scanner-viewfinder" class="w-full aspect-[4/3] bg-black rounded-lg overflow-hidden"></div>
    <p class="text-xs text-gray-400 text-center mt-2">${t('scan_point_camera')}</p>`;

  try {
    const { Html5Qrcode } = await import('html5-qrcode');
    const scanner = new Html5Qrcode('scanner-viewfinder');

    state = {
      scanner,
      locked: false,
      timeoutId: null,
      visibilityHandler: null,
      popstateHandler: null,
    };

    // Visibility change handler
    state.visibilityHandler = () => {
      if (document.hidden) {
        void stopScanner();
        if (contentEl) {
          contentEl.innerHTML = `
            <div class="p-6 text-center space-y-4">
              <p class="text-sm text-gray-500">${t('scan_paused')}</p>
              <button type="button" id="scan-btn-retry"
                class="py-2 px-6 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors">
                ${t('scan_resume')}
              </button>
            </div>`;
          showContent(contentEl.innerHTML, i18nData, onRerender);
        }
      }
    };
    document.addEventListener('visibilitychange', state.visibilityHandler);

    // Timeout
    state.timeoutId = setTimeout(() => {
      void stopScanner();
      showContent(renderTimeout(t), i18nData, onRerender);
    }, SCAN_TIMEOUT_MS);

    await scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 150 } },
      async (decodedText: string) => {
        if (state?.locked) return;
        if (state) state.locked = true;

        try {
          await scanner.stop();
        } catch {
          /* may already be stopped */
        }

        await handleBarcodeDetected(decodedText, i18nData, onRerender);
      },
      () => {
        // QR code not found in frame — normal, ignore
      }
    );
  } catch (err) {
    const error = err as Error;
    if (error.name === 'NotAllowedError' || error.message?.includes('Permission')) {
      showContent(renderPermissionDenied(t), i18nData, onRerender);
    } else {
      showContent(renderLoadError(t), i18nData, onRerender);
    }
  }
}

export async function openScannerModal(i18nData: I18nData, onRerender: () => void): Promise<void> {
  const t = (key: string, params?: Record<string, string | number>) => tr(i18nData, key, params);

  // Remove existing modal
  document.getElementById('scanner-modal')?.remove();

  const modal = document.createElement('div');
  modal.id = 'scanner-modal';
  modal.className = 'fixed inset-0 z-[999] bg-white flex flex-col';
  modal.innerHTML = `
    <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200">
      <h2 class="text-sm font-semibold text-gray-900">${t('scan_title')}</h2>
      <button type="button" id="scanner-close"
        class="p-1 rounded-full hover:bg-gray-100 transition-colors" aria-label="${t('scan_dismiss')}">
        <svg class="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div id="scanner-content" class="flex-1 overflow-y-auto">
      <div class="p-6 text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto"></div>
        <p class="text-sm text-gray-500 mt-3">${t('scan_loading')}</p>
      </div>
    </div>`;

  document.body.appendChild(modal);

  // Push history state for back button handling
  window.history.pushState('scanner-open', '', '');
  const popstateHandler = () => {
    if (document.getElementById('scanner-modal')) {
      closeModal();
    }
  };
  window.addEventListener('popstate', popstateHandler);

  // Close button
  modal.querySelector('#scanner-close')?.addEventListener('click', closeModal);

  // Start scanning
  await startScanning(i18nData, onRerender);
}
