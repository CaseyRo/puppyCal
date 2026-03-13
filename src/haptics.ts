/**
 * Haptic feedback module — singleton wrapper around web-haptics.
 * No-ops silently on unsupported devices (desktop, older browsers).
 */
import { WebHaptics } from 'web-haptics';

let instance: WebHaptics | null = null;
let supported: boolean | null = null;

function getInstance(): WebHaptics | null {
  if (supported === null) {
    supported = WebHaptics.isSupported;
  }
  if (!supported) return null;
  if (!instance) {
    instance = new WebHaptics({ debug: false, showSwitch: false });
  }
  return instance;
}

export function haptic(preset: string): void {
  const h = getInstance();
  if (h) {
    void h.trigger(preset);
  }
}
