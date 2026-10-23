/**
 * bug:pull, materialize a feedback report locally for the fix-bug skill.
 *
 *   npm run bug:pull -- <id>
 *
 * Writes .bugs/<id8>/{report.md, context.json, row.json, screenshot.png} (gitignored).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { buildRepairMarkdown, type BugReportRow } from '../src/feedback/repairMarkdown';
import { loadEnv } from './lib/env';

const input = process.argv[2]?.trim().toLowerCase();
if (!input) {
  console.error('usage: npm run bug:pull -- <id>');
  process.exit(1);
}

const { url, serviceKey, root } = loadEnv();
const db = createClient(url, serviceKey, { auth: { persistSession: false } });

let id = input;
if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(input)) {
  const { data, error } = await db.rpc('bug_report_ids_by_prefix', { p: input });
  if (error) throw new Error(`Id lookup failed: ${error.message}`);
  const ids = (data ?? []) as string[];
  if (ids.length !== 1) {
    console.error(ids.length ? `Bug id ${input} is ambiguous` : `No bug report matches ${input}`);
    process.exit(1);
  }
  id = ids[0];
}

const { data: row, error } = await db.from('bug_reports').select('*').eq('id', id).maybeSingle();
if (error) throw new Error(`Failed to load bug: ${error.message}`);
if (!row) {
  console.error(`No bug report ${id}`);
  process.exit(1);
}

const report = row as BugReportRow;
const dir = resolve(root, '.bugs', id.slice(0, 8));
mkdirSync(dir, { recursive: true });

const { data: messages } = await db
  .from('bug_messages')
  .select('sender_role, body, created_at')
  .eq('bug_id', id)
  .order('created_at');

let markdown = buildRepairMarkdown(report);
if (messages?.length) {
  markdown +=
    '\n## thread\n' +
    messages.map((m) => `- ${m.created_at} **${m.sender_role}:** ${m.body}`).join('\n') +
    '\n';
}

writeFileSync(resolve(dir, 'report.md'), markdown);
writeFileSync(resolve(dir, 'context.json'), JSON.stringify(report.context, null, 2));
writeFileSync(resolve(dir, 'row.json'), JSON.stringify({ ...report, context: undefined }, null, 2));

let screenshot = 'none';
if (report.screenshot_path) {
  const { data: blob, error: dlError } = await db.storage
    .from('feedback')
    .download(report.screenshot_path);
  if (dlError || !blob) {
    console.warn(`Screenshot download failed: ${dlError?.message ?? 'empty'}`);
  } else {
    writeFileSync(resolve(dir, 'screenshot.png'), Buffer.from(await blob.arrayBuffer()));
    screenshot = 'screenshot.png';
  }
}

console.log(
  `Pulled bug ${id.slice(0, 8)} → .bugs/${id.slice(0, 8)}/ (report.md, context.json, ${screenshot})`
);
