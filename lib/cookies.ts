import type { EpicToken } from '@/types/epic';
import { createServerFn } from '@tanstack/react-start';
import { readFile } from 'node:fs/promises';
import { jwtVerify, SignJWT, importPKCS8, importSPKI } from 'jose';
import { PUBLIC_KEY } from './pub-key';

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
    const { setCookie: _setCookie, getWebRequest } = await import('vinxi/http');

    const { name, value } = JSON.parse(ctx.data) as {
      name: string;
      value: EpicToken;
    };

    const req = getWebRequest();

    let privateKeyPem: string;

    if (req.cloudflare) {
      privateKeyPem = req.cloudflare.env.JWT_SIGNING_KEY;
    } else {
      privateKeyPem =
        process.env.JWT_SIGNING_KEY ??
        (await readFile(
          (process.env.JWT_SIGNING_CERT as string) ||
            import.meta.env.JWT_SIGNING_CERT,
          'utf-8',
        ));
    }

    // Import the private key (PEM format) for signing
    const privateKey = await importPKCS8(privateKeyPem, 'RS256');

    const token = await new SignJWT(value)
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuedAt()
      .setExpirationTime('365d')
      .sign(privateKey);

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
      const { getWebRequest } = await import('vinxi/http');
      const req = getWebRequest();

      const publicKeyPem = PUBLIC_KEY;

      // Import the public key (PEM format) for verification
      const publicKey = await importSPKI(publicKeyPem, 'RS256');

      const { payload } = await jwtVerify(
        typeof ctx.data === 'string' ? ctx.data : ctx.data.payload,
        publicKey,
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
