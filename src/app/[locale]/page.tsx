import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { getLocale } from 'next-intl/server';
import { getConfig } from '@/lib/config';
import { IncidentForm } from './incident-form';

function loadWelcomeContent(locale: string): string {
  const localePath = resolve(process.cwd(), `content/welcome.${locale}.md`);
  if (existsSync(localePath)) {
    return readFileSync(localePath, 'utf-8');
  }
  const defaultPath = resolve(process.cwd(), 'content/welcome.de.md');
  if (existsSync(defaultPath)) {
    return readFileSync(defaultPath, 'utf-8');
  }
  return '# IT Security Incident Report\n\nPlease fill out the form to report an incident.';
}

function loadFooterContent(): string {
  const footerPath = resolve(process.cwd(), 'content/footer.md');
  if (existsSync(footerPath)) {
    return readFileSync(footerPath, 'utf-8');
  }
  return '';
}

export default async function HomePage() {
  const config = getConfig();
  const locale = await getLocale();
  const welcomeContent = loadWelcomeContent(locale);
  const footerContent = loadFooterContent();

  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-[var(--color-primary)]/3 via-transparent to-transparent dark:from-[var(--color-primary)]/5" />
      <div className="relative z-10 flex min-h-screen flex-col">
        <IncidentForm
          orgName={config.branding.orgName}
          logoUrl={config.branding.logoUrl}
          welcomeContent={welcomeContent}
          footerContent={footerContent}
        />
      </div>
    </div>
  );
}
