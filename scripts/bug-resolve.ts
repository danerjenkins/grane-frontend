/**
 * bug:resolve, a thin CLI over the feedback-resolve Edge Function (the single close path).
 *
 *   npm run bug:resolve -- <id> [--resolution fixed|noise|duplicate|wontfix|by_design]
 *                              [--commit <sha>] [--note <text>] [--duplicate-of <id>] [--via cli|commit]
 *
 * Defaults: --resolution fixed; for fixed with no --commit, uses `git rev-parse --short HEAD`.
 * <id> may be a short prefix (8 chars as shown in the inbox).
 */
import { execSync } from 'node:child_process';
import { parseArgs } from 'node:util';
import { loadEnv } from './lib/env';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    resolution: { type: 'string', default: 'fixed' },
    commit: { type: 'string' },
    note: { type: 'string' },
    'duplicate-of': { type: 'string' },
    via: { type: 'string', default: 'cli' },
  },
});

const id = positionals[0];
if (!id) {
  console.error('usage: npm run bug:resolve -- <id> [--resolution …] [--commit …] [--note …]');
  process.exit(1);
}

const { url, serviceKey } = loadEnv();

let fixedCommit = values.commit;
if (values.resolution === 'fixed' && !fixedCommit) {
  try {
    fixedCommit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    // not in a git checkout; leave it unset
  }
}

const res = await fetch(`${url}/functions/v1/feedback-resolve`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${serviceKey}`,
    apikey: serviceKey,
  },
  body: JSON.stringify({
    action: 'resolve',
    id,
    resolution: values.resolution,
    fixedCommit,
    reporterNote: values.note,
    duplicateOf: values['duplicate-of'],
    via: values.via,
  }),
});

const payload = (await res.json().catch(() => ({}))) as Record<string, unknown>;
if (!res.ok || !payload.ok) {
  console.error(`bug:resolve failed (${res.status}): ${String(payload.error ?? res.statusText)}`);
  process.exit(1);
}

console.log(
  `bug ${String(payload.id).slice(0, 8)} resolved as ${String(payload.resolution)}` +
    (fixedCommit && values.resolution === 'fixed' ? ` (${fixedCommit})` : '')
);
