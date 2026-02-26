import './index.css';
import { runApp } from './app';

const app = document.getElementById('app');
if (app) {
  app.innerHTML = '<p class="text-lg text-gray-800 p-4">Loading…</p>';
  runApp(app);
}
