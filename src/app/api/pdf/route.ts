import { NextResponse } from 'next/server';
import { generatePdf } from '@/lib/pdf/generate';

interface PdfRequestBody {
  data: Record<string, unknown>;
  referenceNumber: string;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as PdfRequestBody;
    const { data, referenceNumber } = body;

    if (!data || !referenceNumber) {
      return NextResponse.json({ error: 'Missing data or referenceNumber' }, { status: 400 });
    }

    const buffer = await generatePdf(data as Parameters<typeof generatePdf>[0], referenceNumber);

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${referenceNumber}.pdf"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'PDF generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
