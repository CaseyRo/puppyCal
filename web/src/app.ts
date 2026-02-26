/**
 * App: URL as source of truth, form controlled by config, replaceState on change.
 */

import type { Config } from './config';
import type { I18nData } from './i18n';
import type { ValidationErrors } from './validate';
import { configFromURL, pushConfigToURL } from './config';
import { validate } from './validate';
import { generateICS } from './ics';
import { formatString } from './i18n';

let currentI18n: I18nData | null = null;

function tr(key: string, vars: Record<string, string | number> = {}): string {
  const s = currentI18n?.strings[key];
  return s ? formatString(s, vars) : key;
}

function render(
  app: HTMLElement,
  config: Config,
  i18n: I18nData,
  errors: ValidationErrors,
  feedback: { download?: boolean; copy?: boolean }
) {
  currentI18n = i18n;
  const name = config.name || '';
  const hasError = Object.keys(errors).length > 0;

  app.innerHTML = `
    <div class="min-h-screen flex flex-col items-center justify-start pt-6 pb-12 px-4" style="background: var(--color-surface);">
      <header class="w-full max-w-md mb-6">
        <h1 class="font-display text-2xl md:text-3xl text-gray-800 text-center">${tr('app_title')}</h1>
        ${name ? `<p class="text-center text-gray-600 mt-1 font-body">${tr('walk_summary', { name, mins: '…' }).replace('…', '')} ${name}</p>` : ''}
      </header>

      <main class="w-full max-w-md space-y-4">
        <form id="schedule-form" class="space-y-4" novalidate>
          <div>
            <label for="dob" class="block text-sm font-medium text-gray-700 mb-1">${tr('label_dob')} <span class="text-red-600">*</span></label>
            <input type="date" id="dob" name="dob" value="${config.dob}" required
              class="w-full px-3 py-2 border rounded-lg font-body ${errors.dob ? 'border-red-500 bg-red-50' : 'border-gray-300'}"
              aria-describedby="${errors.dob ? 'dob-err' : ''}" aria-invalid="${!!errors.dob}" />
            ${errors.dob ? `<p id="dob-err" class="mt-1 text-sm text-red-600" role="alert">${tr(errors.dob)}</p>` : ''}
          </div>

          <div>
            <label for="months" class="block text-sm font-medium text-gray-700 mb-1">${tr('label_months')}</label>
            <input type="number" id="months" name="months" min="1" max="3" value="${config.months}"
              class="w-full px-3 py-2 border rounded-lg font-body ${errors.months ? 'border-red-500 bg-red-50' : 'border-gray-300'}"
              aria-describedby="${errors.months ? 'months-err' : 'months-hint'}" aria-invalid="${!!errors.months}" />
            ${errors.months ? `<p id="months-err" class="mt-1 text-sm text-red-600" role="alert">${tr(errors.months)}</p>` : `<p id="months-hint" class="mt-1 text-sm text-gray-500">${tr('max_months_hint')}</p>`}
          </div>

          <div>
            <label for="start" class="block text-sm font-medium text-gray-700 mb-1">${tr('label_start')}</label>
            <input type="date" id="start" name="start" value="${config.start}"
              class="w-full px-3 py-2 border rounded-lg font-body ${errors.start ? 'border-red-500 bg-red-50' : 'border-gray-300'}"
              aria-describedby="${errors.start ? 'start-err' : ''}" aria-invalid="${!!errors.start}" />
            ${errors.start ? `<p id="start-err" class="mt-1 text-sm text-red-600" role="alert">${tr(errors.start)}</p>` : ''}
          </div>

          <div class="flex items-center gap-2">
            <input type="checkbox" id="birthday" name="birthday" ${config.birthday ? 'checked' : ''}
              class="rounded border-gray-300 text-primary focus:ring-primary" />
            <label for="birthday" class="text-sm font-medium text-gray-700">${tr('label_birthday')}</label>
          </div>

          <div>
            <label for="name" class="block text-sm font-medium text-gray-700 mb-1">${tr('label_name')}</label>
            <input type="text" id="name" name="name" value="${config.name}" placeholder=""
              class="w-full px-3 py-2 border border-gray-300 rounded-lg font-body" />
          </div>

          <div>
            <label for="notes" class="block text-sm font-medium text-gray-700 mb-1">${tr('label_notes')}</label>
            <textarea id="notes" name="notes" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg font-body">${config.notes}</textarea>
          </div>

          <div class="border-t border-gray-200 pt-4">
            <div class="flex items-center gap-2 mb-3">
              <input type="checkbox" id="feeding" name="feeding" ${config.feeding ? 'checked' : ''}
                class="rounded border-gray-300 text-primary focus:ring-primary" />
              <label for="feeding" class="text-sm font-medium text-gray-700">${tr('feeding_section_title')}</label>
            </div>
            ${config.feeding ? `
              <div class="space-y-3 pl-6">
                <div>
                  <label for="meals" class="block text-sm font-medium text-gray-700 mb-1">${tr('label_meals')}</label>
                  <input type="number" id="meals" name="meals" min="1" value="${config.meals}"
                    class="w-full px-3 py-2 border rounded-lg font-body ${errors.meals ? 'border-red-500 bg-red-50' : 'border-gray-300'}"
                    aria-describedby="${errors.meals ? 'meals-err' : ''}" aria-invalid="${!!errors.meals}" />
                  ${errors.meals ? `<p id="meals-err" class="mt-1 text-sm text-red-600" role="alert">${tr(errors.meals)}</p>` : ''}
                </div>
                <div>
                  <label for="gramsStart" class="block text-sm font-medium text-gray-700 mb-1">${tr('label_grams_start')}</label>
                  <input type="number" id="gramsStart" name="gramsStart" min="0" step="10" value="${config.gramsStart}"
                    class="w-full px-3 py-2 border rounded-lg font-body ${errors.gramsStart ? 'border-red-500 bg-red-50' : 'border-gray-300'}"
                    aria-describedby="${errors.gramsStart ? 'gramsStart-err' : ''}" aria-invalid="${!!errors.gramsStart}" />
                  ${errors.gramsStart ? `<p id="gramsStart-err" class="mt-1 text-sm text-red-600" role="alert">${tr(errors.gramsStart)}</p>` : ''}
                </div>
                <div>
                  <label for="gramsEnd" class="block text-sm font-medium text-gray-700 mb-1">${tr('label_grams_end')}</label>
                  <input type="number" id="gramsEnd" name="gramsEnd" min="0" step="10" value="${config.gramsEnd}"
                    class="w-full px-3 py-2 border rounded-lg font-body ${errors.gramsEnd ? 'border-red-500 bg-red-50' : 'border-gray-300'}"
                    aria-describedby="${errors.gramsEnd ? 'gramsEnd-err' : ''}" aria-invalid="${!!errors.gramsEnd}" />
                  ${errors.gramsEnd ? `<p id="gramsEnd-err" class="mt-1 text-sm text-red-600" role="alert">${tr(errors.gramsEnd)}</p>` : ''}
                </div>
              </div>
            ` : ''}
          </div>
        </form>

        <div class="flex flex-col gap-3 pt-2">
          <button type="button" id="btn-download" ${hasError ? 'disabled' : ''}
            class="w-full py-3 px-4 rounded-lg font-semibold text-white font-body transition opacity-100"
            style="background: var(--color-primary);"
            ${hasError ? 'aria-disabled="true"' : ''}>
            ${tr('btn_download')}
          </button>
          <button type="button" id="btn-copy" class="w-full py-2 px-4 rounded-lg border border-gray-300 bg-white text-gray-700 font-body hover:bg-gray-50">
            ${tr('btn_copy_link')}
          </button>
          ${feedback.download ? `<p class="text-sm text-green-600 text-center" role="status">${tr('msg_calendar_ready')}</p>` : ''}
          ${feedback.copy ? `<p class="text-sm text-green-600 text-center" role="status">${tr('msg_link_copied')}</p>` : ''}
        </div>

        <div class="flex justify-center gap-2 pt-4">
          <span class="text-sm text-gray-500">Language:</span>
          <a href="?lang=nl${config.dob ? `&dob=${config.dob}` : ''}${config.months !== 3 ? `&months=${config.months}` : ''}${config.start ? `&start=${config.start}` : ''}${!config.birthday ? '&birthday=off' : ''}" id="lang-nl" class="text-sm font-medium ${config.lang === 'nl' ? 'text-primary underline' : 'text-gray-600 hover:text-primary'}">NL</a>
          <span class="text-gray-400">|</span>
          <a href="?lang=en${config.dob ? `&dob=${config.dob}` : ''}${config.months !== 3 ? `&months=${config.months}` : ''}${config.start ? `&start=${config.start}` : ''}${!config.birthday ? '&birthday=off' : ''}" id="lang-en" class="text-sm font-medium ${config.lang === 'en' ? 'text-primary underline' : 'text-gray-600 hover:text-primary'}">EN</a>
        </div>
      </main>
    </div>
  `;
}

