import { createContext } from 'react';

export interface CookiesSelection {
  googleAnalytics: boolean;
  selfHostedAnalytics: boolean;
}

export interface CookiesContextProps {
  /**
   * User selection of cookies, if null, the user has not yet made a selection
   */
  selection: CookiesSelection | null;
  setSelection: (selection: CookiesSelection) => void;
}

export const cookiesContext = createContext<CookiesContextProps | undefined>(
  undefined,
);
