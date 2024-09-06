import { Authenticator } from 'remix-auth';
import { sessionStorage } from '../sessions.server';
import type { DiscordProfile, PartialDiscordGuild } from 'remix-auth-discord';
import { DiscordStrategy } from 'remix-auth-discord';
import { OAuth2Strategy } from 'remix-auth-oauth2';
import { httpClient } from '~/lib/http-client';
import { EpicAccountResponse, getEpicAccount } from '~/lib/get-epic-account.server';

type CustomDiscordGuild = Omit<PartialDiscordGuild, 'features'>;

export interface DiscordUser {
  id: DiscordProfile['id'];
  displayName: DiscordProfile['displayName'];
  avatar: DiscordProfile['__json']['avatar'];
  avatarUrl: DiscordProfile['__json']['avatar'];
  email: DiscordProfile['__json']['email'];
  locale?: string;
  guilds?: Array<CustomDiscordGuild>;
  accessToken: string;
  refreshToken: string;
  expires_at: string;
  epicId: string | null | undefined;
}

interface EpicProfile {
  avatarUrl?: {
    id: string;
    filename: string;
    variants: string[];
  };
}

export interface EpicUser {
  accountId: string;
  displayName: string;
  preferredLanguage: string;
  accessToken: string;
  refreshToken: string;
  expires_at: string;
  profile: EpicProfile;
}

interface EpicToken extends Record<string, unknown> {
  provider: 'epic';
  scope: string;
  token_type: string;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: string;
  refresh_expires_in: number;
  refresh_expires_at: string;
  account_id: string;
  client_id: string;
  application_id: string;
}

export const discordStrategy = new DiscordStrategy(
  {
    clientID: process.env.DISCORD_CLIENT_ID as string,
    clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
    callbackURL: process.env.DISCORD_REDIRECT_URI as string,
    scope: ['identify', 'email', 'guilds'],
  },
  async ({ accessToken, refreshToken, extraParams, profile }): Promise<DiscordUser> => {
    /**
     * Get the user data from your DB or API using the tokens and profile
     * For example query all the user guilds
     * IMPORTANT: This can quickly fill the session storage to be too big.
     * So make sure you only return the values from the guilds (and the guilds) you actually need
     * (eg. omit the features)
     * and if that's still to big, you need to store the guilds some other way. (Your own DB)
     *
     * Either way, this is how you could retrieve the user guilds.
     */
    const userGuilds: Array<PartialDiscordGuild> = await (
      await fetch('https://discord.com/api/v10/users/@me/guilds', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
    )?.json();

    const guilds: Array<CustomDiscordGuild> = userGuilds
      // biome-ignore lint/suspicious/noDoubleEquals: This is a BigInt comparison
      .filter((g) => g.owner || (BigInt(g.permissions) & BigInt(0x20)) == BigInt(0x20))
      .map(({ features, ...rest }) => {
        return { ...rest };
      });

    const userExists = await httpClient
      .get('/users/discord', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        retries: 0,
      })
      .catch(() => null);

    if (!userExists) {
      await httpClient.post(
        '/users/discord',
        {
          id: profile.id,
          displayName: profile.displayName,
          avatar: profile.__json.avatar,
          avatarUrl: profile.__json.avatar,
          email: profile.__json.email,
          locale: profile.__json.locale,
          accessToken,
          refreshToken: refreshToken as string,
          guilds,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          retries: 0,
        },
      );
    }

    return {
      id: profile.id,
      displayName: profile.displayName,
      avatar: profile.__json.avatar,
      avatarUrl: profile.__json.avatar,
      email: profile.__json.email,
      locale: profile.__json.locale,
      accessToken,
      refreshToken: refreshToken as string,
      expires_at: new Date(Date.now() + extraParams.expires_in * 1000).toISOString(),
      guilds,
      epicId: undefined,
    };
  },
);

export const epicStrategy = new OAuth2Strategy<
  EpicUser,
  {
    provider: string;
  },
  EpicToken
>(
  {
    clientId: process.env.EPIC_CLIENT_ID as string,
    clientSecret: process.env.EPIC_CLIENT_SECRET as string,
    redirectURI: process.env.EPIC_REDIRECT_URI as string,
    authorizationEndpoint: 'https://www.epicgames.com/id/authorize',
    tokenEndpoint: 'https://api.epicgames.dev/epic/oauth/v2/token',
    authenticateWith: 'http_basic_auth',
    scopes: ['basic_profile'],
    tokenRevocationEndpoint: 'https://api.epicgames.dev/epic/oauth/v2/token/revoke',
  },
  async ({ tokens }) => {
    await httpClient.get<EpicAccountResponse['0']>('/auth', {
      retries: 0,
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    const user = await getEpicAccount(tokens.access_token, tokens.account_id);

    return {
      accountId: user.accountId,
      displayName: user.displayName,
      preferredLanguage: user.preferredLanguage,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expires_at: new Date(Date.now() + 1000 * tokens.expires_in).toISOString(),
    };
  },
);

export const authenticator = new Authenticator<EpicUser>(sessionStorage);

authenticator.use(epicStrategy, 'epic');
