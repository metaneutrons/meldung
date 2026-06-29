'use client';

import ReactMarkdown from 'react-markdown';
import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui';

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
            h1: ({ children }) => (
              <h1 className="mb-4 text-3xl font-semibold tracking-tight text-fg">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="mb-3 mt-8 text-lg font-semibold tracking-tight text-fg">{children}</h2>
            ),
            p: ({ children }) => <p className="mb-4 leading-relaxed text-fg-muted">{children}</p>,
            ul: ({ children }) => (
              <ul className="mb-4 space-y-2 pl-6" style={{ listStyleType: 'disc' }}>
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="mb-4 space-y-2 pl-6" style={{ listStyleType: 'decimal' }}>
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li style={{ display: 'list-item', color: 'var(--brand)' }}>
                <span className="text-fg-muted">{children}</span>
              </li>
            ),
            strong: ({ children }) => <strong className="font-semibold text-fg">{children}</strong>,
            a: ({ children, href }) => (
              <a href={href} className="text-brand underline">
                {children}
              </a>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </article>
      <div className="mt-8 flex justify-end">
        <Button onClick={onStart}>
          {tc('startReport')}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
