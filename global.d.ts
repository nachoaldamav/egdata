declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: Gtag.Gtag;
  }
}

export {};
