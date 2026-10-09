import { describe, it, expect, vi } from 'vitest';
import { createHmac } from 'crypto';
import type { DeliveryContext } from './types';
import type { WebhookConfig, ZammadConfig, OtrsTicketConfig } from '@/lib/config/schema';
import type { ReportModel } from '@/lib/report/model';

// buildReportModel needs the next-intl request scope, which isn't available in a
// unit test — stub the report layer so the channels can be exercised in isolation.
vi.mock('@/lib/report/model', () => ({
  buildReportModel: vi.fn(async (): Promise<ReportModel> => ({
    title: 'Incident Report',
    category: 'Phishing',
    meta: { reference: 'INC', generated: 'now', page: 'page' },
    sections: [{ title: 'Section', fields: [{ label: 'Label', value: 'Value' }] }],
  })),
  formatReportText: vi.fn(() => 'PLAINTEXT BODY'),
  formatTriageText: vi.fn(async () => 'TRIAGE NOTE'),
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
  triage: {
    level: 'P2',
    reasons: ['attackOrBreach', 'personalData'],
    orientation72h: '2026-07-03T00:00:00.000Z',
    version: 1,
  },
  teamLocale: 'de',
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
    expect(p.triage).toEqual(ctx.triage);
    expect(p.pdfBase64).toBeUndefined();
  });

  it('includes the PDF as base64 when includePdf is set', async () => {
    const p = await buildWebhookPayload(ctx, { ...config, includePdf: true });
    expect(p.pdfBase64).toBe(Buffer.from('PDFDATA').toString('base64'));
  });

  it('signs the body with HMAC-SHA256 when a secret is configured', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okJson({}));
    global.fetch = fetchMock;

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
    global.fetch = fetchMock;

    await deliverWebhook(ctx, config);
    const headers = callOf(fetchMock).init.headers as Record<string, string>;
    expect(headers['X-Meldung-Signature']).toBeUndefined();
  });

  it('reports failure on a non-2xx response', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 503 });
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
    priorities: { P1: '3 high', P2: '3 high', P3: '2 normal', P4: '1 low' },
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
      title: '[P2] [INC-20260630-aaaa] Phishing',
      group: 'IT-Security',
      priority: '3 high',
      customer_id: 'guess:reporter@example.de',
    });
    expect(ticket).not.toHaveProperty('customer');
    const article = ticket.article as Record<string, unknown>;
    expect(article).toMatchObject({ type: 'web', sender: 'Customer', internal: false });
    const attachments = article.attachments as Record<string, unknown>[];
    expect(attachments[0]).toMatchObject({
      filename: 'INC-20260630-aaaa.pdf',
      'mime-type': 'application/pdf',
    });
  });

  it('sends a token-authenticated POST and succeeds on a returned id', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okJson({ id: 42, number: '67001' }));
    global.fetch = fetchMock;

    const res = await deliverZammad(ctx, config);
    expect(res).toEqual({ success: true, channel: 'zammad', ticketNumber: '67001' });

    const { url, init } = callOf(fetchMock);
    expect(url).toBe('https://zammad.example.com/api/v1/tickets');
    expect((init.headers as Record<string, string>).Authorization).toBe('Token token=tok');
  });

  it('adds the triage reasons as an internal note on the new ticket', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okJson({ id: 42, number: '67001' }));
    global.fetch = fetchMock;
    await deliverZammad(ctx, config);
    const [url, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(url).toBe('https://zammad.example.com/api/v1/ticket_articles');
    expect(JSON.parse(init.body as string)).toEqual({
      ticket_id: 42,
      body: 'TRIAGE NOTE',
      type: 'note',
      sender: 'Agent',
      internal: true,
      content_type: 'text/plain',
    });
  });

  it('still counts the ticket as delivered when the note fails', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(okJson({ id: 42, number: '67001' }))
      .mockResolvedValueOnce({ ok: false, status: 403, json: async () => ({}) });
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(await deliverZammad(ctx, config)).toEqual({
      success: true,
      channel: 'zammad',
      ticketNumber: '67001',
    });
    expect(error).toHaveBeenCalledWith(
      expect.stringContaining('triage note on ticket 42 failed: HTTP 403'),
    );
    error.mockRestore();
  });

  it('does not double the slash when baseUrl ends with one', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okJson({ id: 42 }));
    global.fetch = fetchMock;
    await deliverZammad(ctx, { ...config, baseUrl: 'https://zammad.example.com/' });
    expect(callOf(fetchMock).url).toBe('https://zammad.example.com/api/v1/tickets');
  });

  it("surfaces Zammad's error text on a rejected request", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ error: 'No lookup value found for \'group\': "Nope"' }),
    });
    const res = await deliverZammad(ctx, config);
    expect(res).toEqual({
      success: false,
      channel: 'zammad',
      error: `Ticket creation failed: HTTP 422 – No lookup value found for 'group': "Nope"`,
    });
  });

  it('keeps the status when the error body is not JSON', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => {
        throw new SyntaxError('Unexpected token <');
      },
    });
    const res = await deliverZammad(ctx, config);
    expect(res).toMatchObject({ success: false, error: 'Ticket creation failed: HTTP 502' });
  });

  it('fails when no ticket id is returned', async () => {
    global.fetch = vi.fn().mockResolvedValue(okJson({}));
    const res = await deliverZammad(ctx, config);
    expect(res).toMatchObject({
      success: false,
      channel: 'zammad',
      error: 'no ticket id returned',
    });
  });
});

describe('otrs channels (znuny + otobo)', () => {
  const config: OtrsTicketConfig = {
    baseUrl: 'https://otrs.example.com/rest',
    username: 'u',
    password: 'p',
    queue: 'Security',
    priorities: { P1: '5 very high', P2: '4 high', P3: '3 normal', P4: '2 low' },
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

  const ticketPayload = (mock: ReturnType<typeof vi.fn>) =>
    JSON.parse((mock.mock.calls[1]?.[1] as RequestInit).body as string) as {
      Ticket: Record<string, string>;
      Article: Record<string, string>;
    };

  it('maps the triage level to a priority and leads with the reasons', async () => {
    mockOk();
    await deliverZnuny(ctx, config);
    const payload = ticketPayload(global.fetch as unknown as ReturnType<typeof vi.fn>);
    expect(payload.Ticket.Priority).toBe('4 high');
    expect(payload.Ticket.Title).toBe('[P2] [INC-20260630-aaaa] Phishing');
    expect(payload.Article.Body).toBe('TRIAGE NOTE\n\nPLAINTEXT BODY');
  });

  it('keeps a fixed priority when one is configured', async () => {
    mockOk();
    await deliverZnuny(ctx, { ...config, priority: '3 normal' });
    const payload = ticketPayload(global.fetch as unknown as ReturnType<typeof vi.fn>);
    expect(payload.Ticket.Priority).toBe('3 normal');
  });

  it('labels results with the znuny channel', async () => {
    mockOk();
    expect(await deliverZnuny(ctx, config)).toEqual({
      success: true,
      channel: 'znuny',
      ticketNumber: '2026063000001',
    });
  });

  it('reuses the same connector for otobo', async () => {
    mockOk();
    expect(await deliverOtobo(ctx, config)).toEqual({
      success: true,
      channel: 'otobo',
      ticketNumber: '2026063000001',
    });
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
      );
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
    });
    await expect(fetchWithTimeout('https://x.example', { method: 'GET' }, 5000)).rejects.toThrow(
      /timed out/,
    );
  });
});
