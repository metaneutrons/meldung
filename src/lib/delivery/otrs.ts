import type { OtrsTicketConfig } from '@/lib/config/schema';
import { buildReportModel, formatReportText, type ReportModel } from '@/lib/report/model';
import type { DeliveryContext, DeliveryResult } from './types';
import { fetchWithTimeout } from './http';

interface OtrsSessionResponse {
  SessionID?: string;
  Error?: { ErrorCode: string; ErrorMessage: string };
}

interface OtrsTicketResponse {
  TicketID?: string;
  TicketNumber?: string;
  Error?: { ErrorCode: string; ErrorMessage: string };
}

async function authenticate(config: OtrsTicketConfig): Promise<string> {
  const res = await fetchWithTimeout(
    `${config.baseUrl}/Session`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ UserLogin: config.username, Password: config.password }),
    },
    config.timeoutMs,
  );

  if (!res.ok) {
    throw new Error(`Authentication failed: HTTP ${res.status}`);
  }

  const body = (await res.json()) as OtrsSessionResponse;
  if (body.Error ?? !body.SessionID) {
    throw new Error(
      `Authentication failed: ${body.Error?.ErrorMessage ?? 'no SessionID returned'}`,
    );
  }

  return body.SessionID;
}

function buildPayload(ctx: DeliveryContext, config: OtrsTicketConfig, model: ReportModel) {
  const title = `[${ctx.referenceNumber}] ${model.category || ctx.data.incidentCategory}`;
  const ticket = {
    Title: title,
    Queue: config.queue,
    State: config.state,
    Priority: config.priority,
    CustomerUser: ctx.data.email || ctx.data.reporterName,
  };

  const baseArticle = {
    Subject: title,
    ContentType: 'text/plain; charset=utf-8',
    SenderType: 'customer' as const,
    IsVisibleForCustomer: '1' as const,
  };

  if (config.mappingMode === 'json-attachment') {
    const jsonContent = Buffer.from(JSON.stringify(ctx.data, null, 2)).toString('base64');
    return {
      Ticket: ticket,
      Article: {
        ...baseArticle,
        Body: `Incident report ${ctx.referenceNumber} — see attached JSON for full data.`,
      },
      Attachment: [
        {
          Content: jsonContent,
          ContentType: 'application/json',
          Filename: 'incident-data.json',
        },
      ],
    };
  }

  const payload: Record<string, unknown> = {
    Ticket: ticket,
    Article: { ...baseArticle, Body: formatReportText(ctx.referenceNumber, model) },
  };

  if (config.mappingMode === 'rich' && config.fieldMappings) {
    const dynamicFields: { Name: string; Value: string }[] = [];
    for (const [formField, otrsField] of Object.entries(config.fieldMappings)) {
      const value = (ctx.data as Record<string, unknown>)[formField];
      if (value != null) {
        dynamicFields.push({
          Name: otrsField,
          Value: Array.isArray(value) ? value.join(', ') : String(value),
        });
      }
    }
    payload['DynamicField'] = dynamicFields;
  }

  return payload;
}

/**
 * Delivers to an OTRS-compatible ticket system via its GenericInterface REST
 * connector. Znuny and OTOBO share this code path — see {@link deliverZnuny} /
 * {@link deliverOtobo}. The `channel` label flows into the DeliveryResult and the
 * audit trail.
 */
async function deliverOtrs(
  ctx: DeliveryContext,
  config: OtrsTicketConfig,
  channel: string,
): Promise<DeliveryResult> {
  try {
    const sessionId = await authenticate(config);
    const model = await buildReportModel(ctx.data, ctx.locale);
    const payload = buildPayload(ctx, config, model);

    const res = await fetchWithTimeout(
      `${config.baseUrl}/Ticket?SessionID=${encodeURIComponent(sessionId)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      config.timeoutMs,
    );

    if (!res.ok) {
      return {
        success: false,
        channel,
        error: `Ticket creation failed: HTTP ${res.status}`,
      };
    }

    const body = (await res.json()) as OtrsTicketResponse;
    if (body.Error ?? !body.TicketID) {
      return {
        success: false,
        channel,
        error: `Ticket creation failed: ${body.Error?.ErrorMessage ?? 'no TicketID returned'}`,
      };
    }

    return { success: true, channel };
  } catch (err) {
    const message = err instanceof Error ? err.message : `Unknown ${channel} delivery error`;
    return { success: false, channel, error: message };
  }
}

export const deliverZnuny = (ctx: DeliveryContext, config: OtrsTicketConfig) =>
  deliverOtrs(ctx, config, 'znuny');

export const deliverOtobo = (ctx: DeliveryContext, config: OtrsTicketConfig) =>
  deliverOtrs(ctx, config, 'otobo');
