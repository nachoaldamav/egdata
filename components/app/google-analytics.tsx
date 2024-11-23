import consola from 'consola';
import { useEffect } from 'react';

export interface ConsentSettings {
  ad_storage: string;
  ad_user_data: string;
  ad_personalization: string;
  analytics_storage: string;
  functionality_storage: string;
  personalization_storage: string;
  security_storage: string;
}

interface GoogleAnalyticsProps {
  tagId: string;
  consentSettings: {
    ad_storage: string;
    ad_user_data: string;
    ad_personalization: string;
    analytics_storage: string;
    functionality_storage: string;
    personalization_storage: string;
    security_storage: string;
  };
}

export const GoogleAnalytics: React.FC<GoogleAnalyticsProps> = ({
  tagId,
  consentSettings,
}) => {
  useEffect(() => {
    if (!tagId) {
      console.warn('GoogleAnalytics: No tag ID provided');
      return;
    }

    // Inject the Google Tag script dynamically
    const existingScript = document.querySelector(
      `script[src="https://www.googletagmanager.com/gtag/js?id=${tagId}"]`,
    );
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = `https://www.googletagmanager.com/gtag/js?id=${tagId}`;
      script.async = true;
      document.head.appendChild(script);
    }

    // Initialize gtag once the script is loaded
    const initializeGTag = () => {
      window.dataLayer = window.dataLayer || [];
      function gtag(...args: unknown[]) {
        consola.info('GoogleAnalytics: Sending event', args);
        window.dataLayer.push(args);
      }
      window.gtag = gtag;

      // Set up Google Analytics
      gtag('js', new Date());
      gtag('config', tagId);

      // Configure consent settings
      gtag('consent', 'default', {
        ...consentSettings,
      });

      consola.info('GoogleAnalytics: Initialized', tagId, consentSettings);
    };

    if (existingScript) {
      initializeGTag();
    } else {
      const checkScriptLoaded = setInterval(() => {
        // @ts-expect-error
        if (window.gtag) {
          clearInterval(checkScriptLoaded);
          initializeGTag();
        }
      }, 100);
    }
  }, [tagId, consentSettings]);

  return null;
};
