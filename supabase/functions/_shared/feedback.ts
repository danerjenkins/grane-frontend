/// <reference lib="deno.ns" />
/**
 * Feedback loop core: the single close path shared by the admin UI, the CLI and the
 * post-commit hook (all via the feedback-resolve function). See FEEDBACK-LOOP-SPEC Part D.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export type Db = ReturnType<typeof createClient>;
export type Resolution = 'fixed' | 'noise' | 'duplicate' | 'wontfix' | 'by_design';
export type Via = 'admin' | 'cli' | 'commit' | 'system' | 'reporter';

export const RESOLUTIONS: Resolution[] = ['fixed', 'noise', 'duplicate', 'wontfix', 'by_design'];

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const PUBLIC_SITE_URL = Deno.env.get('PUBLIC_SITE_URL') ?? 'https://granebakery.com';

export class FeedbackError extends Error {
  constructor(
    message: string,
    public status = 400
  ) {
    super(message);
  }
}

interface BugRow {
  id: string;
  user_id: string | null;
  reporter_email: string | null;
  source: string;
  status: 'open' | 'triaged' | 'resolved';
  expectation: string | null;
}

export async function sendWithResend({
  toEmail,
  subject,
  html,
}: {
  toEmail: string;
  subject: string;
  html: string;
}) {
  if (!RESEND_API_KEY) throw new Error('Missing RESEND_API_KEY');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'Grane Support <onboarding@resend.dev>',
      to: [toEmail],
      subject,
      html,
      reply_to: 'support@granebakery.com',
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend error (${res.status}): ${text}`);
  }

  return await res.json();
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function emailShell(title: string, bodyHtml: string) {
  return `
    <div style="background: #FBF7F0; padding: 24px 12px; color: #2B2620;">
      <div style="max-width: 640px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E7E0D6; border-radius: 16px; padding: 24px; font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial;">
        <h1 style="font-family: Georgia, 'Times New Roman', serif; margin: 0 0 12px; font-size: 22px; font-weight: 700; line-height: 1.2;">
          ${title}
        </h1>
        ${bodyHtml}
        <p style="margin: 16px 0 0; color: #2B2620;">— Dane</p>
        <p style="margin: 0; color: #2B2620;">Grane</p>
      </div>
    </div>
  `;
}

/** Resolve a short id prefix (>= 6 hex chars) or full uuid to exactly one report id. */
export async function resolveId(db: Db, idOrPrefix: string): Promise<string> {
  const value = idOrPrefix.trim().toLowerCase();
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value)) return value;
  if (!/^[0-9a-f][0-9a-f-]{5,}$/.test(value))
    throw new FeedbackError(`Invalid bug id: ${idOrPrefix}`);

  const { data, error } = await db.rpc('bug_report_ids_by_prefix', { p: value });
  if (error) throw new FeedbackError(`Id lookup failed: ${error.message}`, 500);
  const ids = (data ?? []) as string[];
  if (ids.length === 0) throw new FeedbackError(`No bug report matches ${idOrPrefix}`, 404);
  if (ids.length > 1) throw new FeedbackError(`Bug id ${idOrPrefix} is ambiguous`, 409);
  return ids[0];
}

async function loadBug(db: Db, id: string): Promise<BugRow> {
  const { data, error } = await db
    .from('bug_reports')
    .select('id, user_id, reporter_email, source, status, expectation')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new FeedbackError(`Failed to load bug: ${error.message}`, 500);
  if (!data) throw new FeedbackError('Bug report not found', 404);
  return data as BugRow;
}

async function logEvent(db: Db, event: Record<string, unknown>) {
  const { error } = await db.from('bug_events').insert(event);
  if (error) console.error('bug_events insert failed:', error.message);
}

async function reporterEmail(db: Db, bug: BugRow): Promise<string | null> {
  if (bug.user_id) {
    const { data } = await db.from('users').select('email').eq('id', bug.user_id).maybeSingle();
    const email = (data as { email?: string | null } | null)?.email;
    if (email) return email;
  }
  return bug.reporter_email;
}

/** Best-effort reporter email. Never throws; skipped for agent-sourced findings. */
export async function notifyReporter(
  db: Db,
  bug: BugRow,
  { subject, title, message }: { subject: string; title: string; message: string }
) {
  try {
    if (bug.source !== 'user') return;
    const toEmail = await reporterEmail(db, bug);
    if (!toEmail) return;

    const quoted = bug.expectation?.trim()
      ? `<div style="border-left: 3px solid #EFE7DD; padding: 4px 0 4px 12px; margin: 0 0 16px; color: #5C5248; font-size: 14px;">
           You wrote: “${escapeHtml(bug.expectation.trim().slice(0, 300))}”
         </div>`
      : '';
    const link = bug.user_id
      ? `<p style="margin: 0 0 12px; font-size: 14px;">
           <a href="${PUBLIC_SITE_URL}/feedback" style="color: #9A6B10;">See your feedback and reply</a>
         </p>`
      : `<p style="margin: 0 0 12px; color: #5C5248; font-size: 14px;">You can reply to this email if you have more to add.</p>`;

    await sendWithResend({
      toEmail,
      subject,
      html: emailShell(
        title,
        `${quoted}<p style="margin: 0 0 16px; font-size: 15px; line-height: 1.5;">${escapeHtml(message)}</p>${link}`
      ),
    });
  } catch (err) {
    console.error('notifyReporter failed:', err);
  }
}

