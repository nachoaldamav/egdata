import { useState, useEffect, type ReactNode } from 'react';
import * as Portal from '@radix-ui/react-portal';
import { CookieBanner } from '~/components/app/cookie-banner';
import { CookiesContext } from './cookies-context';

export interface CookiesContextProps {
  cookiesAccepted: boolean;
  acceptCookies: () => void;
  declineCookies: () => void;
}

export const CookiesProvider = ({ children }: { children: ReactNode }) => {
  const [userCookiesState, setUserCookiesState] = useState<{
    accepted: boolean;
    closed: boolean;
  } | null>(null);
  const [windowLoaded, setWindowLoaded] = useState(false);

  useEffect(() => {
    setWindowLoaded(true);
  }, []);

  useEffect(() => {
    const isBot = navigator.userAgent.includes('bot');
    const isClient = typeof window !== 'undefined';

    if (isClient && !isBot) {
      const storedState = localStorage.getItem('EGDATA_APP_COOKIES_ACCEPTED');
      if (storedState) {
        setUserCookiesState(JSON.parse(storedState));
      }
    }
  }, []);

  useEffect(() => {
    if (userCookiesState?.accepted && import.meta.env.PROD) {
      console.log('Injecting Google Analytics script');
      // Inject Google Analytics script
      const script = document.createElement('script');
      script.src = 'https://www.googletagmanager.com/gtag/js?id=G-HB0VNVBEDQ';
      script.async = true;
      document.head.appendChild(script);

      script.onload = () => {
        // @ts-ignore
        window.dataLayer = window.dataLayer || [];
        function gtag() {
          // @ts-ignore
          // biome-ignore lint/style/noArguments: This is a Google Analytics function
          window.dataLayer.push(arguments);
        }
        // @ts-ignore
        gtag('js', new Date());
        // @ts-ignore
        gtag('config', 'G-HB0VNVBEDQ');
      };
    } else if (!userCookiesState?.accepted && import.meta.env.PROD) {
      console.log('Disabling Google Analytics');
      // Disable Google Analytics
      // @ts-ignore
      window['ga-disable-G-HB0VNVBEDQ'] = true;
    }
  }, [userCookiesState]);

  const acceptCookies = () => {
    const state = { accepted: true, closed: true };
    setUserCookiesState(state);
    localStorage.setItem('EGDATA_APP_COOKIES_ACCEPTED', JSON.stringify(state));
  };

  const declineCookies = () => {
    const state = { accepted: false, closed: true };
    setUserCookiesState(state);
    localStorage.setItem('EGDATA_APP_COOKIES_ACCEPTED', JSON.stringify(state));
  };

  return (
    <CookiesContext.Provider
      value={{
        cookiesAccepted: userCookiesState?.accepted ?? false,
        acceptCookies,
        declineCookies,
      }}
    >
      {children}
      {windowLoaded && !navigator.userAgent.includes('bot') && (
        <Portal.Root>{!userCookiesState?.closed && <CookieBanner />}</Portal.Root>
      )}
    </CookiesContext.Provider>
  );
};
