// Liveness/readiness probe for Docker HEALTHCHECK, compose, and orchestrators.
// Intentionally dependency-free and dynamic so it always reflects a live process.
export const dynamic = 'force-dynamic';

export function GET() {
  return Response.json({ status: 'ok' }, { headers: { 'Cache-Control': 'no-store' } });
}
