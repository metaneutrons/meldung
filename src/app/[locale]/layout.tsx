import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { getConfig } from '@/lib/config';
import { ThemeProvider } from '@/components/theme-provider';
import '@/app/globals.css';

export const metadata: Metadata = {
  title: 'Meldung - IT Security Incident Report',
  description: 'IT Security Incident Reporting Application',
};

export default async function LocaleLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  const config = getConfig();
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get('meldung-theme')?.value;
  const isDark = themeCookie === 'dark';

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
