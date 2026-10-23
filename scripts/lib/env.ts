/**
 * Minimal .env.local loader for the feedback CLI scripts (no dotenv dependency).
 * Needs SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadFile(path: string) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (!match || process.env[match[1]] !== undefined) continue;
    process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}

export function loadEnv() {
  const root = resolve(import.meta.dirname, '..', '..');
  loadFile(resolve(root, '.env.local'));
  loadFile(resolve(root, '.env'));

  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      'Missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY. Add them to .env.local (see .env.example).'
    );
  }
  return { url: url.replace(/\/$/, ''), serviceKey, root };
}
