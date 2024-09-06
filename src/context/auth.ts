import { createContext } from 'react';
import type { EpicUser } from '~/app/services/auth.server';

export interface AuthContextType {
  user: EpicUser | null;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
});
