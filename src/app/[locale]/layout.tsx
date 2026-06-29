import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { getConfig } from '@/lib/config';
import { contrastColor } from '@/lib/branding';
import { ThemeProvider } from '@/components/theme-provider';
import '@/app/globals.css';

export async function generateMetadata(): Promise<Metadata> {
  const { branding } = getConfig();
  return {
    title: branding.appTitle ?? `${branding.orgName} — IT Security Incident Report`,
    description: branding.appDescription ?? 'IT Security Incident Reporting Application',
    icons: branding.favicon ? { icon: branding.favicon } : undefined,
  };
}

export function generateViewport(): Viewport {
  return { themeColor: getConfig().branding.primaryColor };
}

export default async function LocaleLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  const config = getConfig();
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get('meldung-theme')?.value;
  const isDark = themeCookie === 'dark';
  const brandForeground =
    config.branding.brandForeground ?? contrastColor(config.branding.primaryColor);

  return (
    <html lang={locale} className={isDark ? 'dark' : ''} suppressHydrationWarning>
      <body className="bg-background">
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider serverTheme={themeCookie as 'light' | 'dark' | undefined}>
            <div
              className="min-h-screen"
              style={
                {
                  '--brand': config.branding.primaryColor,
                  '--accent': config.branding.accentColor,
                  '--brand-fg': brandForeground,
                } as React.CSSProperties
              }
            >
              {children}
            </div>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
