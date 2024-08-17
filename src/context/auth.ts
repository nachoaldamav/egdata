import { createContext } from 'react';
import type { User } from '~/types/auth';

export interface AuthContextType {
  user: User | null;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
});
