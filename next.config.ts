import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  output: 'standalone',
  // Bundle the runtime config + Markdown content into the serverless function
  // / standalone output so they resolve at runtime on Vercel and in Docker.
  outputFileTracingIncludes: {
    '/**': ['./meldung.config.yaml', './content/**', './public/**'],
  },
};

export default withNextIntl(nextConfig);
