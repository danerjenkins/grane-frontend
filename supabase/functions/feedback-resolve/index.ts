import '@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { corsHeaders } from '../_shared/cors.ts';
import {
  FeedbackError,
  postTeamMessage,
  reopenBug,
  resolveBug,
  resolveId,
  triageBug,
  type Resolution,
} from '../_shared/feedback.ts';

/**
 * Lifecycle actions for feedback reports: resolve | reopen | triage | ask.
 *
 * Callers:
 * - admin UI: user JWT whose user has the admin role (via = 'admin')
 * - CLI / post-commit hook: service-role bearer (via = 'cli' | 'commit' | 'system')
 * - reporter: user JWT may only `reopen` a report they own (via = 'reporter')
 */

const SB_URL = Deno.env.get('GRANE_SUPABASE_URL');
const SB_SERVICE_ROLE = Deno.env.get('GRANE_SERVICE_ROLE_KEY');

const ACTIONS = ['resolve', 'reopen', 'triage', 'ask'] as const;
type Action = (typeof ACTIONS)[number];

function jsonResponse(status: number, payload: Record<string, unknown>) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
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

  const action = body.action as Action;
  if (!ACTIONS.includes(action)) {
    return jsonResponse(400, { ok: false, error: `unknown action: ${String(body.action)}` });
  }

  const db = createClient(SB_URL, SB_SERVICE_ROLE, { auth: { persistSession: false } });
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') ?? '';

  // Who is calling?
  let caller: { kind: 'service' } | { kind: 'admin'; id: string } | { kind: 'user'; id: string };
  if (token && token === SB_SERVICE_ROLE) {
    caller = { kind: 'service' };
  } else {
    const { data } = token ? await db.auth.getUser(token) : { data: { user: null } };
    const userId = data.user?.id;
    if (!userId) return jsonResponse(401, { ok: false, error: 'not signed in' });
    const { data: role } = await db
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    caller = role ? { kind: 'admin', id: userId } : { kind: 'user', id: userId };
  }

  try {
    const id = await resolveId(db, String(body.id ?? ''));
    const actorId = caller.kind === 'service' ? null : caller.id;
    const serviceVia = (['cli', 'commit', 'system'] as const).find((v) => v === body.via) ?? 'cli';

    if (caller.kind === 'user') {
      if (action !== 'reopen') return jsonResponse(403, { ok: false, error: 'not authorized' });
      const { data: own } = await db
        .from('bug_reports')
        .select('id')
        .eq('id', id)
        .eq('user_id', caller.id)
        .maybeSingle();
      if (!own) return jsonResponse(404, { ok: false, error: 'Bug report not found' });
      const result = await reopenBug(db, id, { actorId, via: 'reporter' });
      return jsonResponse(200, { ok: true, ...result });
    }

    const via = caller.kind === 'admin' ? 'admin' : serviceVia;

    switch (action) {
      case 'resolve': {
        const result = await resolveBug(db, id, {
          resolution: (str(body.resolution) ?? 'fixed') as Resolution,
          fixedCommit: str(body.fixedCommit),
          duplicateOf: str(body.duplicateOf),
          reporterNote: str(body.reporterNote),
          resolvedBy: actorId,
          via,
        });
        return jsonResponse(200, { ok: true, ...result });
      }
      case 'reopen': {
        const result = await reopenBug(db, id, { actorId, via });
        return jsonResponse(200, { ok: true, ...result });
      }
      case 'triage': {
        const result = await triageBug(db, id, {
          severity: str(body.severity),
          summary: str(body.summary),
          actorId,
          via,
        });
        return jsonResponse(200, { ok: true, ...result });
      }
      case 'ask': {
        const result = await postTeamMessage(db, id, {
          body: String(body.body ?? ''),
          senderId: actorId,
        });
        return jsonResponse(200, { ok: true, ...result });
      }
    }
  } catch (err) {
    if (err instanceof FeedbackError) {
      return jsonResponse(err.status, { ok: false, error: err.message });
    }
    console.error('feedback-resolve error:', err);
    return jsonResponse(500, { ok: false, error: String(err) });
  }
});
