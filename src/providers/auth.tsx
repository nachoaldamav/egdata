import type { ReactNode } from 'react';
import type { DiscordUser } from '~/app/services/auth.server';
import { AuthContext } from '~/context/auth';

export function AuthProvider({
  children,
  user,
}: { children: ReactNode; user: DiscordUser | null }) {
  return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>;
}
