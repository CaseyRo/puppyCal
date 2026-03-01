/**
 * CDIT Network Footer — HTML Template
 *
 * Pure function that returns a complete footer HTML string.
 * No side effects, no browser globals, no Astro APIs, no Node globals.
 * All config string values are passed through escapeHtml() before interpolation.
 *
 * Reference: openspec/changes/cyb-footer-vanilla-js-port/specs/footer-core/spec.md
 */

import type { FooterConfig } from './config';
import type { ResolvedFooterOptions } from './i18n';
import { buildLanguageUrl, resolveDefaultTexts } from './i18n';

// ── HTML escaping ─────────────────────────────────────────────────────────────

/**
 * Escapes HTML special characters so config values can be safely interpolated
 * into HTML text nodes and attribute values.
 *
 * Replaces: & < > " '
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── SVG icon constants ────────────────────────────────────────────────────────

const SOCIAL_ICONS: Record<string, string> = {
  rss: `<svg class="cdit-footer__icon-svg" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor"><path d="M0 64C0 46.3 14.3 32 32 32c229.8 0 416 186.2 416 416c0 17.7-14.3 32-32 32s-32-14.3-32-32C384 253.6 226.4 96 32 96C14.3 96 0 81.7 0 64zM0 416a64 64 0 1 1 128 0A64 64 0 1 1 0 416zM32 160c159.1 0 288 128.9 288 288c0 17.7-14.3 32-32 32s-32-14.3-32-32c0-123.7-100.3-224-224-224c-17.7 0-32-14.3-32-32s14.3-32 32-32z"/></svg>`,
  linkedin: `<svg class="cdit-footer__icon-svg" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor"><path d="M100.3 448H7.4V148.9h92.9zM53.8 108.1C24.1 108.1 0 83.5 0 53.8a53.8 53.8 0 0 1 107.6 0c0 29.7-24.1 54.3-53.8 54.3zM447.9 448h-92.7V302.4c0-34.7-.7-79.2-48.3-79.2-48.3 0-55.7 37.7-55.7 76.7V448h-92.8V148.9h89.1v40.8h1.3c12.4-23.5 42.7-48.3 87.9-48.3 94 0 111.3 61.9 111.3 142.3V448z"/></svg>`,
  github: `<svg class="cdit-footer__icon-svg" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512" fill="currentColor"><path d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3 .3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5 .3-6.2 2.3zm44.2-1.7c-2.9 .7-4.9 2.6-4.6 4.9 .3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3 .7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3 .3 2.9 2.3 3.9 1.6 1 3.6 .7 4.3-.7 .7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3 .7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3 .7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"/></svg>`,
  instagram: `<svg class="cdit-footer__icon-svg" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor"><path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"/></svg>`,
  whatsapp: `<svg class="cdit-footer__icon-svg" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5.1-3.9-10.6-6.9z"/></svg>`,
  x: `<svg class="cdit-footer__icon-svg" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor"><path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"/></svg>`,
  facebook: `<svg class="cdit-footer__icon-svg" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" fill="currentColor"><path d="M80 299.3V512H196V299.3h86.5l18-97.8H196V166.9c0-51.7 20.3-71.5 72.7-71.5c16.3 0 29.4 .4 37 1.2V7.9C291.4 4 256.4 0 236.2 0C129.3 0 80 50.5 80 159.4v42.1H14v97.8H80z"/></svg>`,
  youtube: `<svg class="cdit-footer__icon-svg" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" fill="currentColor"><path d="M549.7 124.1c-6.3-23.7-24.8-42.3-48.3-48.6C458.8 64 288 64 288 64S117.2 64 74.6 75.5c-23.5 6.3-42 24.9-48.3 48.6-11.4 42.9-11.4 132.3-11.4 132.3s0 89.4 11.4 132.3c6.3 23.7 24.8 41.5 48.3 47.8C117.2 448 288 448 288 448s170.8 0 213.4-11.5c23.5-6.3 42-24.2 48.3-47.8 11.4-42.9 11.4-132.3 11.4-132.3s0-89.4-11.4-132.3zm-317.5 213.5V175.2l142.7 81.2-142.7 81.2z"/></svg>`,
  buymeacoffee: `<svg class="cdit-footer__icon-svg" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 884 1279" fill="currentColor"><path d="M791.109 297.518L790.231 297.002L788.201 296.383C789.018 296.072 790.04 295.967 791.109 297.518Z"/><path d="M803.896 388.891L802.916 389.166L803.896 388.891Z"/><path d="M791.484 297.377C791.359 297.361 791.232 297.344 791.109 297.518L788.201 296.383C788.201 296.383 786.599 296.392 787.33 298.294C787.33 298.294 794.347 255.454 834.283 276.616C834.283 276.616 842.21 283.006 852.358 293.71L851.574 294.052C851.574 294.052 855.726 294.07 855.956 296.543L855.698 296.456C855.698 296.456 856.924 295.756 857.426 294.059C857.426 294.059 862.481 287.604 870.012 292.421C870.012 292.421 876.956 299.302 883.515 315.916L884 316.449H883.723L883.515 316.916C883.515 316.916 883.301 313.174 879.452 310.547C879.452 310.547 880.038 313.617 879.691 315.069C879.691 315.069 876.793 305.303 869.695 304.903L876.19 316.186C876.19 316.186 870.955 310.688 859.906 313.304L872.271 321.023C872.271 321.023 858.354 315.071 844.208 329.458L830.384 337.789C830.384 337.789 817.94 344.52 820.516 360.886L834.283 352.886L817.535 372.189C817.535 372.189 812.148 375.667 807.863 388.303L803.896 388.891C803.896 388.891 800.297 384.744 793.089 383.088L791.484 297.377Z"/><path d="M1.21721 595.658C-3.1814 621.658 8.26355 648.118 30.7342 663.852L266.032 829.698C278.303 838.343 293.076 842.897 307.847 842.897C310.12 842.897 312.393 842.765 314.666 842.501C314.666 842.501 342.42 838.872 354.823 823.013C357.229 820.001 359.369 816.725 361.115 813.16C364.211 806.751 366.154 799.425 366.682 791.581L386.63 492.855C387.026 486.778 386.365 480.701 384.814 474.888C380.529 459.295 369.086 446.141 353.492 438.82C338.032 431.564 319.926 431.034 304.069 437.5L32.741 546.779C14.1036 554.102 3.39392 574.393 1.21721 595.658Z"/><path d="M575.008 695.626C573.853 695.626 572.828 695.098 572.175 694.238C571.518 693.378 571.319 692.221 571.617 691.187L606.399 567.374H579.461C578.306 567.374 577.281 566.846 576.628 565.986C575.971 565.126 575.772 563.969 576.07 562.935L614.407 422.566C615.028 420.366 616.912 418.888 619.202 418.888H659.52C660.675 418.888 661.7 419.416 662.353 420.276C663.01 421.136 663.209 422.293 662.911 423.327L628.129 547.14H655.067C656.222 547.14 657.247 547.668 657.9 548.528C658.557 549.388 658.756 550.545 658.458 551.579L620.121 691.948C619.5 694.148 617.616 695.626 615.326 695.626H575.008Z"/><path d="M463.649 695.626H416.418C415.263 695.626 414.238 695.098 413.585 694.238C412.928 693.378 412.729 692.221 413.027 691.187L451.364 550.818C452.114 548.155 454.397 546.282 457.194 546.282C459.991 546.282 462.274 548.155 463.024 550.818L501.361 691.187C501.659 692.221 501.46 693.378 500.803 694.238C500.15 695.098 499.125 695.626 497.97 695.626H463.649Z"/><path d="M269.386 566.846C268.759 564.78 269.25 562.516 270.767 560.98L388.539 440.561C390.056 439.025 392.273 438.53 394.297 439.157C396.187 439.784 397.871 441.255 398.498 443.189L438.815 569.974C439.442 572.04 438.951 574.304 437.434 575.84L318.795 696.259C317.278 697.795 315.059 698.29 313.037 697.663C311.147 697.036 309.463 695.565 308.836 693.631L269.386 566.846Z"/><path d="M700.492 695.626H648.625C647.47 695.626 646.445 695.098 645.792 694.238C645.135 693.378 644.936 692.221 645.234 691.187L683.571 550.818C684.321 548.155 686.604 546.282 689.401 546.282C692.198 546.282 694.481 548.155 695.231 550.818L733.568 691.187C733.866 692.221 733.667 693.378 733.01 694.238C732.357 695.098 731.332 695.626 730.177 695.626H700.492Z"/><path d="M517.68 418.888H558.262C560.155 418.888 561.776 419.9 562.562 421.569C563.348 423.238 563.084 425.172 561.965 426.589L441.039 575.906C440.317 576.827 439.227 577.355 438.071 577.355C436.916 577.355 435.826 576.827 435.104 575.906L314.178 426.589C313.059 425.172 312.795 423.238 313.581 421.569C314.367 419.9 315.988 418.888 317.881 418.888H358.463C360.884 418.888 363.107 420.166 364.394 422.234L438.071 541.388L511.748 422.234C513.033 420.166 515.261 418.888 517.68 418.888Z"/><path d="M156.68 729.514C156.68 724.627 160.513 720.644 165.258 720.644H882.742C887.487 720.644 891.32 724.627 891.32 729.514V862.584C891.32 867.471 887.487 871.454 882.742 871.454H165.258C160.513 871.454 156.68 867.471 156.68 862.584V729.514Z"/></svg>`,
};

const PRIMARY_ICONS: Record<string, string> = {
  envelope: `<svg class="cdit-footer__primary-icon" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor"><path d="M48 64C21.5 64 0 85.5 0 112c0 15.1 7.1 29.3 19.2 38.4L236.8 313.6c11.4 8.5 27 8.5 38.4 0L492.8 150.4c12.1-9.1 19.2-23.3 19.2-38.4c0-26.5-21.5-48-48-48H48zM0 176V384c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V176L294.4 339.2c-22.8 17.1-54 17.1-76.8 0L0 176z"/></svg>`,
  phone: `<svg class="cdit-footer__primary-icon" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor"><path d="M164.9 24.6c-7.7-18.6-28-28.5-47.4-23.2l-88 24C12.1 30.2 0 46 0 64C0 311.4 200.6 512 448 512c18 0 33.8-12.1 38.6-29.5l24-88c5.3-19.4-4.6-39.7-23.2-47.4l-96-40c-16.3-6.8-35.2-2.1-46.3 11.6L304.7 368C234.3 334.7 177.3 277.7 144 207.3L193.3 167c13.7-11.2 18.4-30 11.6-46.3l-40-96z"/></svg>`,
};

// ── HTML template ─────────────────────────────────────────────────────────────

/**
 * Renders the complete footer HTML string.
 *
 * Pure function — no side effects, no browser globals.
 * All config string values are HTML-escaped before interpolation.
 * Analytics script injection is handled separately by the consuming adapter.
 */
