import { createContext } from 'react';
import type { CookiesContextProps } from './cookies';

export const CookiesContext = createContext<CookiesContextProps | undefined>(undefined);
