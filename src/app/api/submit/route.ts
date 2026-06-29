import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { getConfig } from '@/lib/config';
import { generatePdf } from '@/lib/pdf/generate';
import { deliverEmail, sendConfirmationEmail } from '@/lib/delivery/email';
import { deliverZnuny, deliverOtobo } from '@/lib/delivery/otrs';
import { deliverWebhook } from '@/lib/delivery/webhook';
import { deliverZammad } from '@/lib/delivery/zammad';
import { saveIncident } from '@/lib/persistence';
import { submissionSchema } from '@/lib/form/schema';
import { rateLimit } from '@/lib/rate-limit';
import { verifySolution } from '@/lib/captcha';
import { routing } from '@/i18n/routing';
import type { DeliveryResult } from '@/lib/delivery/types';

function generateReferenceNumber(prefix: string): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = crypto.randomBytes(2).toString('hex');
  return `${prefix}-${date}-${rand}`;
}

function clientIp(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for');
  return fwd?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

export async function POST(request: Request) {
  // Abuse guard (PDF render + outbound mail per request; confirmation mail goes
  // to a user-supplied address). 5 submissions / 10 min / IP.
  const limit = rateLimit(`submit:${clientIp(request)}`, 5, 10 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } },
    );
  }

  try {
    const body: unknown = await request.json();
    const antibot = body as { honeypot?: unknown; captcha?: unknown };

    // Honeypot: a hidden field that only bots fill in.
    if (typeof antibot.honeypot === 'string' && antibot.honeypot.trim() !== '') {
      return NextResponse.json({ error: 'Rejected.' }, { status: 400 });
    }
    // Invisible, self-hosted proof-of-work captcha (GDPR-clean).
    if (!verifySolution(antibot.captcha)) {
      return NextResponse.json({ error: 'Verification failed. Please retry.' }, { status: 400 });
    }

    // Shared schema validates shape + required reporter fields (SSOT with client).
    const parsed = submissionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Reporter name, valid email address, and phone number are required.' },
        { status: 422 },
      );
    }
    const data = parsed.data;

    // Report language for the PDF / e-mail, validated against supported locales.
    const requestedLocale = (body as { locale?: unknown }).locale;
    const locale =
      typeof requestedLocale === 'string' &&
      (routing.locales as readonly string[]).includes(requestedLocale)
        ? requestedLocale
        : routing.defaultLocale;

    const config = getConfig();
    const referenceNumber = generateReferenceNumber(config.referencePrefix);
    const pdfBuffer = await generatePdf(data, referenceNumber, locale);
    const submittedAt = new Date().toISOString();

    const ctx = { data, referenceNumber, pdfBuffer, locale, submittedAt };
    const deliveryPromises: Promise<DeliveryResult>[] = [];

    if (config.delivery.email.enabled && config.delivery.email.smtp) {
      const smtp = config.delivery.email.smtp;
      deliveryPromises.push(deliverEmail(ctx, smtp));
      deliveryPromises.push(sendConfirmationEmail(ctx, smtp, data.email));
    }

    if (config.delivery.znuny.enabled && config.delivery.znuny.config) {
      deliveryPromises.push(deliverZnuny(ctx, config.delivery.znuny.config));
    }

    if (config.delivery.otobo.enabled && config.delivery.otobo.config) {
      deliveryPromises.push(deliverOtobo(ctx, config.delivery.otobo.config));
    }

    if (config.delivery.webhook.enabled && config.delivery.webhook.config) {
      deliveryPromises.push(deliverWebhook(ctx, config.delivery.webhook.config));
    }

    if (config.delivery.zammad.enabled && config.delivery.zammad.config) {
      deliveryPromises.push(deliverZammad(ctx, config.delivery.zammad.config));
    }

    const settled = await Promise.allSettled(deliveryPromises);
    const deliveryResults: DeliveryResult[] = settled.map((r) =>
      r.status === 'fulfilled'
        ? r.value
        : { success: false, channel: 'unknown', error: String(r.reason) },
    );

    // Persistence is a best-effort audit trail — its failure must not fail the
    // submission (delivery is the source of truth).
    try {
      await saveIncident({
        id: crypto.randomUUID(),
        referenceNumber,
        formData: data,
        deliveryResults,
        createdAt: submittedAt,
      });
    } catch (persistErr) {
      console.error('[submit] persistence failed (non-fatal):', persistErr);
    }

    return NextResponse.json({
      referenceNumber,
      deliveryResults,
      pdfBase64: pdfBuffer.toString('base64'),
    });
  } catch (err) {
    // Do not leak internal error details to the client.
    console.error('[submit] error:', err);
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 });
  }
}
