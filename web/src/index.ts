import './main.css';
import { configFromURL, pushConfigToURL } from './config';
import { loadI18n } from './i18n';
import { initApp } from './app';

(async () => {
  const appEl = document.getElementById('app');
  if (!appEl) throw new Error('#app not found');
  const app = appEl;

  let currentConfig = configFromURL(new URL(window.location.href));
  let currentI18n = await loadI18n(currentConfig.lang);
  let currentLang = currentConfig.lang;

  function onConfigChange(next: typeof currentConfig) {
    currentConfig = next;
    pushConfigToURL(next);
    if (next.lang !== currentLang) {
      currentLang = next.lang;
      loadI18n(next.lang).then((i18n) => {
        currentI18n = i18n;
        initApp(app, currentConfig, i18n, onConfigChange);
      });
    } else {
      initApp(app, currentConfig, currentI18n!, onConfigChange);
    }
  }

  initApp(app, currentConfig, currentI18n, onConfigChange);
})();
