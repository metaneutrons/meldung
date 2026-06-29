import { describe, it, expect, vi } from 'vitest';
import { createHmac } from 'crypto';
import type { DeliveryContext } from './types';
import type { WebhookConfig, ZammadConfig, OtrsTicketConfig } from '@/lib/config/schema';
import type { ReportModel } from '@/lib/report/model';

// buildReportModel needs the next-intl request scope, which isn't available in a
// unit test — stub the report layer so the channels can be exercised in isolation.
vi.mock('@/lib/report/model', () => ({
  buildReportModel: vi.fn(
    async (): Promise<ReportModel> => ({
      title: 'Incident Report',
      category: 'Phishing',
      meta: { reference: 'INC', generated: 'now', page: 'page' },
      sections: [{ title: 'Section', fields: [{ label: 'Label', value: 'Value' }] }],
    }),
  ),
  formatReportText: vi.fn(() => 'PLAINTEXT BODY'),
}));

import { buildWebhookPayload, deliverWebhook } from './webhook';
import { buildZammadTicket, deliverZammad } from './zammad';
import { deliverZnuny, deliverOtobo } from './otrs';
import { fetchWithTimeout } from './http';

const ctx: DeliveryContext = {
  data: {
    email: 'reporter@example.de',
    reporterName: 'Tester',
    incidentCategory: 'phishing',
  } as unknown as DeliveryContext['data'],
  referenceNumber: 'INC-20260630-aaaa',
  pdfBuffer: Buffer.from('PDFDATA'),
  locale: 'de',
  submittedAt: '2026-06-30T00:00:00.000Z',
};

const okJson = (body: unknown): Response =>
  ({ ok: true, status: 200, json: async () => body }) as unknown as Response;

const callOf = (mock: ReturnType<typeof vi.fn>) => ({
  url: (mock.mock.calls[0]?.[0] ?? '') as string,
  init: (mock.mock.calls[0]?.[1] ?? {}) as RequestInit,
});

describe('webhook channel', () => {
  const config: WebhookConfig = {
    url: 'https://hooks.example.com/incident',
    method: 'POST',
    includePdf: false,
    timeoutMs: 10000,
  };

  it('builds a stable, versioned payload', async () => {
    const p = await buildWebhookPayload(ctx, config);
    expect(p).toMatchObject({
      version: '1',
      event: 'incident.reported',
      referenceNumber: 'INC-20260630-aaaa',
      locale: 'de',
      submittedAt: '2026-06-30T00:00:00.000Z',
    });
    expect(p.report.category).toBe('Phishing');
    expect(p.pdfBase64).toBeUndefined();
  });

  it('includes the PDF as base64 when includePdf is set', async () => {
    const p = await buildWebhookPayload(ctx, { ...config, includePdf: true });
    expect(p.pdfBase64).toBe(Buffer.from('PDFDATA').toString('base64'));
  });

  it('signs the body with HMAC-SHA256 when a secret is configured', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okJson({}));
    global.fetch = fetchMock as unknown as typeof fetch;

    const res = await deliverWebhook(ctx, { ...config, secret: 's3cr3t' });
    expect(res).toEqual({ success: true, channel: 'webhook' });

    const { init } = callOf(fetchMock);
    const body = init.body as string;
    const headers = init.headers as Record<string, string>;
    const expected = `sha256=${createHmac('sha256', 's3cr3t').update(body).digest('hex')}`;
    expect(headers['X-Meldung-Signature']).toBe(expected);
  });

  it('omits the signature header when no secret is configured', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okJson({}));
    global.fetch = fetchMock as unknown as typeof fetch;

    await deliverWebhook(ctx, config);
    const headers = callOf(fetchMock).init.headers as Record<string, string>;
    expect(headers['X-Meldung-Signature']).toBeUndefined();
  });

  it('reports failure on a non-2xx response', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 503 }) as unknown as typeof fetch;
    const res = await deliverWebhook(ctx, config);
    expect(res).toMatchObject({ success: false, channel: 'webhook' });
    expect(res.error).toContain('503');
  });
});