function getFormConfig(form: HTMLFormElement, config: Config): Config {
  const get = (name: string) => (form.querySelector(`[name="${name}"]`) as HTMLInputElement | HTMLTextAreaElement)?.value ?? '';
  const getNum = (name: string) => {
    const v = (form.querySelector(`[name="${name}"]`) as HTMLInputElement)?.value;
    const n = parseInt(v, 10);
    return Number.isNaN(n) ? 0 : n;
  };
  const getFloat = (name: string) => {
    const v = (form.querySelector(`[name="${name}"]`) as HTMLInputElement)?.value;
    const n = parseFloat(v);
    return Number.isNaN(n) ? 0 : n;
  };
  const getCheck = (name: string) => (form.querySelector(`[name="${name}"]`) as HTMLInputElement)?.checked ?? false;

  return {
    lang: config.lang,
    dob: get('dob'),
    months: Math.max(1, Math.min(3, getNum('months') || 3)),
    start: get('start'),
    birthday: getCheck('birthday'),
    name: get('name'),
    notes: get('notes'),
    feeding: getCheck('feeding'),
    meals: Math.max(1, getNum('meals') || 3),
    gramsStart: getFloat('gramsStart') >= 0 ? getFloat('gramsStart') : 200,
    gramsEnd: getFloat('gramsEnd') >= 0 ? getFloat('gramsEnd') : 280,
  };
}

