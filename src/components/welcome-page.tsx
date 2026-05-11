'use client';

import ReactMarkdown from 'react-markdown';
import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface WelcomePageProps {
  content: string;
  onStart: () => void;
}

export function WelcomePage({ content, onStart }: WelcomePageProps) {
  const tc = useTranslations('common');

  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <article className="max-w-none">
        <ReactMarkdown
          components={{
            h1: ({ children }) => <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-100">{children}</h1>,
            h2: ({ children }) => <h2 className="mb-3 mt-8 text-lg font-bold text-gray-900 dark:text-gray-100">{children}</h2>,
            p: ({ children }) => <p className="mb-4 text-gray-600 dark:text-gray-400">{children}</p>,
            ul: ({ children }) => <ul className="mb-4 space-y-2 pl-6" style={{ listStyleType: 'disc' }}>{children}</ul>,
            ol: ({ children }) => <ol className="mb-4 space-y-2 pl-6" style={{ listStyleType: 'decimal' }}>{children}</ol>,
            li: ({ children }) => <li style={{ display: 'list-item', color: 'var(--brand-primary)' }}><span className="text-gray-600 dark:text-gray-400">{children}</span></li>,
            strong: ({ children }) => <strong className="font-semibold text-gray-900 dark:text-gray-100">{children}</strong>,
            a: ({ children, href }) => <a href={href} className="text-[var(--brand-primary)] underline">{children}</a>,
          }}
        >
          {content}
        </ReactMarkdown>
      </article>
      <div className="mt-8 flex justify-end">
        <button
          type="button"
          onClick={onStart}
          className="flex items-center gap-2 rounded-lg bg-[var(--brand-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90 active:scale-[0.98]"
        >
          {tc('startReport')}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
