/**
 * Joins a configured base URL and an API path without doubling or dropping the
 * slash between them. `https://host/` + `/api` would otherwise become
 * `https://host//api`, which Rails- and Perl-based helpdesks answer with 404.
 */
export function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

/**
 * fetch() with an AbortController timeout so a hung or slow endpoint can never
 * stall an incident submission. Used by every outbound HTTP delivery channel.
 */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
