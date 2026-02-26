import './index.css';
import { runApp } from './app';
import { injectSpeedInsights } from '@vercel/speed-insights';

injectSpeedInsights();

const app = document.getElementById('app');
if (app) {
  app.innerHTML = '<p class="text-lg text-gray-800 p-4">Loading…</p>';
  runApp(app);
}
