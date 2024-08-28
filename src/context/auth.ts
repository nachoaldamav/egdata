import { createContext } from 'react';
import type { DiscordUser } from '~/app/services/auth.server';

export interface AuthContextType {
  user: DiscordUser | null;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
});
