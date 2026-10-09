import type { ZammadConfig } from '@/lib/config/schema';
import {
  buildReportModel,
  formatReportText,
  formatTriageText,
  type ReportModel,
} from '@/lib/report/model';
import type { DeliveryContext, DeliveryResult } from './types';
import { fetchWithTimeout, joinUrl } from './http';

const CHANNEL = 'zammad';

interface ZammadTicketResponse {
  id?: number;
  number?: string;
}

interface ZammadErrorResponse {
  error?: string;
  error_human?: string;
}

export function buildZammadTicket(
  ctx: DeliveryContext,
  config: ZammadConfig,
  model: ReportModel,
): Record<string, unknown> {
  const title = `[${ctx.triage.level}] [${ctx.referenceNumber}] ${model.category || ctx.data.incidentCategory}`;

  const article: Record<string, unknown> = {
    subject: title,
    body: formatReportText(ctx.referenceNumber, model),
    type: 'web',
    // The article is the reporter's statement, not an agent's reply. Left unset,
    // Zammad records the token owner's role (Agent) as the sender, and with it
    // the ticket's create_article_sender that overviews and triggers match on.
    sender: 'Customer',
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

  return {
    title,
    group: config.group,
    priority: config.priorities[ctx.triage.level],
    // A plain `customer: <e-mail>` is only looked up, and an unknown address is
    // rejected with 422. The `guess:` form is the one Zammad resolves by e-mail
    // and creates as a new customer when it does not exist yet. The submission
    // schema guarantees a valid address, so there is no fallback case.
    customer_id: `guess:${ctx.data.email}`,
    article,
  };
}

/** Reads Zammad's error text from a failed response, if it sent one. */
async function errorDetail(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as ZammadErrorResponse;
    return body.error_human ?? body.error ?? '';
  } catch {
    return '';
  }
}

export async function deliverZammad(
  ctx: DeliveryContext,
  config: ZammadConfig,
): Promise<DeliveryResult> {
  try {
    const model = await buildReportModel(ctx.data, ctx.locale);
    const ticket = buildZammadTicket(ctx, config, model);

    const res = await fetchWithTimeout(
      joinUrl(config.baseUrl, '/api/v1/tickets'),
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
      const detail = await errorDetail(res);
      return {
        success: false,
        channel: CHANNEL,
        error: `Ticket creation failed: HTTP ${res.status}${detail ? ` – ${detail}` : ''}`,
      };
    }

    const body = (await res.json()) as ZammadTicketResponse;
    if (!body.id) {
      return { success: false, channel: CHANNEL, error: 'no ticket id returned' };
    }

    // The reasons go into an internal note: agents see them, the customer
    // does not. The ticket already exists, so a failed note is logged rather
    // than reported as a failed delivery.
    let noteFailure: string | undefined;
    try {
      const note = await fetchWithTimeout(
        joinUrl(config.baseUrl, '/api/v1/ticket_articles'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Token token=${config.token}`,
          },
          body: JSON.stringify({
            ticket_id: body.id,
            body: await formatTriageText(ctx.triage, ctx.teamLocale),
            type: 'note',
            sender: 'Agent',
            internal: true,
            content_type: 'text/plain',
          }),
        },
        config.timeoutMs,
      );
      if (!note.ok) noteFailure = `HTTP ${note.status}`;
    } catch (err) {
      noteFailure = err instanceof Error ? err.message : String(err);
    }
    if (noteFailure) {
      console.error(
        `[zammad] ${ctx.referenceNumber}: triage note on ticket ${body.id} failed: ${noteFailure}`,
      );
    }

    return {
      success: true,
      channel: CHANNEL,
      ...(body.number ? { ticketNumber: body.number } : {}),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown Zammad delivery error';
    return { success: false, channel: CHANNEL, error: message };
  }
}
