import { renderFooter } from './footer/src/vanilla';
import { footerConfig } from './footer.config';

document.addEventListener('DOMContentLoaded', () => {
  const el = document.getElementById('cyb-footer');
  if (el) renderFooter(el, footerConfig);
});
