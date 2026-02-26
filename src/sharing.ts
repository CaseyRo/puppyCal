export type SharePlatform = 'whatsapp' | 'telegram' | 'facebook' | 'imessage' | 'signal';

export const SHARE_PLATFORMS: Array<{ id: SharePlatform; label: string; icon: string }> = [
  { id: 'whatsapp', label: 'WhatsApp', icon: '💬' },
  { id: 'telegram', label: 'Telegram', icon: '✈️' },
  { id: 'facebook', label: 'Facebook', icon: '📘' },
  { id: 'imessage', label: 'iMessage', icon: '💙' },
  { id: 'signal', label: 'Signal', icon: '🔒' },
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
