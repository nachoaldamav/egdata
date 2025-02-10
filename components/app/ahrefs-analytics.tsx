import consola from 'consola';
import { useEffect } from 'react';

interface AhrefsAnalyticsProps {
  tagId: string;
}

export const AhrefsAnalytics: React.FC<AhrefsAnalyticsProps> = ({ tagId }) => {
  useEffect(() => {
    if (!tagId) {
      consola.warn('AhrefsAnalytics: No tag ID provided');
      return;
    }

    // Inject the Google Tag script dynamically
    const existingScript = document.querySelector(
      `script[src="https://analytics.ahrefs.com/analytics.js"]`,
    );
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://analytics.ahrefs.com/analytics.js';
      script.async = true;
      script['data-key'] = tagId;
      document.head?.appendChild(script);
    }

    consola.info('AhrefsAnalytics: Loaded script', tagId);
  }, [tagId]);

  return null;
};
