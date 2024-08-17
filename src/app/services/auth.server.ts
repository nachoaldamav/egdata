import { Authenticator } from 'remix-auth';
import { sessionStorage } from '../sessions.server';
import type { DiscordProfile, PartialDiscordGuild } from 'remix-auth-discord';
import { DiscordStrategy } from 'remix-auth-discord';
import { httpClient } from '~/lib/http-client';

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
  epicId: string | null | undefined;
}

const discordStrategy = new DiscordStrategy(
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
      guilds,
      epicId: undefined,
    };
  },
);

export const authenticator = new Authenticator<DiscordUser>(sessionStorage);

authenticator.use(discordStrategy);
