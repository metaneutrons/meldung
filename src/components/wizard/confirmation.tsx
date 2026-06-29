'use client';

import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui';
import type { SubmitResult } from '@/lib/hooks/use-incident-submit';

export function Confirmation({
  result,
  onAnother,
}: {
  result: SubmitResult;
  onAnother: () => void;
}) {
  const tConf = useTranslations('confirmation');

  const downloadPdf = () => {
    const blob = new Blob([Uint8Array.from(atob(result.pdfBase64), (c) => c.charCodeAt(0))], {
      type: 'application/pdf',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.referenceNumber}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 text-center shadow-elevated"
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success-bg">
          <CheckCircle2 className="h-7 w-7 text-success" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-fg">{tConf('title')}</h2>
        <div className="mt-4 rounded-xl bg-surface-2 px-4 py-2.5 font-mono text-base font-semibold text-fg">
          {result.referenceNumber}
        </div>
        <div className="mt-6 space-y-3">
          <Button className="w-full" onClick={downloadPdf}>
            {tConf('downloadPdf')}
          </Button>
          <Button variant="secondary" className="w-full" onClick={onAnother}>
            {tConf('submitAnother')}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
