import type { ReactNode } from 'react';
import type { EpicUser } from '~/app/services/auth.server';
import { AuthContext } from '~/context/auth';

export function AuthProvider({ children, user }: { children: ReactNode; user: EpicUser | null }) {
  return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>;
}
