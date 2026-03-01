export {};

declare global {
  /** Build-time config from .env (injected by Webpack DefinePlugin). */
  const __CONFIG__: {
    notificationWebhookUrl: string;
    dataPolicyUrl: string;
    privacyUrl: string;
    impressumUrl: string;
    repoUrl: string;
    umamiWebsiteId: string;
  };

  interface Window {
    umami?: {
      track: (name: string, payload?: Record<string, string | number | boolean>) => void;
    };
  }
}
