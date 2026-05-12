import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { getConfig } from '@/lib/config';
import { generatePdf } from '@/lib/pdf/generate';
import { deliverEmail, sendConfirmationEmail } from '@/lib/delivery/email';
import { deliverZnuny } from '@/lib/delivery/znuny';
import { saveIncident } from '@/lib/persistence';
import type { FormData } from '@/lib/pdf/types';
import type { DeliveryResult } from '@/lib/delivery/types';

function generateReferenceNumber(prefix: string): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = crypto.randomBytes(2).toString('hex');
  return `${prefix}-${date}-${rand}`;
}

function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  try {
    const data = (await request.json()) as FormData;

    // Server-side validation: require name, valid email, and phone
    if (!data.reporterName?.trim() || !data.email?.trim() || !looksLikeEmail(data.email) || !data.phone?.trim()) {
      return NextResponse.json(
        { error: 'Reporter name, valid email address, and phone number are required.' },
        { status: 422 },
      );
    }

    const config = getConfig();
    const referenceNumber = generateReferenceNumber(config.referencePrefix);
    const pdfBuffer = await generatePdf(data, referenceNumber);

    const ctx = { data, referenceNumber, pdfBuffer };
    const deliveryPromises: Promise<DeliveryResult>[] = [];

    if (config.delivery.email.enabled && config.delivery.email.smtp) {
      const smtp = config.delivery.email.smtp;
      deliveryPromises.push(deliverEmail(ctx, smtp));
      if (looksLikeEmail(data.email)) {
        deliveryPromises.push(sendConfirmationEmail(ctx, smtp, data.email));
      }
    }

    if (config.delivery.znuny.enabled && config.delivery.znuny.config) {
      deliveryPromises.push(deliverZnuny(ctx, config.delivery.znuny.config));
    }

    const settled = await Promise.allSettled(deliveryPromises);
    const deliveryResults: DeliveryResult[] = settled.map((r) =>
      r.status === 'fulfilled'
        ? r.value
        : { success: false, channel: 'unknown', error: String(r.reason) },
    );

    await saveIncident({
      id: crypto.randomUUID(),
      referenceNumber,
      formData: data,
      deliveryResults,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      referenceNumber,
      deliveryResults,
      pdfBase64: pdfBuffer.toString('base64'),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Submission failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
