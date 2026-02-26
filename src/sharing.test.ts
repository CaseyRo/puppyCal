import { describe, expect, it } from 'vitest';
import { buildShareTarget } from './sharing';

describe('sharing targets', () => {
  it('builds a whatsapp target URL', () => {
    const href = buildShareTarget('whatsapp', 'https://example.com', 'Hello');
    expect(href.startsWith('https://wa.me/?text=')).toBe(true);
    expect(decodeURIComponent(href)).toContain('Hello https://example.com');
  });

  it('builds platform-specific routes', () => {
    expect(buildShareTarget('telegram', 'https://example.com', 'Hi')).toContain('t.me/share/url');
    expect(buildShareTarget('facebook', 'https://example.com', 'Hi')).toContain(
      'facebook.com/sharer/sharer.php'
    );
    expect(buildShareTarget('imessage', 'https://example.com', 'Hi')).toContain('sms:');
    expect(buildShareTarget('signal', 'https://example.com', 'Hi')).toContain('sgnl://send');
  });
});
