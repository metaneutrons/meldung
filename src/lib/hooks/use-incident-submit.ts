'use client';

import { useCallback, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useFormStore } from '@/lib/store/form-store';
import { fetchAndSolveCaptcha } from '@/lib/captcha-client';

export interface SubmitResult {
  referenceNumber: string;
  pdfBase64: string;
  deliveryResults: { success: boolean; channel: string; error?: string }[];
}

/** Encapsulates the submit lifecycle: POST /api/submit, result/error state. */
export function useIncidentSubmit() {
  const locale = useLocale();
  const te = useTranslations('errors');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (honeypot: string) => {
      setSubmitting(true);
      setError(null);
      try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _savedAt, update, reset, clearDraft, ...formData } = useFormStore.getState();
        formData.reportDate = new Date().toISOString();
        // Solve the invisible proof-of-work captcha before submitting.
        const captcha = await fetchAndSolveCaptcha();
        const res = await fetch('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, locale, captcha, honeypot }),
        });
        if (!res.ok) {
          const key =
            res.status === 429
              ? 'rateLimited'
              : res.status === 400
                ? 'verification'
                : res.status === 422
                  ? 'validation'
                  : 'generic';
          setError(te(key));
          return;
        }
        const data = (await res.json()) as SubmitResult;
        setResult(data);
        setSubmitted(true);
        useFormStore.getState().clearDraft();
      } catch {
        setError(te('generic'));
      } finally {
        setSubmitting(false);
      }
    },
    [locale, te],
  );

  const resetSubmission = useCallback(() => {
    setSubmitted(false);
    setResult(null);
  }, []);

  return { submit, submitting, submitted, result, error, resetSubmission };
}
