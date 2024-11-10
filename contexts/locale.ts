import { createContext } from 'react';

export interface LocaleContextProps {
  locale: string | undefined;
  setLocale: (locale: string) => void;
}

export const LocaleContext = createContext<LocaleContextProps | undefined>(
  undefined,
);
