import type { ReactNode } from 'react';
import { AuthContext } from '~/context/auth';
import type { User } from '~/types/auth';

export function AuthProvider({ children, user }: { children: ReactNode; user: User | null }) {
  return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>;
}