export function renderFooterHtml(config: FooterConfig, options: ResolvedFooterOptions): string {
  const { bgImageUrl, currentLocale, currentPathname, basePath } = options;

  // ── Derived values ──────────────────────────────────────────────────────────

  const defaults = resolveDefaultTexts(currentLocale);

  const madeWithText = config.meta.madeWithTextKey || defaults.madeWith;

  const currentYear = new Date().getFullYear();
  const yearRange = `1983-${currentYear}`;
  const useDefaultCopyright = !config.meta.copyrightText;
  const copyrightText = useDefaultCopyright
    ? null
    : config.meta.copyrightText!.split('{year}').join(yearRange);

  // Color overrides → inline CSS custom properties
  const colorParts: string[] = [];
  if (config.colors?.bg)        colorParts.push(`--footer-bg: ${config.colors.bg}`);
  if (config.colors?.text)      colorParts.push(`--footer-text: ${config.colors.text}`);
  if (config.colors?.linkHover) colorParts.push(`--footer-link: ${config.colors.linkHover}`);
  if (config.colors?.focusRing) colorParts.push(`--footer-focus: ${config.colors.focusRing}`);
  const colorStyle = colorParts.join('; ');

  // Background image style
  const bgImageStyle = bgImageUrl ? `url(${bgImageUrl})` : null;

  // Glass overlay style
  const overlayStrength = config.visuals?.overlayStrength ?? 0.15;
  const glassOverlayStyle = `background: rgba(240, 238, 233, ${overlayStrength}); backdrop-filter: blur(4px);`;

  // ── Column 1: Network ───────────────────────────────────────────────────────

  const logoHtml = config.network.logo ? renderLogo(config.network.logo) : '';

  const networkItemsHtml = (config.network.items || []).map((item) => {
    const isCurrentSite = item.id === config.outlet;
    if (isCurrentSite) {
      return `<li><span class="cdit-footer__link cdit-footer__link--current">${escapeHtml(item.label)}</span></li>`;
    }
    return `<li><a href="${escapeHtml(item.href)}" class="cdit-footer__link">${escapeHtml(item.label)}</a></li>`;
  }).join('\n          ');

  const socialHtml = renderSocial(config);

  // ── Column 2: Primary ───────────────────────────────────────────────────────

  const primaryItemsHtml = (config.columns.primary.items || []).map((item) => {
    const iconHtml = item.icon ? (PRIMARY_ICONS[item.icon] || '') : '';
    if (item.href) {
      return `<li><a href="${escapeHtml(item.href)}" class="cdit-footer__link">${iconHtml}${escapeHtml(item.label)}</a></li>`;
    }
    return `<li><span class="cdit-footer__text">${iconHtml}${escapeHtml(item.value || item.label)}</span></li>`;
  }).join('\n          ');

  // ── Column 3: Secondary ─────────────────────────────────────────────────────

  const secondaryGroupsHtml = (config.columns.secondary.groups || []).map((group) => {
    const groupItemsHtml = (group.items || []).map((item) =>
      `<li><a href="${escapeHtml(item.href)}" class="cdit-footer__link">${escapeHtml(item.label)}</a></li>`
    ).join('\n              ');
    return `<div class="cdit-footer__group">
            <h3 class="cdit-footer__heading">${escapeHtml(group.title)}</h3>
            <ul class="cdit-footer__links" role="list">
              ${groupItemsHtml}
            </ul>
          </div>`;
  }).join('\n          ');

  // ── Meta row A: Made with + Language toggle ─────────────────────────────────

  const languageToggleHtml = renderLanguageToggle(config, currentPathname, basePath);

  // ── Meta row B: Copyright + Right side ─────────────────────────────────────

  const copyrightHtml = renderCopyright(
    useDefaultCopyright,
    copyrightText,
    yearRange,
    defaults.rights,
    config.version
  );

  const metaRightHtml = renderMetaRight(config);

  // ── Assemble ────────────────────────────────────────────────────────────────

  const versionAttr = config.version ? ` data-version="${escapeHtml(config.version)}"` : '';

  return `<footer class="cdit-footer" role="contentinfo"${versionAttr}${colorStyle ? ` style="${escapeHtml(colorStyle)}"` : ''}>
  ${bgImageStyle ? `<div class="cdit-footer__bg" style="background-image: ${bgImageStyle}" aria-hidden="true"></div>` : ''}
  <div class="cdit-footer__glass" style="${glassOverlayStyle}" aria-hidden="true"></div>
  <div class="cdit-footer__content">
    <div class="cdit-footer__grid">

      <!-- Column 1: Network Switcher -->
      <nav class="cdit-footer__column cdit-footer__column--network" aria-label="CDIT Network Navigation">
        <h2 class="cdit-footer__heading">${escapeHtml(config.network.title)}</h2>
        ${logoHtml}
        <ul class="cdit-footer__links" role="list">
          ${networkItemsHtml}
        </ul>
        ${socialHtml}
      </nav>

      <!-- Column 2: Primary Actions -->
      <div class="cdit-footer__column cdit-footer__column--primary">
        <h2 class="cdit-footer__heading">${escapeHtml(config.columns.primary.title)}</h2>
        <ul class="cdit-footer__links" role="list">
          ${primaryItemsHtml}
        </ul>
      </div>

      <!-- Column 3: Secondary Groups -->
      <nav class="cdit-footer__column cdit-footer__column--secondary" aria-label="Site Navigation">
        ${secondaryGroupsHtml}
      </nav>

    </div>

    <!-- Divider -->
    <div class="cdit-footer__divider" role="separator" aria-hidden="true"></div>

    <!-- Meta Row A: Made with + Language toggle -->
    <div class="cdit-footer__meta-row">
      <p class="cdit-footer__meta-text">
        <span role="img" aria-label="made with love in Brandenburg, Germany">${escapeHtml(madeWithText)}</span>
      </p>
      ${languageToggleHtml}
    </div>

    <!-- Meta Row B: Copyright + Legal/Location -->
    <div class="cdit-footer__meta-row">
      <p class="cdit-footer__meta-text">
        ${copyrightHtml}
      </p>
      <div class="cdit-footer__meta-right">
        ${metaRightHtml}
      </div>
    </div>
  </div>
</footer>`;
}

