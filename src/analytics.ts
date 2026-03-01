export const ANALYTICS_EVENTS = {
  SHARE_OPENED: 'share_opened',
  SHARE_PLATFORM_SELECTED: 'share_platform_selected',
  SHARE_SENT: 'share_sent',
  CTA_BUY_ME_A_COFFEE_CLICK: 'cta_buy_me_a_coffee_click',
  CTA_ATTRIBUTION_LINK_CLICK: 'cta_attribution_link_click',
  CTA_REPO_COLLAB_CLICK: 'cta_repo_collab_click',
  CTA_FOOD_DATA_EMAIL_CLICK: 'cta_food_data_email_click',
  CTA_GENERAL_EMAIL_CLICK: 'cta_general_email_click',
  TAB_VIEWED: 'tab_viewed',
  CALENDAR_DOWNLOADED: 'calendar_downloaded',
  LANGUAGE_CHANGED: 'language_changed',
  FOOD_SUPPLIER_SELECTED: 'food_supplier_selected',
  FOOD_PRODUCT_SELECTED: 'food_product_selected',
  MIXED_MODE_TOGGLED: 'mixed_mode_toggled',
  BREED_SELECTED: 'breed_selected',
  DOG_PROFILE_COMPLETED: 'dog_profile_completed',
} as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

type EventValue = string | number | boolean;

const ALLOWED_PAYLOAD_KEYS = new Set([
  'tab',
  'platform',
  'surface',
  'lang',
  'supplier',
  'breed',
  'size',
  'enabled',
]);

function sanitizePayload(payload: Record<string, EventValue>): Record<string, EventValue> {
  return Object.fromEntries(
    Object.entries(payload).filter(([key]) => ALLOWED_PAYLOAD_KEYS.has(key))
  );
}

export function trackEvent(
  name: AnalyticsEventName,
  payload: Record<string, EventValue> = {}
): void {
  const umami = window.umami;
  if (!umami || typeof umami.track !== 'function') {
    return;
  }

  const safePayload = sanitizePayload(payload);
  umami.track(name, safePayload);
}
