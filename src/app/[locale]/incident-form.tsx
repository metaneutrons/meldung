'use client';

import { useMemo, useState, useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Send } from 'lucide-react';
import { useFormStore } from '@/lib/store/form-store';
import { isReporterValid } from '@/lib/form/schema';
import { useIncidentSubmit } from '@/lib/hooks/use-incident-submit';
import { AppHeader } from '@/components/layout/app-header';
import { AppFooter } from '@/components/layout/app-footer';
import { DraftResumeBanner } from '@/components/draft-resume-banner';
import { WelcomePage } from '@/components/welcome-page';
import { Confirmation } from '@/components/wizard/confirmation';
import { StepNav } from '@/components/wizard/step-nav';
import { WizardProgress } from '@/components/wizard/wizard-progress';
import { WizardNavProvider } from '@/components/wizard/wizard-nav';
import { Button, Card } from '@/components/ui';
import {
  ReporterInfo,
  IncidentTimeline,
  IncidentClassification,
  IncidentDescription,
  AffectedSystems,
  ImpactAssessment,
  MeasuresTaken,
  GdprAssessment,
  Summary,
} from '@/components/steps';

interface StepDef {
  id: string;
  title: string;
  component: React.ComponentType;
  validate?: () => boolean;
}

interface IncidentFormProps {
  orgName: string;
  logoUrl?: string;
  logoDarkUrl?: string;
  welcomeContent: string;
  footerContent: string;
}

const errorBox =
  'mt-3 rounded-xl border border-danger-border bg-danger-bg px-4 py-2.5 text-sm text-danger';

