import { useQuery } from '@tanstack/react-query';
import { type ReactNode, useState, useEffect } from 'react';
import { AuthContext, type EpicJWT, type Account } from '~/context/auth';
import { httpClient } from '~/lib/http-client';

export function AuthProvider({
  children,
  initialJwt,
}: { children: ReactNode; initialJwt: EpicJWT | null }) {
  const [jwt, setJwt] = useState<EpicJWT | null>(initialJwt);
  const { data } = useQuery({
    queryKey: ['account', jwt],
    queryFn: () =>
      httpClient.get<{ data: Account[] }>('/accounts', {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      }),
    select(data) {
      return data.data[0];
    },
  });

  useEffect(() => {
    if (initialJwt) {
      setJwt(initialJwt);
    }
  }, [initialJwt]);

  return (
    <AuthContext.Provider value={{ jwt, setJwt, account: data || null }}>
      {children}
    </AuthContext.Provider>
  );
}
