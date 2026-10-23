/**
 * Client-side secret scrubber for feedback context.
 * Every captured string runs through scrub() before it leaves the browser.
 */

const JWT_RE = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g;
const SECRET_PARAM_RE =
  /([?&](?:token|apikey|api_key|access_token|refresh_token|key|secret|password|code|session)=)[^&#\s]*/gi;
const SENSITIVE_PAIR_RE =
  /((?:authorization|api[-_]?key|token|secret|password|bearer|cookie|session)["']?\s*[:=]\s*["']?)[^\s"',;}&]+/gi;
const BEARER_RE = /\bBearer\s+[^\s"',;]+/gi;
const LONG_TOKEN_RE = /[A-Za-z0-9_-]{40,}/g;

export function scrub(value: unknown, max: number): string {
  let text: string;
  if (typeof value === 'string') {
    text = value;
  } else {
    try {
      text = value instanceof Error ? `${value.name}: ${value.message}` : JSON.stringify(value);
    } catch {
      text = String(value);
    }
  }
  if (!text) return '';

  const cleaned = text
    .replace(JWT_RE, '[redacted-jwt]')
    .replace(SECRET_PARAM_RE, '$1[redacted]')
    .replace(BEARER_RE, 'Bearer [redacted]')
    .replace(SENSITIVE_PAIR_RE, '$1[redacted]')
    .replace(LONG_TOKEN_RE, '[redacted]');

  return cleaned.length > max ? `${cleaned.slice(0, max - 1)}…` : cleaned;
}

/** Keep the first `frames` lines of a stack, scrubbed and clamped. */
export function scrubStack(stack: string | undefined, frames = 6, max = 2000): string | undefined {
  if (!stack) return undefined;
  const lines = stack
    .split('\n')
    .slice(0, frames + 1)
    .join('\n');
  return scrub(lines, max);
}