const defaultFeedback = () => ({ download: false, copy: false });

export function initApp(
  app: HTMLElement,
  config: Config,
  i18n: I18nData,
  onConfigChange: (next: Config) => void
) {
  const feedbackRef = { current: defaultFeedback() };

  function update(next: Config) {
    pushConfigToURL(next);
    const err = validate(next);
    render(app, next, i18n, err, feedbackRef.current);
    attachListeners(app, next, i18n, update, onConfigChange, feedbackRef, () => { feedbackRef.current = defaultFeedback(); });
  }

  const err = validate(config);
  render(app, config, i18n, err, feedbackRef.current);
  attachListeners(app, config, i18n, update, onConfigChange, feedbackRef, () => { feedbackRef.current = defaultFeedback(); });
}

function attachListeners(
  app: HTMLElement,
  config: Config,
  i18n: I18nData,
  onUpdate: (c: Config) => void,
  onConfigChange: (c: Config) => void,
  feedbackRef: { current: { download: boolean; copy: boolean } },
  clearFeedback: () => void
) {
  const form = app.querySelector('#schedule-form') as HTMLFormElement;
  if (!form) return;

  const applyFormValues = () => {
    const next = getFormConfig(form, config);
    onUpdate(next);
  };

  form.addEventListener('change', () => {
    clearFeedback();
    applyFormValues();
  });
  form.addEventListener('input', () => {
    clearFeedback();
    applyFormValues();
  });

  const btnDownload = app.querySelector('#btn-download') as HTMLButtonElement;
  if (btnDownload) {
    btnDownload.addEventListener('click', () => {
      const c = getFormConfig(form, config);
      const err = validate(c);
      if (Object.keys(err).length > 0) return;
      const ics = generateICS(c, i18n);
      if (!ics) return;
      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'puppy-schedule.ics';
      a.click();
      URL.revokeObjectURL(url);
      feedbackRef.current = { download: true, copy: false };
      render(app, c, i18n, validate(c), feedbackRef.current);
      attachListeners(app, c, i18n, onUpdate, onConfigChange, feedbackRef, clearFeedback);
    });
  }

  const btnCopy = app.querySelector('#btn-copy') as HTMLButtonElement;
  if (btnCopy) {
    btnCopy.addEventListener('click', () => {
      navigator.clipboard.writeText(window.location.href).then(() => {
        feedbackRef.current = { download: false, copy: true };
        const c = getFormConfig(form, config);
        render(app, c, i18n, validate(c), feedbackRef.current);
        attachListeners(app, c, i18n, onUpdate, onConfigChange, feedbackRef, clearFeedback);
      });
    });
  }

  app.querySelectorAll('#lang-nl, #lang-en').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const next = getFormConfig(form, config);
      next.lang = (el as HTMLAnchorElement).id === 'lang-nl' ? 'nl' : 'en';
      onConfigChange(next);
    });
  });
}
