import { createHmac } from 'crypto';
import type { WebhookConfig } from '@/lib/config/schema';
import { buildReportModel, type ReportModel } from '@/lib/report/model';
import type { DeliveryContext, DeliveryResult } from './types';
import { fetchWithTimeout } from './http';

const CHANNEL = 'webhook';

/** Stable, versioned payload contract. Bump `version` on breaking changes. */
export interface WebhookPayload {
  version: '1';
  event: 'incident.reported';
  referenceNumber: string;
  locale: string;
  submittedAt: string;
  /** Raw form data — stable Zod keys, machine-parseable. */
  data: DeliveryContext['data'];
  /** Localized, human-readable report (titles + labels + values). */
  report: ReportModel;
  /** Base64-encoded PDF, only when `includePdf` is enabled. */
  pdfBase64?: string;
}

export async function buildWebhookPayload(
  ctx: DeliveryContext,
  config: WebhookConfig,
): Promise<WebhookPayload> {
  const report = await buildReportModel(ctx.data, ctx.locale);
  return {
    version: '1',
    event: 'incident.reported',
    referenceNumber: ctx.referenceNumber,
    locale: ctx.locale,
    submittedAt: ctx.submittedAt,
    data: ctx.data,
    report,
    ...(config.includePdf ? { pdfBase64: ctx.pdfBuffer.toString('base64') } : {}),
  };
}

/** Computes the `X-Meldung-Signature` value for a raw body (GitHub-style HMAC). */
export function signBody(secret: string, body: string): string {
  return `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
}

export async function deliverWebhook(
  ctx: DeliveryContext,
  config: WebhookConfig,
): Promise<DeliveryResult> {
  try {
    const payload = await buildWebhookPayload(ctx, config);
    const body = JSON.stringify(payload);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
    if (config.secret) {
      headers['X-Meldung-Signature'] = signBody(config.secret, body);
    }

    const res = await fetchWithTimeout(
      config.url,
      { method: config.method, headers, body },
      config.timeoutMs,
    );

    if (!res.ok) {
      return { success: false, channel: CHANNEL, error: `Webhook failed: HTTP ${res.status}` };
    }
    return { success: true, channel: CHANNEL };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown webhook delivery error';
    return { success: false, channel: CHANNEL, error: message };
  }
}
