import { type ReactNode, useEffect, useState } from 'react';
import { cookiesContext, type CookiesSelection } from '@/contexts/cookies';
import { useCookies as useCookiesClient } from 'react-cookie';
import { CookieBanner } from '@/components/app/cookies';
import { Base64Utils } from '@/lib/base-64';
import { GoogleAnalytics } from '@/components/app/google-analytics';

export interface CookiesProviderProps {
  children: ReactNode;
  initialSelection: CookiesSelection | null;
}

/**
 * The cookie is a base64 encoded string of the JSON object
 */
const decodeCookie = (cookie: string): CookiesSelection | null => {
  try {
    return JSON.parse(Base64Utils.decode(cookie)) as CookiesSelection;
  } catch (error) {
    console.error('Failed to decode cookie', error);
    return null;
  }
};

export function CookiesProvider({
  children,
  initialSelection,
}: CookiesProviderProps) {
  const [cookies, setCookie] = useCookiesClient(['EGDATA_COOKIES']);
  const [selection, setSelection] = useState<CookiesSelection | null>(
    initialSelection ?? null,
  );

  useEffect(() => {
    if (cookies.EGDATA_COOKIES) {
      const decodedCookie = decodeCookie(cookies.EGDATA_COOKIES);
      if (decodedCookie) {
        setSelection(decodedCookie);
      }
    }
  }, [cookies.EGDATA_COOKIES]);

  useEffect(() => {
    if (selection) {
      setCookie(
        'EGDATA_COOKIES',
        Base64Utils.encode(JSON.stringify(selection)),
        {
          path: '/',
          maxAge: 31536000,
          sameSite: 'lax',
          domain: import.meta.env.PROD ? '.egdata.app' : 'localhost',
        },
      );
    }
  }, [selection, setCookie]);

  return (
    <cookiesContext.Provider
      value={{
        selection,
        setSelection,
      }}
    >
      {children}
      {!selection && <CookieBanner />}
      {selection?.googleAnalytics && (
        <GoogleAnalytics
          tagId="G-HB0VNVBEDQ"
          consentSettings={selection.googleConsent}
        />
      )}
    </cookiesContext.Provider>
  );
}