// ── Sub-render helpers ────────────────────────────────────────────────────────

function renderLogo(logo: NonNullable<FooterConfig['network']['logo']>): string {
  const img = `<img src="${escapeHtml(logo.image)}" alt="${escapeHtml(logo.alt)}" class="cdit-footer__logo-image" />`;
  const caption = logo.caption
    ? `<p class="cdit-footer__logo-caption">${escapeHtml(logo.caption)}</p>`
    : '';

  if (logo.href) {
    return `<div class="cdit-footer__logo">
          <a href="${escapeHtml(logo.href)}" class="cdit-footer__logo-link">
            ${img}
            ${caption}
          </a>
        </div>`;
  }

  return `<div class="cdit-footer__logo">
          ${img}
          ${caption}
        </div>`;
}

function renderSocial(config: FooterConfig): string {
  const social = config.columns.primary.social;
  if (!social || social.length === 0) return '';

  const layout = config.columns.primary.socialLayout || 'horizontal';
  const style = config.columns.primary.socialStyle || 'default';

  const iconsHtml = social.map((s) => {
    const isExternal = s.href.startsWith('http');
    const targetAttr = isExternal ? ' target="_blank"' : '';
    const relAttr = isExternal ? ' rel="noopener noreferrer"' : '';
    const svgIcon = SOCIAL_ICONS[s.icon] || '';
    return `<a href="${escapeHtml(s.href)}" class="cdit-footer__social-icon" aria-label="${escapeHtml(s.label)}" data-network="${escapeHtml(s.icon)}"${targetAttr}${relAttr}>${svgIcon}</a>`;
  }).join('\n          ');

  return `<div class="cdit-footer__social" data-layout="${escapeHtml(layout)}" data-social-style="${escapeHtml(style)}">
          ${iconsHtml}
        </div>`;
}

