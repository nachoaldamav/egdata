import { useState, type ReactNode } from 'react';
import { CookiesProvider, useCookies } from 'react-cookie';
import { CountryContext } from './country-context';

export interface CountryState {
  country: string;
  setCountry: (country: string) => void;
}

interface CountryProviderProps {
  children: ReactNode;
}

function CountryProvider({ children }: CountryProviderProps) {
  const [cookies, setCookie] = useCookies(['EGDATA_COUNTRY']);
  const [countryState, setCountryState] = useState<string>(
    cookies.EGDATA_COUNTRY || 'US',
  );

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
