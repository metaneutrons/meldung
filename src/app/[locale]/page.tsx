import { getLocale } from 'next-intl/server';
import { getConfig } from '@/lib/config';
import { loadPage } from '@/lib/texts';
import { IncidentForm } from './incident-form';

export default async function HomePage() {
  const config = getConfig();
  const locale = await getLocale();
  const values = { orgName: config.branding.orgName };
  const welcomeContent = loadPage('welcome', locale, values);
  const footerContent = loadPage('footer', locale, values);

  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-brand/[0.03] via-transparent to-transparent dark:from-brand/[0.05]" />
      <div className="relative z-10 flex min-h-screen flex-col">
        <IncidentForm
          orgName={config.branding.orgName}
          logoUrl={config.branding.logoUrl}
          logoDarkUrl={config.branding.logoDarkUrl}
          welcomeContent={welcomeContent}
          emergencyPhone={config.contact.emergencyPhone}
          footerContent={footerContent}
        />
      </div>
    </div>
  );
}