export interface ResolveInput {
  resolution: Resolution;
  fixedCommit?: string | null;
  duplicateOf?: string | null;
  reporterNote?: string | null;
  resolvedBy?: string | null;
  via?: Exclude<Via, 'reporter'>;
}

export async function resolveBug(db: Db, id: string, input: ResolveInput) {
  if (!RESOLUTIONS.includes(input.resolution)) {
    throw new FeedbackError(`Unknown resolution: ${input.resolution}`);
  }
  const note = input.reporterNote?.trim().slice(0, 600) || null;
  if (input.resolution === 'fixed' && !note) {
    throw new FeedbackError("A 'fixed' resolution needs a reporter note.");
  }
  const fixedCommit =
    input.resolution === 'fixed' ? input.fixedCommit?.trim().slice(0, 40) || null : null;
  let duplicateOf: string | null = null;
  if (input.resolution === 'duplicate' && input.duplicateOf) {
    duplicateOf = await resolveId(db, input.duplicateOf);
    if (duplicateOf === id) throw new FeedbackError('A report cannot duplicate itself.');
  }

  const bug = await loadBug(db, id);
  const via = input.via ?? 'admin';

  const { error } = await db
    .from('bug_reports')
    .update({
      status: 'resolved',
      resolution: input.resolution,
      fixed_commit: fixedCommit,
      duplicate_of: duplicateOf,
      reporter_note: note,
      resolved_at: new Date().toISOString(),
      resolved_by: input.resolvedBy ?? null,
      resolved_via: via,
    })
    .eq('id', id);
  if (error) throw new FeedbackError(`Failed to resolve: ${error.message}`, 500);

  await logEvent(db, {
    bug_id: id,
    kind: 'resolved',
    from_status: bug.status,
    to_status: 'resolved',
    via,
    actor_id: input.resolvedBy ?? null,
    resolution: input.resolution,
    fixed_commit: fixedCommit,
    note,
  });

  const fixed = input.resolution === 'fixed';
  await notifyReporter(db, bug, {
    subject: fixed ? 'We fixed something you reported' : 'We reviewed your feedback',
    title: fixed ? 'We fixed something you reported 🍞' : 'We reviewed your feedback',
    message:
      note ??
      'Thanks for taking the time to tell us. We looked into it and have closed it out for now.',
  });

  return { id, status: 'resolved', resolution: input.resolution };
}

export async function reopenBug(
  db: Db,
  id: string,
  { actorId, via }: { actorId?: string | null; via: Via }
) {
  const bug = await loadBug(db, id);
  if (bug.status !== 'resolved') throw new FeedbackError('Only resolved reports can be reopened.');

  const { error } = await db
    .from('bug_reports')
    .update({
      status: 'open',
      resolution: null,
      fixed_commit: null,
      duplicate_of: null,
      reporter_note: null,
      resolved_at: null,
      resolved_by: null,
      resolved_via: null,
    })
    .eq('id', id);
  if (error) throw new FeedbackError(`Failed to reopen: ${error.message}`, 500);

  await logEvent(db, {
    bug_id: id,
    kind: 'reopened',
    from_status: 'resolved',
    to_status: 'open',
    via,
    actor_id: actorId ?? null,
  });

  return { id, status: 'open' };
}

export async function triageBug(
  db: Db,
  id: string,
  {
    severity,
    summary,
    actorId,
    via,
  }: { severity?: string | null; summary?: string | null; actorId?: string | null; via: Via }
) {
  if (severity && !['low', 'med', 'high'].includes(severity)) {
    throw new FeedbackError(`Unknown severity: ${severity}`);
  }
  const bug = await loadBug(db, id);
  const cleanSummary = summary?.trim().slice(0, 280) || null;
  const toStatus = bug.status === 'open' ? 'triaged' : bug.status;

  const { error } = await db
    .from('bug_reports')
    .update({
      severity: severity ?? null,
      summary: cleanSummary,
      status: toStatus,
      ...(bug.status === 'open' ? { triaged_at: new Date().toISOString() } : {}),
    })
    .eq('id', id);
  if (error) throw new FeedbackError(`Failed to triage: ${error.message}`, 500);

  await logEvent(db, {
    bug_id: id,
    kind: 'triaged',
    from_status: bug.status,
    to_status: toStatus,
    via,
    actor_id: actorId ?? null,
    metadata: { severity: severity ?? null, summary: cleanSummary },
  });

  return { id, status: toStatus };
}

/** Post a team message to the thread and email the reporter the question. */
export async function postTeamMessage(
  db: Db,
  id: string,
  { body, senderId }: { body: string; senderId?: string | null }
) {
  const text = body.trim().slice(0, 2000);
  if (!text) throw new FeedbackError('Message is empty.');
  const bug = await loadBug(db, id);

  const { error } = await db
    .from('bug_messages')
    .insert({ bug_id: id, sender_role: 'team', sender_id: senderId ?? null, body: text });
  if (error) throw new FeedbackError(`Failed to post message: ${error.message}`, 500);

  await notifyReporter(db, bug, {
    subject: 'We have a question about your report',
    title: 'We have a question about your report',
    message: text,
  });

  return { id, posted: true };
}
