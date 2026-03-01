/**
 * Example footer configuration for Writings site
 * 
 * This is a reference example. Copy and adapt for your site.
 */

import type { FooterConfig } from '../src/types';

// Get base path from environment (Astro)
const basePath = import.meta.env.BASE || '/writings/';
const basePathForHref = basePath === '/' ? '' : basePath.slice(0, -1);

// Network URLs from environment variables
const cditUrl = import.meta.env.CDIT_URL || 'https://cdit.consulting';
const caseyCvUrl = import.meta.env.CASEY_CV_URL || 'https://casey.berlin';
const caseyWritesUrl = import.meta.env.CASEY_WRITES_URL || 'https://writings.casey.berlin';

export const footerConfig: FooterConfig = {
  outlet: 'writings',

  // Column 1: Network Switcher (MUST be identical across all outlets)
  network: {
    title: 'CDIT',
    items: [
      { id: 'cdit', label: 'CDIT', href: cditUrl },
      { id: 'cv', label: 'About Casey', href: caseyCvUrl },
      { id: 'writings', label: 'Casey Writes', href: caseyWritesUrl },
    ],
  },

  // Column 2: Primary Actions (outlet-specific)
  columns: {
    primary: {
      title: 'Subscribe & Updates',
      items: [
        { label: 'RSS Feed', href: `${basePathForHref}/rss.xml` },
        { label: 'RSS Feed (All)', href: `${basePathForHref}/rss-all.xml` },
      ],
      social: [
        { label: 'RSS Feed', href: `${basePathForHref}/rss.xml`, icon: 'rss' },
        { label: 'LinkedIn', href: 'https://linkedin.com/in/casey-romkes', icon: 'linkedin' },
        { label: 'Instagram', href: 'https://instagram.com/caseyromkes', icon: 'instagram' },
      ],
      socialStyle: 'outline', // 'default' | 'outline' | 'filled'
    },

    // Column 3: Secondary Groups (outlet-specific)
    secondary: {
      groups: [
        {
          title: 'About',
          items: [
            { label: 'About This Site', href: '/about' },
          ],
        },
      ],
    },
  },

  // Meta rows
  meta: {
    madeWithTextKey: 'Made with 💚 in Germany',
    copyrightText: '© {year} Casey Romkes. All rights reserved.',
    rightSide: {
      type: 'legal',
      items: [
        { label: 'Impressum', href: '/impressum' },
        { label: 'Datenschutz', href: '/privacy' },
      ],
    },
  },

  // Optional: Background image (resolve with Astro's getImage if using optimization)
  // visuals: {
  //   bgImageUrl: '/images/footer-bg-placeholder.png',
  //   overlayStrength: 0.75,
  // },
};
