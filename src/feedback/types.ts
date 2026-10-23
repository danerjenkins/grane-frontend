export type FeedbackKind = 'bug' | 'confusing' | 'idea';

export interface Breadcrumb {
  t: number;
  type: 'nav' | 'click' | 'input';
  detail: string;
}

export interface ConsoleEntry {
  t: number;
  level: 'log' | 'info' | 'warn' | 'error';
  text: string;
}

export interface NetworkEntry {
  t: number;
  method: string;
  url: string;
  status: number;
  ms: number;
  ok: boolean;
}

export interface ErrorEntry {
  t: number;
  message: string;
  stack?: string;
  source?: string;
}

export interface FeedbackContext {
  session_id: string;
  captured_at: string;
  url: string;
  title: string;
  user_agent: string;
  viewport: { w: number; h: number; dpr: number };
  color_scheme: 'dark' | 'light';
  timezone: string;
  locale: string;
  scroll: { x: number; y: number };
  last_element: { selector: string; text: string } | null;
  perf: {
    load_ms?: number;
    ttfb_ms?: number;
    dom_ms?: number;
    long_tasks?: number;
    heap_used_mb?: number;
    heap_limit_mb?: number;
    connection?: { type?: string; downlink?: number; rtt?: number };
  };
  breadcrumbs: Breadcrumb[];
  console: ConsoleEntry[];
  network: NetworkEntry[];
  errors: ErrorEntry[];
}

/** Payload POSTed to the feedback-report Edge Function. */
export interface FeedbackBundle {
  kind: FeedbackKind;
  expectation: string;
  reporter_email?: string;
  route: string;
  app_version: string;
  app_commit?: string;
  session_id: string;
  context: FeedbackContext;
  screenshot?: string | null;
}