export function IncidentForm({
  orgName,
  logoUrl,
  logoDarkUrl,
  welcomeContent,
  footerContent,
}: IncidentFormProps) {
  const t = useTranslations('wizard');
  const tc = useTranslations('common');
  const store = useFormStore;
  const personalDataInvolved = useFormStore((s) => s.personalDataInvolved);
  const reporterName = useFormStore((s) => s.reporterName);
  const email = useFormStore((s) => s.email);
  const phone = useFormStore((s) => s.phone);
  const canSubmit = isReporterValid({ reporterName, email, phone });
  const reduce = useReducedMotion();

  const { submit, submitting, submitted, result, error, resetSubmission } = useIncidentSubmit();

  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [validationError, setValidationError] = useState(false);

  // Welcome gating is hydration-safe: the server and the first client render
  // always show the welcome screen (localStorage is unavailable during SSR).
  // Once mounted, jump straight to the wizard if a draft exists — unless the
  // user explicitly navigated (start button / logo click).
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [userView, setUserView] = useState<'welcome' | 'wizard' | null>(null);
  const hasDraft = useFormStore(
    (s) => s._savedAt !== '' && (s.reporterName !== '' || s.description !== ''),
  );
  const showWelcome = !mounted ? true : userView ? userView === 'welcome' : !hasDraft;

  // Warn before closing if the form has unsaved data.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (submitted || showWelcome) return;
      const s = store.getState();
      if (s.reporterName || s.description) e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [submitted, showWelcome, store]);

  const steps: StepDef[] = useMemo(() => {
    const base: StepDef[] = [
      {
        id: 'reporter',
        title: t('reporterInfo'),
        component: ReporterInfo,
        validate: () => isReporterValid(store.getState()),
      },
      { id: 'timeline', title: t('timeline'), component: IncidentTimeline },
      { id: 'classification', title: t('classification'), component: IncidentClassification },
      { id: 'description', title: t('description'), component: IncidentDescription },
      { id: 'systems', title: t('systems'), component: AffectedSystems },
      { id: 'impact', title: t('impact'), component: ImpactAssessment },
      { id: 'measures', title: t('measures'), component: MeasuresTaken },
    ];
    if (personalDataInvolved === 'yes' || personalDataInvolved === 'unknown') {
      base.push({ id: 'gdpr', title: t('gdpr'), component: GdprAssessment });
    }
    base.push({ id: 'summary', title: t('summary'), component: Summary });
    return base;
  }, [t, store, personalDataInvolved]);

  const safeStep = Math.min(currentStep, steps.length - 1);
  const currentStepDef = steps[safeStep]!;
  const StepComponent = currentStepDef.component;
  const isFirst = safeStep === 0;
  const isLast = safeStep === steps.length - 1;

  const goNext = useCallback(() => {
    if (currentStepDef.validate && !currentStepDef.validate()) {
      setValidationError(true);
      return;
    }
    setValidationError(false);
    if (!isLast) {
      setDirection(1);
      setCurrentStep((s) => s + 1);
    }
  }, [currentStepDef, isLast]);

  const goBack = useCallback(() => {
    if (!isFirst) {
      setDirection(-1);
      setCurrentStep((s) => s - 1);
    }
  }, [isFirst]);

  const goToStep = useCallback(
    (i: number) => {
      setDirection(i > safeStep ? 1 : -1);
      setCurrentStep(i);
    },
    [safeStep],
  );

  const goToStepById = useCallback(
    (id: string) => {
      const i = steps.findIndex((s) => s.id === id);
      if (i >= 0) goToStep(i);
    },
    [steps, goToStep],
  );

  const honeypotRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(() => {
    if (canSubmit) void submit(honeypotRef.current?.value ?? '');
  }, [canSubmit, submit]);

  if (submitted && result) {
    return (
      <Confirmation
        result={result}
        onAnother={() => {
          store.getState().reset();
          resetSubmission();
          setCurrentStep(0);
        }}
      />
    );
  }

  if (showWelcome) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <AppHeader
          orgName={orgName}
          logoUrl={logoUrl}
          logoDarkUrl={logoDarkUrl}
          onLogoClick={() => setUserView('welcome')}
        />
        <WelcomePage
          content={welcomeContent}
          onStart={() => {
            setUserView('wizard');
            window.scrollTo(0, 0);
          }}
        />
        <AppFooter content={footerContent} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader
        orgName={orgName}
        logoUrl={logoUrl}
        logoDarkUrl={logoDarkUrl}
        onLogoClick={() => setUserView('welcome')}
      >
        <WizardProgress step={safeStep} total={steps.length} />
      </AppHeader>

      <DraftResumeBanner />

      <StepNav steps={steps} current={safeStep} onSelect={goToStep} />

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-5 py-8">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-brand">
            {tc('step', { current: String(safeStep + 1), total: String(steps.length) })}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-fg">
            {currentStepDef.title}
          </h1>
        </div>

        <form
          className="flex-1"
          aria-label={currentStepDef.title}
          onSubmit={(e) => {
            e.preventDefault();
            if (isLast) handleSubmit();
            else goNext();
          }}
        >
          {/* Honeypot — hidden from humans; a bot that fills it is rejected server-side. */}
          <input
            ref={honeypotRef}
            type="text"
            name="contact_url"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="pointer-events-none absolute left-[-9999px] top-0 h-0 w-0 opacity-0"
            defaultValue=""
          />
          <Card id={`step-panel-${currentStepDef.id}`} className="p-5 sm:p-6">
            <WizardNavProvider value={goToStepById}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={currentStepDef.id}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, x: direction * 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, x: direction * -24 }}
                  transition={
                    reduce ? { duration: 0.12 } : { duration: 0.22, ease: [0.32, 0.72, 0, 1] }
                  }
                >
                  <StepComponent />
                </motion.div>
              </AnimatePresence>
            </WizardNavProvider>
          </Card>

          {error && <div className={errorBox}>{error}</div>}
          {validationError && <div className={errorBox}>{tc('fillRequired')}</div>}
        </form>

        <div className="mt-6 flex items-center justify-between">
          {!isFirst ? (
            <Button variant="secondary" onClick={goBack}>
              <ChevronLeft className="h-4 w-4" /> {tc('back')}
            </Button>
          ) : (
            <div />
          )}

          {isLast ? (
            canSubmit ? (
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? tc('submitting') : tc('submit')} <Send className="h-4 w-4" />
              </Button>
            ) : (
              <span className="text-sm text-danger">{tc('fillRequired')}</span>
            )
          ) : (
            <Button onClick={goNext}>
              {tc('next')} <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </main>

      <AppFooter content={footerContent} />
    </div>
  );
}
