import type { ZammadConfig } from '@/lib/config/schema';
import { buildReportModel, formatReportText, type ReportModel } from '@/lib/report/model';
import type { DeliveryContext, DeliveryResult } from './types';
import { fetchWithTimeout } from './http';

const CHANNEL = 'zammad';

interface ZammadTicketResponse {
  id?: number;
  number?: string;
  error?: string;
}

export function buildZammadTicket(
  ctx: DeliveryContext,
  config: ZammadConfig,
  model: ReportModel,
): Record<string, unknown> {
  const title = `[${ctx.referenceNumber}] ${model.category || ctx.data.incidentCategory}`;
  // Zammad auto-creates the customer from the e-mail if it does not yet exist.
  const customer = ctx.data.email || config.customerEmailFallback;

  const article: Record<string, unknown> = {
    subject: title,
    body: formatReportText(ctx.referenceNumber, model),
    type: 'web',
    internal: false,
    content_type: 'text/plain',
  };
  if (config.includePdf) {
    article.attachments = [
      {
        filename: `${ctx.referenceNumber}.pdf`,
        data: ctx.pdfBuffer.toString('base64'),
        'mime-type': 'application/pdf',
      },
    ];
  }

  const ticket: Record<string, unknown> = { title, group: config.group, article };
  if (customer) ticket.customer = customer;
  return ticket;
}

export async function deliverZammad(
  ctx: DeliveryContext,
  config: ZammadConfig,
): Promise<DeliveryResult> {
  try {
    const model = await buildReportModel(ctx.data, ctx.locale);
    const ticket = buildZammadTicket(ctx, config, model);

    const res = await fetchWithTimeout(
      `${config.baseUrl}/api/v1/tickets`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token token=${config.token}`,
        },
        body: JSON.stringify(ticket),
      },
      config.timeoutMs,
    );

    if (!res.ok) {
      return {
        success: false,
        channel: CHANNEL,
        error: `Ticket creation failed: HTTP ${res.status}`,
      };
    }

    const body = (await res.json()) as ZammadTicketResponse;
    if (!body.id) {
      return { success: false, channel: CHANNEL, error: body.error ?? 'no ticket id returned' };
    }

    return { success: true, channel: CHANNEL };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown Zammad delivery error';
    return { success: false, channel: CHANNEL, error: message };
  }
}
