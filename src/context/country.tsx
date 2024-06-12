import { useState, type ReactNode } from 'react';
import { CookiesProvider, useCookies } from 'react-cookie';
import { CountryContext } from './country-context';
import getCountryCode from '~/lib/get-country-code';
import { useLocation } from '@remix-run/react';

export interface CountryState {
  country: string;
  setCountry: (country: string) => void;
}

interface CountryProviderProps {
  children: ReactNode;
}

function CountryProvider({ children }: CountryProviderProps) {
  const location = useLocation();
  const url = new URL(`https://dummy${location.pathname}${location.search}`);

  const [cookies, setCookie] = useCookies(['EGDATA_COUNTRY']);
  const [countryState, setCountryState] = useState<string>(getCountryCode(url, cookies));

  const handleCountry = (selectedCountry: string) => {
    setCookie('EGDATA_COUNTRY', selectedCountry, {
      path: '/',
      maxAge: 31536000,
      sameSite: 'lax',
      domain: '.egdata.app',
    });
    if (import.meta.env.DEV) {
      setCookie('EGDATA_COUNTRY', selectedCountry, {
        path: '/',
        maxAge: 31536000,
        sameSite: 'lax',
        domain: 'localhost',
      });
    }
    setCountryState(selectedCountry);
  };

  return (
    <CookiesProvider>
      <CountryContext.Provider
        value={{
          country: countryState,
          setCountry: handleCountry,
        }}
      >
        {children}
      </CountryContext.Provider>
    </CookiesProvider>
  );
}

export { CountryProvider };
