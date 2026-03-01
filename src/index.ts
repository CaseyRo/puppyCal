import './index.css';
import { runApp } from './app';
import { inject } from '@vercel/analytics';
import { injectSpeedInsights } from '@vercel/speed-insights';

inject();
injectSpeedInsights();

if ('serviceWorker' in navigator) {
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
