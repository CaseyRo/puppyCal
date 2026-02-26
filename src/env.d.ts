/** Build-time config from .env (injected by Webpack DefinePlugin). */
declare const __CONFIG__: {
  notificationWebhookUrl: string;
  dataPolicyUrl: string;
  privacyUrl: string;
  impressumUrl: string;
};
