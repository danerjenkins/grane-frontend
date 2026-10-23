import { supabase } from '../supabaseClient';
import { invokeResolve, type BugMessage, type BugReportRow } from '../feedback';

/**
 * Admin feedback inbox operations.
 * Reads go through RLS (is_admin()); lifecycle changes go through the
 * feedback-resolve Edge Function so every close follows the same rules.
 */

export type FeedbackStatusFilter = 'open' | 'triaged' | 'resolved';
export type FeedbackSourceFilter = 'people' | 'passes' | 'all';
export type Resolution = NonNullable<BugReportRow['resolution']>;

export interface BugEvent {
  id: string;
  bug_id: string;
  at: string;
  kind: 'created' | 'triaged' | 'resolved' | 'reopened';
  from_status: string | null;
  to_status: string | null;
  via: string | null;
  actor_id: string | null;
  resolution: string | null;
  fixed_commit: string | null;
  note: string | null;
  metadata: Record<string, unknown>;
}

export interface ReporterProfile {
  id: string;
  name: string | null;
  email: string | null;
}

const SIGNED_URL_TTL_SECONDS = 15 * 60;

export async function listFeedback(
  status: FeedbackStatusFilter,
  source: FeedbackSourceFilter
): Promise<BugReportRow[]> {
  let query = supabase
    .from('bug_reports')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(200);

  if (source === 'people') query = query.eq('source', 'user');
  if (source === 'passes') query = query.neq('source', 'user');

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list feedback: ${error.message}`);
  }

  return (data || []) as BugReportRow[];
}

export async function countOpenFeedback(): Promise<number> {
  const { count, error } = await supabase
    .from('bug_reports')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'open')
    .eq('source', 'user');

  if (error) {
    throw new Error(`Failed to count feedback: ${error.message}`);
  }

  return count ?? 0;
}

export async function getFeedback(id: string): Promise<BugReportRow> {
  const { data, error } = await supabase.from('bug_reports').select('*').eq('id', id).single();

  if (error) {
    throw new Error(`Failed to get report: ${error.message}`);
  }

  if (!data) {
    throw new Error('Report not found');
  }

  return data as BugReportRow;
}

export async function getReporterProfile(userId: string): Promise<ReporterProfile | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to get reporter: ${error.message}`);
  }

  return data as ReporterProfile | null;
}

export async function getScreenshotUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('feedback')
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (error) {
    console.warn('Failed to sign screenshot URL:', error.message);
    return null;
  }

  return data.signedUrl;
}

export async function listFeedbackMessages(bugId: string): Promise<BugMessage[]> {
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

export async function listFeedbackEvents(bugId: string): Promise<BugEvent[]> {
  const { data, error } = await supabase
    .from('bug_events')
    .select('*')
    .eq('bug_id', bugId)
    .order('at', { ascending: true });

  if (error) {
    throw new Error(`Failed to load history: ${error.message}`);
  }

  return (data || []) as BugEvent[];
}

export async function triageFeedback(
  id: string,
  severity: BugReportRow['severity'],
  summary: string
): Promise<void> {
  await invokeResolve({ action: 'triage', id, severity, summary });
}

export async function resolveFeedback(
  id: string,
  input: {
    resolution: Resolution;
    reporterNote?: string;
    fixedCommit?: string;
    duplicateOf?: string;
  }
): Promise<void> {
  await invokeResolve({ action: 'resolve', id, ...input });
}

export async function reopenFeedback(id: string): Promise<void> {
  await invokeResolve({ action: 'reopen', id });
}

export async function askReporter(id: string, body: string): Promise<void> {
  await invokeResolve({ action: 'ask', id, body });
}
