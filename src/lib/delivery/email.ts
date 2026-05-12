import nodemailer from 'nodemailer';
import type { SmtpConfig } from '@/lib/config/schema';
import type { DeliveryContext, DeliveryResult } from './types';

function buildIncidentBody(ctx: DeliveryContext): string {
  const { data, referenceNumber } = ctx;
  return [
    `Reference: ${referenceNumber}`,
    `Date: ${data.reportDate}`,
    '',
    '--- Reporter ---',
    `Name: ${data.reporterName}`,
    `Department: ${data.department}`,
    `Role: ${data.role}`,
    `Email: ${data.email}`,
    `Phone: ${data.phone}`,
    '',
    '--- Timeline ---',
    `Discovery: ${data.discoveryDate}`,
    `Occurrence: ${data.occurrenceDate}`,
    `Ongoing: ${data.isOngoing}`,
    '',
    '--- Classification ---',
    `Category: ${data.incidentCategory}`,
    `Sub-type: ${data.incidentSubType}`,
    '',
    '--- Description ---',
    data.description,
    `Discovery method: ${data.howDiscovered}`,
    `Attack vector: ${data.attackVector}`,
    '',
    '--- Impact ---',
    `Functional: ${data.functionalImpact}`,
    `Information: ${data.informationImpact}`,
    `Recoverability: ${data.recoverability}`,
    `Personal data involved: ${data.personalDataInvolved}`,
    '',
    '--- Measures ---',
    data.measuresTaken,
    `Resolved: ${data.isResolved}`,
  ].join('\n');
}

export async function deliverEmail(
  ctx: DeliveryContext,
  smtp: SmtpConfig,
): Promise<DeliveryResult> {
  try {
    const transport = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: { user: smtp.user, pass: smtp.pass },
    });

    await transport.sendMail({
      from: smtp.from,
      to: smtp.recipients,
      subject: `[${ctx.referenceNumber}] IT Security Incident Report`,
      text: buildIncidentBody(ctx),
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
): Promise<DeliveryResult> {
  try {
    const transport = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: { user: smtp.user, pass: smtp.pass },
    });

    await transport.sendMail({
      from: smtp.from,
      to: reporterEmail,
      subject: `Confirmation: Your incident report ${ctx.referenceNumber}`,
      text: [
        `Your incident report has been received.`,
        `Reference number: ${ctx.referenceNumber}`,
        '',
        'Please keep this reference number for future correspondence.',
      ].join('\n'),
    });

    return { success: true, channel: 'email-confirmation' };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown email delivery error';
    return { success: false, channel: 'email-confirmation', error: message };
  }
}
