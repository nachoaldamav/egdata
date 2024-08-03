import { useContext } from 'react';
import type { CountryState } from '~/context/country';
import { CountryContext } from '~/context/country-context';

export function useCountry(): CountryState {
  const context = useContext(CountryContext);
  if (context === undefined) {
    throw new Error('useCountry must be used within a CountryProvider');
  }
  return context;
}
