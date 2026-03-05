import './index.css';
import './footer';
import { runApp } from './app';
import { inject } from '@vercel/analytics';
import { injectSpeedInsights } from '@vercel/speed-insights';

inject();
injectSpeedInsights();

if ('serviceWorker' in navigator) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // SW registration failure is non-fatal — app works without it
    });
  });
}

const app = document.getElementById('app');
if (app) {
  app.innerHTML = '<p class="text-lg text-gray-800 p-4">Loading…</p>';
  void runApp(app);
}
