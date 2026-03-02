import type { FooterConfig } from './footer/src/core/config';

declare const __CONFIG__: { umamiWebsiteId: string; version: string; [k: string]: string };

export const footerConfig: FooterConfig = {
  outlet: 'puppycal',
  network: {
    title: 'CDIT',
    items: [
      { id: 'cdit', label: 'CDIT', href: 'https://casey.berlin/DIT' },
      { id: 'writings', label: 'Casey Writes', href: 'https://casey.berlin/writes' },
    ],
  },
  columns: {
    primary: {
      title: 'Connect',
      items: [
        { label: 'CDIT', href: 'https://casey.berlin/DIT' },
        { label: 'Buy me a coffee', href: 'https://buymeacoffee.com/caseyberlin' },
      ],
      social: [
        {
          label: 'Buy me a coffee',
          href: 'https://buymeacoffee.com/caseyberlin',
          icon: 'buymeacoffee',
        },
        { label: 'Instagram', href: 'https://instagram.com/caseyromkes', icon: 'instagram' },
        { label: 'GitHub', href: 'https://github.com/caseyro', icon: 'github' },
      ],
      socialStyle: 'filled',
    },
    secondary: {
      groups: [
        {
          title: 'puppyCal',
          items: [{ label: 'View on GitHub', href: 'https://github.com/CaseyRo/puppyCal' }],
        },
      ],
    },
  },
  version: __CONFIG__.version,
  meta: { rightSide: { type: 'location', text: 'Berlin, DE' } },
  ...(__CONFIG__.umamiWebsiteId ? { analytics: { websiteId: __CONFIG__.umamiWebsiteId } } : {}),
};
