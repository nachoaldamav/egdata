import type { EpicToken } from '@/types/epic';
import { createServerFn } from '@tanstack/start';
import { readFile } from 'node:fs/promises';
import { jwtVerify, SignJWT } from 'jose';

export const getCookie = createServerFn({ method: 'GET' })
  .validator((name: string) => name)
  .handler(async (ctx) => {
    const { getCookie: _getCookie } = await import('vinxi/http');
    const cookie = _getCookie(ctx.data);

    if (!cookie) {
      return null;
    }

    return cookie;
  });

export const saveAuthCookie = createServerFn({ method: 'GET' })
  .validator((stringifiedValue: string) => stringifiedValue)
  .handler(async (ctx) => {
    const { setCookie: _setCookie } = await import('vinxi/http');

    const { name, value } = JSON.parse(ctx.data) as {
      name: string;
      value: EpicToken;
    };

    const certificate =
      process.env.JWT_SIGNING_KEY ??
      (await readFile(
        (process.env.JWT_SIGNING_CERT as string) ||
          import.meta.env.JWT_SIGNING_CERT,
        'utf-8',
      ));

    const secretKey = new TextEncoder().encode(certificate);

    const token = await new SignJWT(value)
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuedAt()
      .setExpirationTime('365d')
      .sign(secretKey);

    _setCookie(name, token, {
      httpOnly: false,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      path: '/',
      domain: import.meta.env.PROD ? 'egdata.app' : 'localhost',
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });

    return token;
  });

export const decodeJwt = createServerFn({ method: 'GET' })
  .validator(
    (
      token:
        | string
        | {
            payload: string;
          },
    ) => token,
  )
  .handler(async (ctx) => {
    try {
      const certificate =
        process.env.JWT_SIGNING_KEY ??
        (await readFile(
          (process.env.JWT_SIGNING_CERT as string) ||
            import.meta.env.JWT_SIGNING_CERT,
          'utf-8',
        ));
      const secretKey = new TextEncoder().encode(certificate);

      const { payload } = await jwtVerify(
        typeof ctx.data === 'string' ? ctx.data : ctx.data.payload,
        secretKey,
        {
          algorithms: ['RS256'],
        },
      );

      return payload as EpicToken;
    } catch (error) {
      console.error(`Failed to decode JWT ${ctx.data}`, error);
      return null;
    }
  });

/**
 * Get cookie from document.cookie
 */
export const getRawCookie = (name: string) => {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookie = document.cookie.split(';').find((cookie) => {
    const [key] = cookie.split('=');
    return key.trim() === name;
  });

  if (!cookie) {
    return null;
  }

  return cookie.split('=')[1];
};

export const deleteCookie = createServerFn({ method: 'GET' })
  .validator((name: string) => name)
  .handler(async (ctx) => {
    const { deleteCookie: _deleteCookie } = await import('vinxi/http');
    _deleteCookie(ctx.data);
  });
