import NextAuth from 'next-auth';
import { getConfig } from '@/lib/config';

const config = getConfig();

const { handlers } = NextAuth({
  providers:
    config.auth.enabled && config.auth.issuer
      ? [
          {
            id: 'sso',
            name: 'SSO',
            type: 'oidc' as const,
            issuer: config.auth.issuer,
            clientId: config.auth.clientId ?? '',
            clientSecret: config.auth.clientSecret ?? '',
          },
        ]
      : [],
  trustHost: true,
});

export const { GET, POST } = handlers;
