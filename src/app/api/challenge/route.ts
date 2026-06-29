import { NextResponse } from 'next/server';
import { createChallenge } from '@/lib/captcha';

export async function GET() {
  return NextResponse.json(createChallenge(), { headers: { 'Cache-Control': 'no-store' } });
}
