export type SharePlatform = 'whatsapp' | 'telegram' | 'facebook' | 'imessage' | 'signal';

export const SHARE_PLATFORMS: Array<{ id: SharePlatform; label: string; iconClass: string }> = [
  { id: 'whatsapp', label: 'WhatsApp', iconClass: 'fa-brands fa-whatsapp' },
  { id: 'telegram', label: 'Telegram', iconClass: 'fa-brands fa-telegram' },
  { id: 'facebook', label: 'Facebook', iconClass: 'fa-brands fa-facebook' },
  { id: 'imessage', label: 'iMessage', iconClass: 'fa-solid fa-comment-sms' },
  { id: 'signal', label: 'Signal', iconClass: 'fa-solid fa-shield-halved' },
];

function encoded(value: string): string {
  return encodeURIComponent(value);
}

export function buildShareTarget(platform: SharePlatform, url: string, text: string): string {
  const message = `${text} ${url}`.trim();
  const eMessage = encoded(message);
  const eUrl = encoded(url);

  switch (platform) {
    case 'whatsapp':
      return `https://wa.me/?text=${eMessage}`;
    case 'telegram':
      return `https://t.me/share/url?url=${eUrl}&text=${encoded(text)}`;
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${eUrl}`;
    case 'imessage':
      return `sms:&body=${eMessage}`;
    case 'signal':
      return `sgnl://send?text=${eMessage}`;
    default:
      return url;
  }
}
