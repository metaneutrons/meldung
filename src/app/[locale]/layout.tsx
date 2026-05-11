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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-gray-50 dark:bg-gray-950">
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider serverTheme={themeCookie as 'light' | 'dark' | undefined}>
            <div
              className="min-h-screen"
              style={
                {
                  '--brand-primary': config.branding.primaryColor,
                  '--brand-primary-hover': config.branding.primaryColor + 'dd',
                  '--brand-accent': config.branding.accentColor,
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
