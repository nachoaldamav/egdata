import { type ReactNode, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { LocaleContext } from '@/contexts/locale';

interface LocaleProviderProps {
  children: ReactNode;
  initialLocale?: string | null;
}

export const LocaleProvider: React.FC<LocaleProviderProps> = ({
  children,
  initialLocale,
}) => {
  const [locale, setLocale] = useState<string | undefined>(
    () =>
      initialLocale ||
      Cookies.get('user_locale') ||
      (typeof window !== 'undefined' ? window.navigator.language : undefined),
  );

  useEffect(() => {
    // Save locale to cookie only if it differs from the current cookie value
    if (locale && Cookies.get('user_locale') !== locale) {
      Cookies.set('user_locale', locale, { expires: 365 }); // Set cookie with a 1-year expiry
    }
  }, [locale]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
};
