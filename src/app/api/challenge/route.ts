import { NextResponse } from 'next/server';
import { createChallenge } from '@/lib/captcha';
import { getConfig } from '@/lib/config';

export async function GET() {
  return NextResponse.json(createChallenge(getConfig().captcha.difficulty), {
    headers: { 'Cache-Control': 'no-store' },
  });
}
