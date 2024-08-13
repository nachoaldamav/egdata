import { useState, useEffect, type ReactNode } from 'react';
import * as Portal from '@radix-ui/react-portal';
import { CookieBanner } from '~/components/app/cookie-banner';
import { CookiesContext } from './cookies-context';
import { useLocation } from '@remix-run/react';
import { registerSW } from 'virtual:pwa-register';
import { getSession, getTempUserId } from '~/lib/user-info';

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
  const location = useLocation();

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

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register(
          import.meta.env.MODE === 'production' ? '/service-worker.js' : '/dev-sw.js?dev-sw',
        )
        .then((registration) => {
          registration.update();
        });
    }
  }, []);

  useEffect(() => {
    if (userCookiesState?.accepted && import.meta.env.PROD) {
      console.log('Injecting Google Analytics script');
      // Inject Google Analytics script
      const script = document.createElement('script');
      script.src = 'https://www.googletagmanager.com/gtag/js?id=G-HB0VNVBEDQ';
      script.async = true;
      document.body.appendChild(script);

      const gtagScript = document.createElement('script');
      gtagScript.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag() {
          window.dataLayer.push(arguments);
        }
        gtag('js', new Date());
        gtag('config', 'G-HB0VNVBEDQ');
      `;

      document.body.appendChild(gtagScript);
    }
  }, [userCookiesState]);

  useEffect(() => {
    const userId = getTempUserId();
    const session = getSession();

    const trackData = {
      event: 'page_view_anonymous',
      location: window.location.href,
      params: {
        page_title: document.title,
        page_path: location.pathname,
        page_search: location.search,
      },
      userId,
      session,
    };

    if ('serviceWorker' in navigator)
      navigator.serviceWorker?.controller?.postMessage({
        type: 'track',
        payload: trackData,
      });
  }, [location]);

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
