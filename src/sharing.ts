export type SharePlatform = 'whatsapp' | 'telegram' | 'facebook' | 'imessage' | 'signal';

export const SHARE_PLATFORMS: Array<{ id: SharePlatform; label: string; iconSvg: string }> = [
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    iconSvg: `<svg class="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="#25D366" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.856L0 24l6.335-1.54A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>`,
  },
  {
    id: 'telegram',
    label: 'Telegram',
    iconSvg: `<svg class="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="#2CA5E0" aria-hidden="true"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-2.026 9.354c-.148.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.332-.373-.12L6.243 14.6l-2.965-.924c-.644-.204-.657-.644.136-.953l11.57-4.462c.537-.194 1.006.13.578 1.987z"/></svg>`,
  },
  {
    id: 'facebook',
    label: 'Facebook',
    iconSvg: `<svg class="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
  },
  {
    id: 'imessage',
    label: 'iMessage',
    iconSvg: `<svg class="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="#30D158" aria-hidden="true"><path d="M20 2H4C2.9 2 2 2.9 2 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 11H7v-2h6v2zm4-4H7V7h10v2z"/></svg>`,
  },
  {
    id: 'signal',
    label: 'Signal',
    iconSvg: `<svg class="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="#3A76F0" aria-hidden="true"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM12 16c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08A7.19 7.19 0 0 1 12 16z"/></svg>`,
  },
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
