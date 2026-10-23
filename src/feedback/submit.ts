import { supabase } from '../api/supabaseClient';
import type { FeedbackBundle } from './types';

const QUEUE_KEY = 'grane.feedback.queue';
const QUEUE_MAX = 5;

export const FEEDBACK_FUNCTION = 'feedback-report';

function readQueue(): FeedbackBundle[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: FeedbackBundle[]) {
  try {
    if (queue.length) localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-QUEUE_MAX)));
    else localStorage.removeItem(QUEUE_KEY);
  } catch {
    // Quota exceeded (screenshots are large): retry once without them.
    try {
      const slim = queue.slice(-QUEUE_MAX).map((b) => ({ ...b, screenshot: null }));
      localStorage.setItem(QUEUE_KEY, JSON.stringify(slim));
    } catch {
      // storage unavailable; the report is lost
    }
  }
}

async function post(bundle: FeedbackBundle): Promise<{ id?: string }> {
  const { data, error } = await supabase.functions.invoke(FEEDBACK_FUNCTION, { body: bundle });
  if (error) throw error;
  return (data ?? {}) as { id?: string };
}

/** Submit a report; on failure it is queued in localStorage and retried on next boot. */
export async function submitReport(bundle: FeedbackBundle): Promise<void> {
  try {
    await post(bundle);
  } catch (err) {
    console.warn('Feedback submit failed, queued for retry:', err);
    writeQueue([...readQueue(), bundle]);
  }
}

/** Retry any reports queued by a failed submit. Called once at app boot. */
export async function flushQueue(): Promise<void> {
  const queue = readQueue();
  if (!queue.length) return;
  const remaining: FeedbackBundle[] = [];
  for (const bundle of queue) {
    try {
      await post(bundle);
    } catch {
      remaining.push(bundle);
    }
  }
  writeQueue(remaining);
}
