'use client';

import { useMemo, useState, useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Send, Moon, Sun, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useTheme } from '@/components/theme-provider';
import { useFormStore } from '@/lib/store/form-store';
import { DraftResumeBanner } from '@/components/draft-resume-banner';
import { WelcomePage } from '@/components/welcome-page';
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
import type { Locale } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { Link, useRouter, usePathname } from '@/i18n/navigation';

interface StepDef {
  id: string;
  title: string;
  component: React.ComponentType;
  validate?: () => boolean;
}

interface IncidentFormProps {
  orgName: string;
  logoUrl?: string;
  welcomeContent: string;
  footerContent: string;
}

const focusRing = 'focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2';

export function IncidentForm({ orgName, logoUrl, welcomeContent, footerContent }: IncidentFormProps) {
  const t = useTranslations('wizard');
  const tc = useTranslations('common');
  const th = useTranslations('header');
  const tConf = useTranslations('confirmation');
  const { theme, toggle } = useTheme();
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const store = useFormStore;
  const personalDataInvolved = useFormStore((s) => s.personalDataInvolved);

  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    referenceNumber: string;
    pdfBase64: string;
    deliveryResults: { success: boolean; channel: string; error?: string }[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(() => {
    if (typeof window === 'undefined') return true;
    const state = store.getState();
    return !(state._savedAt && (state.reporterName || state.description));
  });
  const stepNavRef = useRef<HTMLDivElement>(null);

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // Warn before closing if form has unsaved data
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (submitted || showWelcome) return;
      const s = store.getState();
      if (s.reporterName || s.description) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [submitted, showWelcome, store]);

  const steps: StepDef[] = useMemo(() => {
    const base: StepDef[] = [
      { id: 'reporter', title: t('reporterInfo'), component: ReporterInfo, validate: () => { const s = store.getState(); return s.reporterName.trim() !== '' && s.contact.trim() !== ''; } },
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
  const progress = ((safeStep + 1) / steps.length) * 100;

  // Auto-scroll step nav to active step
  useEffect(() => {
    const nav = stepNavRef.current;
    if (!nav) return;
    const btn = nav.querySelector(`[data-step="${safeStep}"]`) as HTMLElement | null;
    if (btn) {
      btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [safeStep]);

  const goNext = useCallback(() => {
    if (currentStepDef.validate && !currentStepDef.validate()) return;
    if (!isLast) { setDirection(1); setCurrentStep((s) => s + 1); }
  }, [currentStepDef, isLast]);

  const goBack = useCallback(() => {
    if (!isFirst) { setDirection(-1); setCurrentStep((s) => s - 1); }
  }, [isFirst]);

  const doSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const { _savedAt, update, reset, clearDraft, ...formData } = store.getState();
      void _savedAt; void update; void reset; void clearDraft;
      formData.reportDate = new Date().toISOString();
      const res = await fetch('/api/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setResult(data);
      setSubmitted(true);
      store.getState().clearDraft();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (currentStepDef.validate && !currentStepDef.validate()) return;
    await doSubmit();
  };


  // Confirmation
  if (submitted && result) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6 dark:bg-gray-950">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-2xl dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
            <CheckCircle2 className="h-7 w-7 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{tConf('title')}</h2>
          <div className="mt-4 rounded-lg bg-gray-100 px-4 py-2.5 font-mono text-base font-semibold text-gray-900 dark:bg-gray-800 dark:text-gray-100">{result.referenceNumber}</div>
          <div className="mt-6 space-y-3">
            <button onClick={() => { const blob = new Blob([Uint8Array.from(atob(result.pdfBase64), (c) => c.charCodeAt(0))], { type: 'application/pdf' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${result.referenceNumber}.pdf`; a.click(); URL.revokeObjectURL(url); }} className="w-full rounded-lg bg-[var(--brand-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90 active:scale-[0.98]">{tConf('downloadPdf')}</button>
            <button onClick={() => { store.getState().reset(); setSubmitted(false); setResult(null); setCurrentStep(0); }} className="w-full rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">{tConf('submitAnother')}</button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Welcome page
  if (showWelcome) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
        <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/90">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
            <button type="button" onClick={() => setShowWelcome(true)} className="flex items-center gap-2.5">
              {logoUrl ? (
                <img src={logoUrl} alt={orgName} className="h-7 w-auto" />
              ) : (
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{orgName}</span>
              )}
            </button>
            <div className="flex items-center gap-1.5">
              {(['de', 'en', 'es', 'fr', 'tr', 'it'] as const).map((loc) => (
                <button key={loc} type="button" onClick={() => router.replace(pathname, { locale: loc })} className={`rounded-md px-2 py-1 text-xs font-semibold transition ${focusRing} ${loc === locale ? 'bg-[var(--brand-primary)] text-white' : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`} aria-label={loc.toUpperCase()}>{loc.toUpperCase()}</button>
              ))}
              <span className="mx-1.5 h-4 w-px bg-gray-200 dark:bg-gray-700" />
              <button type="button" onClick={toggle} aria-label={mounted && theme === 'dark' ? th('lightMode') : th('darkMode')} className={`rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200 ${focusRing}`}>
                {mounted && (theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />)}
              </button>
            </div>
          </div>
        </header>
        <WelcomePage content={welcomeContent} onStart={() => { setShowWelcome(false); window.scrollTo(0, 0); }} />
        {footerContent && (
          <footer className="mt-auto border-t border-gray-200 bg-white/80 py-3 text-center text-xs text-gray-500 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/80 dark:text-gray-400">
            <ReactMarkdown
              components={{
                p: ({ children }) => <span>{children}</span>,
                a: ({ children, href }) => {
                  if (href?.startsWith('/')) {
                    return <Link href={href} className="text-[var(--brand-primary)] hover:underline">{children}</Link>;
                  }
                  return <a href={href} target="_blank" rel="noopener noreferrer" className="text-[var(--brand-primary)] hover:underline">{children}</a>;
                },
              }}
            >
              {footerContent}
            </ReactMarkdown>
          </footer>
        )}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/90">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <button type="button" onClick={() => setShowWelcome(true)} className="flex items-center gap-2.5">
              {logoUrl ? (
                <img src={logoUrl} alt={orgName} className="h-7 w-auto" />
              ) : (
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{orgName}</span>
              )}
            </button>
          <div className="flex items-center gap-1.5">
            {(['de', 'en', 'es', 'fr', 'tr', 'it'] as const).map((loc) => (
              <button key={loc} type="button" onClick={() => router.replace(pathname, { locale: loc })} className={`rounded-md px-2 py-1 text-xs font-semibold transition ${focusRing} ${loc === locale ? 'bg-[var(--brand-primary)] text-white' : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`} aria-label={loc.toUpperCase()}>{loc.toUpperCase()}</button>
            ))}
            <span className="mx-1.5 h-4 w-px bg-gray-200 dark:bg-gray-700" />
            <button type="button" onClick={toggle} aria-label={mounted && theme === 'dark' ? th('lightMode') : th('darkMode')} className={`rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200 ${focusRing}`}>
              {mounted && (theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />)}
            </button>
          </div>
        </div>
        {/* Progress */}
        <div className="h-1 bg-gray-100 dark:bg-gray-800" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label={tc('step', { current: String(safeStep + 1), total: String(steps.length) })}>
          <motion.div className="h-full rounded-r-full bg-[var(--brand-primary)]" animate={{ width: `${progress}%` }} transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }} />
        </div>
      </header>

      <DraftResumeBanner />

      {/* Step navigation - desktop */}
      <nav className="hidden border-b border-gray-200 bg-white pt-2 dark:border-gray-800 dark:bg-gray-900 md:block" role="tablist" aria-label={t('stepNavigation')}>
        <div ref={stepNavRef} className="scrollbar-none mx-auto flex max-w-5xl items-center gap-0 overflow-x-auto px-4">
          {steps.map((step, i) => (
            <button
              key={step.id}
              type="button"
              role="tab"
              aria-selected={i === safeStep}
              aria-controls={`step-panel-${step.id}`}
              data-step={i}
              onClick={() => { setDirection(i > safeStep ? 1 : -1); setCurrentStep(i); }}
              className={`relative shrink-0 px-4 py-3 text-center text-xs font-medium transition ${focusRing} ${
                i === safeStep
                  ? 'text-[var(--brand-primary)]'
                  : i < safeStep
                    ? 'text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100'
                    : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400'
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  i === safeStep
                    ? 'bg-[var(--brand-primary)] text-white'
                    : i < safeStep
                      ? 'bg-gray-300 text-gray-700 dark:bg-gray-600 dark:text-gray-200'
                      : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                }`}>{i + 1}</span>
                {step.title}
              </span>
              {i === safeStep && (
                <motion.div layoutId="stepIndicator" className="absolute inset-x-0 bottom-0 h-0.5 bg-[var(--brand-primary)]" transition={{ duration: 0.3 }} />
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-5 py-8">
        {/* Step label */}
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--brand-primary)]">
            {tc('step', { current: String(safeStep + 1), total: String(steps.length) })}
          </p>
          <h1 className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100 sm:text-2xl">{currentStepDef.title}</h1>
        </div>

        {/* Step card */}
        <form className="flex-1" aria-label={currentStepDef.title} onSubmit={(e) => { e.preventDefault(); isLast ? handleSubmit() : goNext(); }}>
          <div id={`step-panel-${currentStepDef.id}`} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentStepDef.id}
                initial={{ opacity: 0, x: direction * 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -30 }}
                transition={{ duration: 0.2 }}
              >
                <StepComponent />
              </motion.div>
            </AnimatePresence>
          </div>

          {error && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">{error}</div>
          )}
        </form>

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between">
          {!isFirst ? (
            <button type="button" onClick={goBack} className={`flex items-center gap-1.5 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 ${focusRing}`}>
              <ChevronLeft className="h-4 w-4" /> {tc('back')}
            </button>
          ) : <div />}

          {isLast ? (
            <button type="button" onClick={handleSubmit} disabled={submitting} className={`flex items-center gap-2 rounded-lg bg-[var(--brand-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50 ${focusRing}`}>
              {submitting ? tc('submitting') : tc('submit')} <Send className="h-4 w-4" />
            </button>
          ) : (
            <button type="button" onClick={goNext} className={`flex items-center gap-1.5 rounded-lg bg-[var(--brand-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90 active:scale-[0.98] ${focusRing}`}>
              {tc('next')} <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </main>

      {footerContent && (
        <footer className="mt-auto border-t border-gray-200 bg-white/80 py-3 text-center text-xs text-gray-500 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/80 dark:text-gray-400">
          <ReactMarkdown
            components={{
              p: ({ children }) => <span>{children}</span>,
              a: ({ children, href }) => {
                if (href?.startsWith('/')) {
                  return <Link href={href} className="text-[var(--brand-primary)] hover:underline">{children}</Link>;
                }
                return <a href={href} target="_blank" rel="noopener noreferrer" className="text-[var(--brand-primary)] hover:underline">{children}</a>;
              },
            }}
          >
            {footerContent}
          </ReactMarkdown>
        </footer>
      )}
    </div>
  );
}