function renderLanguageToggle(config: FooterConfig, currentPathname: string, basePath: string): string {
  const i18n = config.i18n;
  if (!i18n || !i18n.languages || i18n.languages.length <= 1) return '';
  if (i18n.showLanguageToggle === false) return '';

  const availableLanguageCodes = i18n.languages.map((l) => l.code);

  const linksHtml = i18n.languages.slice(0, 3).map((lang) => {
    const isCurrentLang = lang.code === i18n.current;
    const langUrl = i18n.languageUrls?.[lang.code] ??
      buildLanguageUrl(lang.code, currentPathname, availableLanguageCodes, basePath);
    const activeClass = isCurrentLang ? ' cdit-footer__language-link--active' : '';
    const ariaCurrent = isCurrentLang ? ' aria-current="page"' : '';
    const flagHtml = lang.flag
      ? `<span role="img" aria-label="${escapeHtml(lang.label)}" aria-hidden="true" class="cdit-footer__language-flag">${escapeHtml(lang.flag)}</span>`
      : '';
    return `<a href="${escapeHtml(langUrl)}" class="cdit-footer__language-link${activeClass}"${ariaCurrent} hreflang="${escapeHtml(lang.code)}">${flagHtml}${escapeHtml(lang.label)}</a>`;
  }).join('\n          ');

  return `<div class="cdit-footer__language" role="navigation" aria-label="Language Selection">
          ${linksHtml}
        </div>`;
}

