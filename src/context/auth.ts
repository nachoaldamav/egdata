import { createContext } from 'react';

export interface EpicJWT {
  id: string;
  iat: number;
  exp: number;
}

export interface Account {
  accountId: string;
  displayName: string;
  preferredLanguage: string;
  linkedAccounts?: LinkedAccount[];
}

interface LinkedAccount {
  identityProviderId: string;
  displayName: string;
}

export interface AuthContextType {
  jwt: EpicJWT | null;
  setJwt: (jwt: EpicJWT) => void;
  account: Account | null;
}

export const AuthContext = createContext<AuthContextType>({
  jwt: null,
  setJwt: () => {},
  account: null,
});