describe('zammad channel', () => {
  const config: ZammadConfig = {
    baseUrl: 'https://zammad.example.com',
    token: 'tok',
    group: 'IT-Security',
    includePdf: true,
    timeoutMs: 10000,
  };

  const model: ReportModel = {
    title: 'T',
    category: 'Phishing',
    meta: { reference: '', generated: '', page: '' },
    sections: [],
  };

  it('builds a ticket with the report article and a PDF attachment', () => {
    const ticket = buildZammadTicket(ctx, config, model);
    expect(ticket).toMatchObject({
      title: '[INC-20260630-aaaa] Phishing',
      group: 'IT-Security',
      customer: 'reporter@example.de',
    });
    const article = ticket.article as Record<string, unknown>;
    const attachments = article.attachments as Array<Record<string, unknown>>;
    expect(attachments[0]).toMatchObject({
      filename: 'INC-20260630-aaaa.pdf',
      'mime-type': 'application/pdf',
    });
  });

  it('falls back to customerEmailFallback when the reporter gave no e-mail', () => {
    const noEmailCtx = { ...ctx, data: { ...ctx.data, email: '' } } as DeliveryContext;
    const ticket = buildZammadTicket(
      noEmailCtx,
      { ...config, customerEmailFallback: 'cert@x.de' },
      model,
    );
    expect(ticket.customer).toBe('cert@x.de');
  });

  it('sends a token-authenticated POST and succeeds on a returned id', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okJson({ id: 42, number: '67001' }));
    global.fetch = fetchMock as unknown as typeof fetch;

    const res = await deliverZammad(ctx, config);
    expect(res).toEqual({ success: true, channel: 'zammad' });

    const { url, init } = callOf(fetchMock);
    expect(url).toBe('https://zammad.example.com/api/v1/tickets');
    expect((init.headers as Record<string, string>).Authorization).toBe('Token token=tok');
  });

  it('fails when no ticket id is returned', async () => {
    global.fetch = vi.fn().mockResolvedValue(okJson({ error: 'nope' })) as unknown as typeof fetch;
    const res = await deliverZammad(ctx, config);
    expect(res).toMatchObject({ success: false, channel: 'zammad', error: 'nope' });
  });
});

describe('otrs channels (znuny + otobo)', () => {
  const config: OtrsTicketConfig = {
    baseUrl: 'https://otrs.example.com/rest',
    username: 'u',
    password: 'p',
    queue: 'Security',
    priority: '3 normal',
    state: 'new',
    mappingMode: 'minimal',
    timeoutMs: 10000,
  };

  const mockOk = () =>
    (global.fetch = vi
      .fn()
      .mockImplementation((url: string) =>
        Promise.resolve(
          url.endsWith('/Session')
            ? okJson({ SessionID: 'sess' })
            : okJson({ TicketID: '123', TicketNumber: '2026063000001' }),
        ),
      ) as unknown as typeof fetch);

  it('labels results with the znuny channel', async () => {
    mockOk();
    expect(await deliverZnuny(ctx, config)).toEqual({ success: true, channel: 'znuny' });
  });

  it('reuses the same connector for otobo', async () => {
    mockOk();
    expect(await deliverOtobo(ctx, config)).toEqual({ success: true, channel: 'otobo' });
  });

  it('surfaces an OTRS error payload', async () => {
    global.fetch = vi
      .fn()
      .mockImplementation((url: string) =>
        Promise.resolve(
          url.endsWith('/Session')
            ? okJson({ SessionID: 'sess' })
            : okJson({ Error: { ErrorCode: 'X', ErrorMessage: 'bad queue' } }),
        ),
      ) as unknown as typeof fetch;
    const res = await deliverOtobo(ctx, config);
    expect(res).toMatchObject({ success: false, channel: 'otobo' });
    expect(res.error).toContain('bad queue');
  });
});

describe('fetchWithTimeout', () => {
  it('maps an aborted request to a timeout error', async () => {
    global.fetch = vi.fn().mockImplementation(() => {
      const err = new Error('aborted');
      err.name = 'AbortError';
      return Promise.reject(err);
    }) as unknown as typeof fetch;
    await expect(fetchWithTimeout('https://x.example', { method: 'GET' }, 5000)).rejects.toThrow(
      /timed out/,
    );
  });
});