function renderCopyright(
  useDefault: boolean,
  copyrightText: string | null,
  yearRange: string,
  rightsText: string,
  version: string | undefined
): string {
  const versionHtml = version
    ? `<span class="cdit-footer__meta-separator" aria-hidden="true"> · </span><span class="cdit-footer__version" title="Site version">v${escapeHtml(version)}</span>`
    : '';

  if (useDefault) {
    return `&copy; ${escapeHtml(yearRange)} <a href="https://casey.berlin/DIT" class="cdit-footer__meta-link">CDIT</a>. ${escapeHtml(rightsText)}${versionHtml}`;
  }

  return `${escapeHtml(copyrightText || '')}${versionHtml}`;
}

function renderMetaRight(config: FooterConfig): string {
  const rightSide = config.meta.rightSide;

  if (rightSide.type === 'legal') {
    const items = rightSide.items || [];
    const linksHtml = items.map((item, index) => {
      const sep = index < items.length - 1
        ? `<span class="cdit-footer__meta-separator" aria-hidden="true"> • </span>`
        : '';
      return `<a href="${escapeHtml(item.href)}" class="cdit-footer__meta-link">${escapeHtml(item.label)}</a>${sep}`;
    }).join('\n          ');
    return `<nav aria-label="Legal Information">
          ${linksHtml}
        </nav>`;
  }

  if (rightSide.type === 'location') {
    return `<p class="cdit-footer__meta-text">${escapeHtml(rightSide.text)}</p>`;
  }

  return '';
}
