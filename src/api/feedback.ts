import { supabase } from './supabaseClient';
import type { BugReportRow } from '../feedback/repairMarkdown';

/**
 * Reporter-facing feedback API.
 * RLS scopes every read to the signed-in user's own reports.
 */

export type { BugReportRow };

export interface BugMessage {
  id: string;
  bug_id: string;
  sender_role: 'reporter' | 'team';
  sender_id: string | null;
  body: string;
  created_at: string;
}

export const RESOLVE_FUNCTION = 'feedback-resolve';

/** Call feedback-resolve and surface its JSON error message on failure. */
export async function invokeResolve<T = Record<string, unknown>>(
  payload: Record<string, unknown>
): Promise<T> {
  const { data, error } = await supabase.functions.invoke(RESOLVE_FUNCTION, { body: payload });
  if (error) {
    let message = error.message;
    const response = (error as { context?: Response }).context;
    if (response && typeof response.json === 'function') {
      try {
        const parsed = await response.json();
        if (parsed?.error) message = parsed.error;
      } catch {
        // keep the generic message
      }
    }
    throw new Error(message);
  }
  return data as T;
}

export async function listMyReports(): Promise<BugReportRow[]> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('bug_reports')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to load your feedback: ${error.message}`);
  }

  return (data || []) as BugReportRow[];
}

export async function listMessages(bugId: string): Promise<BugMessage[]> {
  const { data, error } = await supabase
    .from('bug_messages')
    .select('*')
    .eq('bug_id', bugId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to load messages: ${error.message}`);
  }

  return (data || []) as BugMessage[];
}

export async function postReply(bugId: string, body: string): Promise<BugMessage> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('bug_messages')
    .insert({ bug_id: bugId, sender_role: 'reporter', sender_id: userId, body: body.trim() })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to send reply: ${error.message}`);
  }

  return data as BugMessage;
}

export async function reopenReport(bugId: string): Promise<void> {
  await invokeResolve({ action: 'reopen', id: bugId });
}

/** Reporter-safe status label; never shows the internal open/triaged/resolved. */
export function reporterStatusLabel(row: Pick<BugReportRow, 'status' | 'resolution'>): string {
  if (row.status === 'open') return 'Submitted';
  if (row.status === 'triaged') return 'Reviewing';
  return row.resolution === 'fixed' ? 'Fixed' : 'Reviewed';
}
