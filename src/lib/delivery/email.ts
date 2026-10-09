import nodemailer from 'nodemailer';
import type { SmtpConfig } from '@/lib/config/schema';
import {
  buildConfirmationMail,
  buildReportModel,
  formatReportText,
  formatTriageText,
} from '@/lib/report/model';
import type { DeliveryContext, DeliveryResult } from './types';

function transport(smtp: SmtpConfig) {
  return nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: { user: smtp.user, pass: smtp.pass },
  });
}

export async function deliverEmail(
  ctx: DeliveryContext,
  smtp: SmtpConfig,
): Promise<DeliveryResult> {
  try {
    const model = await buildReportModel(ctx.data, ctx.locale);
    await transport(smtp).sendMail({
      from: smtp.from,
      to: smtp.recipients,
      // The level leads the subject so the team can sort the inbox by it.
      subject: `[${ctx.triage.level} · ${ctx.referenceNumber}] ${model.title}`,
      text: `${await formatTriageText(ctx.triage, ctx.teamLocale)}\n\n${formatReportText(ctx.referenceNumber, model)}`,
      attachments: [{ filename: `${ctx.referenceNumber}.pdf`, content: ctx.pdfBuffer }],
    });
    return { success: true, channel: 'email' };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown email delivery error';
    return { success: false, channel: 'email', error: message };
  }
}

export async function sendConfirmationEmail(
  ctx: DeliveryContext,
  smtp: SmtpConfig,
  reporterEmail: string,
  orgName: string,
  ticketNumbers: readonly string[] = [],
): Promise<DeliveryResult> {
  try {
    const mail = await buildConfirmationMail(
      ctx.referenceNumber,
      ctx.locale,
      { name: ctx.data.reporterName, orgName },
      ticketNumbers,
    );
    await transport(smtp).sendMail({
      from: smtp.from,
      to: reporterEmail,
      subject: mail.subject,
      text: mail.text,
    });
    return { success: true, channel: 'email-confirmation' };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown email delivery error';
    return { success: false, channel: 'email-confirmation', error: message };
  }
}
