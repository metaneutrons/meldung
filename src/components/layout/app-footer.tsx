'use client';

import ReactMarkdown from 'react-markdown';
import { Link } from '@/i18n/navigation';

export function AppFooter({ content }: { content: string }) {
  if (!content) return null;

  return (
    <footer className="mt-auto border-t border-border bg-surface/70 py-3 text-center text-xs text-fg-subtle backdrop-blur-sm">
      <ReactMarkdown
        components={{
          p: ({ children }) => <span>{children}</span>,
          a: ({ children, href }) =>
            href?.startsWith('/') ? (
              <Link href={href} className="text-brand hover:underline">
                {children}
              </Link>
            ) : (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand hover:underline"
              >
                {children}
              </a>
            ),
        }}
      >
        {content}
      </ReactMarkdown>
    </footer>
  );
}
