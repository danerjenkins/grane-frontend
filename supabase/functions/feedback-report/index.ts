import '@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { corsHeaders } from '../_shared/cors.ts';
import { emailShell, escapeHtml, sendWithResend } from '../_shared/feedback.ts';

/**
 * Feedback intake (FEEDBACK-LOOP-SPEC Part D). Guests are allowed, so verify_jwt is off;
 * a signed-in caller is identified from their Authorization bearer when present.
 */

const SB_URL = Deno.env.get('GRANE_SUPABASE_URL');
const SB_SERVICE_ROLE = Deno.env.get('GRANE_SERVICE_ROLE_KEY');
const FEEDBACK_ADMIN_EMAIL = Deno.env.get('FEEDBACK_ADMIN_EMAIL');
const PUBLIC_SITE_URL = Deno.env.get('PUBLIC_SITE_URL') ?? 'https://granebakery.com';

const RATE_LIMIT_COUNT = 6;
const RATE_LIMIT_WINDOW_MS = 2 * 60 * 1000;
const SCREENSHOT_MAX_BYTES = 6 * 1024 * 1024;
const CONTEXT_MAX_BYTES = 256 * 1024;
const KINDS = ['bug', 'confusing', 'idea'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function jsonResponse(status: number, payload: Record<string, unknown>) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function clampString(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function decodeScreenshot(dataUrl: unknown): Uint8Array | null {
  if (typeof dataUrl !== 'string') return null;
  const match = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) return null;
  // base64 is ~4/3 the byte size; reject before decoding anything oversized.
  if ((match[1].length * 3) / 4 > SCREENSHOT_MAX_BYTES) return null;
  const binary = atob(match[1]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return jsonResponse(405, { ok: false, error: 'method not allowed' });
  }
  if (!SB_URL || !SB_SERVICE_ROLE) {
    console.error('Missing GRANE_SUPABASE_URL or GRANE_SERVICE_ROLE_KEY');
    return jsonResponse(500, { ok: false, error: 'server misconfigured' });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(400, { ok: false, error: 'invalid json' });
  }

  const db = createClient(SB_URL, SB_SERVICE_ROLE, { auth: { persistSession: false } });

  // Identify the caller if they sent a user JWT (the anon key resolves to no user).
  let userId: string | null = null;
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (token) {
    const { data } = await db.auth.getUser(token);
    userId = data.user?.id ?? null;
  }

  const sessionId = clampString(body.session_id, 80);
  if (!userId && !sessionId) {
    return jsonResponse(400, { ok: false, error: 'missing session' });
  }

  // 1. Soft rate limit: silently drop past the ceiling.
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  const rateQuery = db
    .from('bug_reports')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', since);
  const { count } = await (userId
    ? rateQuery.eq('user_id', userId)
    : rateQuery.is('user_id', null).eq('session_id', sessionId));
  if ((count ?? 0) >= RATE_LIMIT_COUNT) {
    return jsonResponse(200, { ok: true, throttled: true });
  }

  const id = crypto.randomUUID();
  const kind = KINDS.includes(body.kind as string) ? (body.kind as string) : 'bug';
  const expectation = clampString(body.expectation, 2000);

  let context: Record<string, unknown> = {};
  if (body.context && typeof body.context === 'object') {
    const serialized = JSON.stringify(body.context);
    context =
      serialized.length <= CONTEXT_MAX_BYTES
        ? (body.context as Record<string, unknown>)
        : { truncated: true, url: (body.context as { url?: unknown }).url ?? null };
  }

  // 2. Screenshot upload, best-effort.
  let screenshotPath: string | null = null;
  const png = decodeScreenshot(body.screenshot);
  if (png) {
    const path = `${id}/screenshot.png`;
    const { error } = await db.storage
      .from('feedback')
      .upload(path, png, { contentType: 'image/png', upsert: false });
    if (error) console.warn('Screenshot upload failed:', error.message);
    else screenshotPath = path;
  }

  // 3. Server-stamped metadata.
  let reporterRole: 'admin' | 'customer' | 'guest' = 'guest';
  if (userId) {
    const { data: role } = await db
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    reporterRole = role ? 'admin' : 'customer';
  }
  const email = userId ? null : clampString(body.reporter_email, 254);

  // 4. Insert.
  const { error: insertError } = await db.from('bug_reports').insert({
    id,
    user_id: userId,
    reporter_email: email && EMAIL_RE.test(email) ? email : null,
    kind,
    expectation,
    route: clampString(body.route, 256),
    app_version: clampString(body.app_version, 40),
    app_commit: clampString(body.app_commit, 40),
    session_id: sessionId,
    context,
    screenshot_path: screenshotPath,
    reporter_role: reporterRole,
    status: 'open',
  });
  if (insertError) {
    console.error('bug_reports insert failed:', insertError.message);
    if (screenshotPath) await db.storage.from('feedback').remove([screenshotPath]);
    return jsonResponse(500, { ok: false, error: 'could not save report' });
  }

  // 5. Audit event.
  const { error: eventError } = await db.from('bug_events').insert({
    bug_id: id,
    kind: 'created',
    to_status: 'open',
    via: 'reporter',
    actor_id: userId,
  });
  if (eventError) console.error('bug_events insert failed:', eventError.message);

  // Let the owner know (best-effort).
  if (FEEDBACK_ADMIN_EMAIL) {
    try {
      await sendWithResend({
        toEmail: FEEDBACK_ADMIN_EMAIL,
        subject: `New ${kind} report on ${clampString(body.route, 80) ?? 'the site'}`,
        html: emailShell(
          `New feedback: ${kind}`,
          `<p style="margin: 0 0 12px; font-size: 14px; color: #5C5248;">
             ${escapeHtml(expectation ?? '(no description, see context)')}
           </p>
           <p style="margin: 0; font-size: 14px;">
             <a href="${PUBLIC_SITE_URL}/admin/feedback/${id}" style="color: #9A6B10;">Open in the admin inbox</a>
           </p>`
        ),
      });
    } catch (err) {
      console.error('Admin notification failed:', err);
    }
  }

  return jsonResponse(200, { ok: true, id });
});
