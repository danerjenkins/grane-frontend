/**
 * buildRepairMarkdown(row): render a bug_reports row as a readable brief for a coding agent.
 * Pure (type-only imports) so it powers the admin "Copy repair bundle" and scripts/bug-pull.ts.
 */
import type { FeedbackContext } from './types';

export interface BugReportRow {
  id: string;
  user_id: string | null;
  reporter_email: string | null;
  source: string;
  kind: 'bug' | 'confusing' | 'idea';
  expectation: string | null;
  route: string | null;
  app_version: string | null;
  app_commit: string | null;
  session_id: string | null;
  context: Partial<FeedbackContext>;
  screenshot_path: string | null;
  severity: 'low' | 'med' | 'high' | null;
  summary: string | null;
  reporter_role: 'admin' | 'customer' | 'guest' | null;
  status: 'open' | 'triaged' | 'resolved';
  created_at: string;
  triaged_at: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  resolved_via: 'admin' | 'cli' | 'commit' | 'system' | null;
  resolution: 'fixed' | 'noise' | 'duplicate' | 'wontfix' | 'by_design' | null;
  fixed_commit: string | null;
  duplicate_of: string | null;
  reporter_note: string | null;
  last_message_at: string | null;
  last_message_role: 'reporter' | 'team' | null;
}

function clock(t: number) {
  return new Date(t).toISOString().slice(11, 19);
}

export function buildRepairMarkdown(row: BugReportRow): string {
  const ctx = row.context ?? {};
  const lines: string[] = [];
  const id8 = row.id.slice(0, 8);

  lines.push(`# bug ${id8} · ${row.kind}${row.severity ? ` · ${row.severity}` : ''}`);
  lines.push('');
  lines.push(`- **status:** ${row.status}${row.resolution ? ` (${row.resolution})` : ''}`);
  lines.push(`- **expected:** ${row.expectation?.trim() || '(no note, see context)'}`);
  if (row.summary) lines.push(`- **triage summary:** ${row.summary}`);
  lines.push(
    `- **screen + version:** ${row.route ?? ctx.url ?? '?'} · v${row.app_version ?? '?'}${row.app_commit ? ` (${row.app_commit})` : ''}`
  );
  lines.push(`- **when + session:** ${row.created_at} · ${row.session_id ?? '?'}`);
  lines.push(
    `- **reporter:** ${row.reporter_role ?? 'unknown'}${row.user_id ? ` ${row.user_id.slice(0, 8)}` : ''} · source ${row.source}`
  );
  if (ctx.user_agent) lines.push(`- **agent:** ${ctx.user_agent}`);
  if (ctx.viewport) {
    lines.push(
      `- **viewport:** ${ctx.viewport.w}×${ctx.viewport.h} @${ctx.viewport.dpr}x · ${ctx.color_scheme ?? '?'} · ${ctx.timezone ?? '?'} · ${ctx.locale ?? '?'}`
    );
  }
  if (ctx.last_element) {
    lines.push(
      `- **last interaction:** \`${ctx.last_element.selector}\` "${ctx.last_element.text}"`
    );
  }
  if (ctx.scroll) lines.push(`- **scroll:** ${ctx.scroll.x},${ctx.scroll.y}`);
  if (ctx.perf) {
    const p = ctx.perf;
    lines.push(
      `- **perf:** load ${p.load_ms ?? '?'}ms · ttfb ${p.ttfb_ms ?? '?'}ms · dom ${p.dom_ms ?? '?'}ms · long tasks ${p.long_tasks ?? 0}${p.heap_used_mb ? ` · heap ${p.heap_used_mb}/${p.heap_limit_mb}MB` : ''}${p.connection?.type ? ` · ${p.connection.type}` : ''}`
    );
  }

  const errors = ctx.errors ?? [];
  if (errors.length) {
    lines.push('', '## errors (thrown)');
    for (const e of errors) {
      lines.push(`- ${clock(e.t)} ${e.message}${e.source ? ` (${e.source})` : ''}`);
      if (e.stack) {
        lines.push(
          '  ```',
          ...e.stack
            .split('\n')
            .slice(0, 7)
            .map((l) => `  ${l}`),
          '  ```'
        );
      }
    }
  }

  const failed = (ctx.network ?? []).filter((n) => !n.ok);
  if (failed.length) {
    lines.push('', '## failed requests');
    for (const n of failed)
      lines.push(`- ${clock(n.t)} ${n.method} ${n.url} -> ${n.status} (${n.ms}ms)`);
  }

  const consoleLines = ctx.console ?? [];
  if (consoleLines.length) {
    lines.push('', '## console');
    for (const c of consoleLines) lines.push(`- ${clock(c.t)} [${c.level}] ${c.text}`);
  }

  const crumbs = ctx.breadcrumbs ?? [];
  if (crumbs.length) {
    lines.push('', '## what they did');
    for (const b of crumbs) lines.push(`- ${clock(b.t)} ${b.type} ${b.detail}`);
  }

  lines.push('', '## screenshot');
  lines.push(
    row.screenshot_path
      ? `- saved to feedback/${row.screenshot_path} (downloaded alongside as screenshot.png)`
      : '- none captured'
  );

  return lines.join('\n') + '\n';
}
