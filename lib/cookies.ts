import type { EpicToken } from '@/types/epic';
import { createServerFn } from '@tanstack/start';
import { readFile } from 'node:fs/promises';
import jwt from 'jsonwebtoken';

export const getCookie = createServerFn('GET', async (name: string) => {
  const { getCookie: _getCookie } = await import('vinxi/http');
  const cookie = _getCookie(name);

  if (!cookie) {
    return null;
  }

  return cookie;
});

export const saveAuthCookie = createServerFn(
  'POST',
  async (stringifiedValue: string) => {
    const { setCookie: _setCookie } = await import('vinxi/http');

    const { name, value } = JSON.parse(stringifiedValue) as {
      name: string;
      value: EpicToken;
    };

    const certificate = await readFile(
      (process.env.JWT_SIGNING_CERT as string) ||
        import.meta.env.JWT_SIGNING_CERT,
      'utf-8'
    );

    const token = jwt.sign(value, certificate, {
      algorithm: 'RS256',
      expiresIn: '365d',
    });

    _setCookie(name, token, {
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      path: '/',
      domain: import.meta.env.PROD ? 'egdata.app' : 'localhost',
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });

    return token;
  }
);

export const decodeJwt = createServerFn(
  'GET',
  async (
    token:
      | string
      | {
          payload: string;
        }
  ) => {
    try {
      const certificate = await readFile(
        (process.env.JWT_SIGNING_CERT as string) ||
          import.meta.env.JWT_SIGNING_CERT,
        'utf-8'
      );
      return jwt.verify(
        typeof token === 'string' ? token : token.payload,
        certificate,
        {
          algorithms: ['RS256'],
        }
      ) as EpicToken;
    } catch (error) {
      console.error(`Failed to decode JWT ${token}`, error);
      return null;
    }
  }
);

/**
 * Get cookie from document.cookie
 */
export const getRawCookie = (name: string) => {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookie = document.cookie.split(';').find((cookie) => {
    const [key, value] = cookie.split('=');
    return key.trim() === name;
  });

  if (!cookie) {
    return null;
  }

  return cookie.split('=')[1];
};

export const deleteCookie = createServerFn('GET', async (name: string) => {
  const { deleteCookie: _deleteCookie } = await import('vinxi/http');
  _deleteCookie(name);
});
