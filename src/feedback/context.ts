import { lastElement, longTasks, rings } from './rings';
import { scrub } from './scrub';
import type { FeedbackContext } from './types';

const SESSION_KEY = 'grane.feedback.session';

export function getSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

type NavigatorWithExtras = Navigator & {
  connection?: { effectiveType?: string; downlink?: number; rtt?: number };
};
type PerformanceWithMemory = Performance & {
  memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number };
};

function perfSnapshot(): FeedbackContext['perf'] {
  const perf: FeedbackContext['perf'] = { long_tasks: longTasks };
  try {
    const nav = performance.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined;
    if (nav) {
      perf.load_ms = Math.round(nav.loadEventEnd - nav.startTime) || undefined;
      perf.ttfb_ms = Math.round(nav.responseStart - nav.requestStart);
      perf.dom_ms = Math.round(nav.domContentLoadedEventEnd - nav.startTime);
    }
    const memory = (performance as PerformanceWithMemory).memory;
    if (memory) {
      perf.heap_used_mb = Math.round(memory.usedJSHeapSize / 1048576);
      perf.heap_limit_mb = Math.round(memory.jsHeapSizeLimit / 1048576);
    }
    const connection = (navigator as NavigatorWithExtras).connection;
    if (connection) {
      perf.connection = {
        type: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
      };
    }
  } catch {
    // best-effort
  }
  return perf;
}

export function buildContext(): FeedbackContext {
  return {
    session_id: getSessionId(),
    captured_at: new Date().toISOString(),
    url: scrub(`${location.pathname}${location.search}`, 300),
    title: scrub(document.title, 160),
    user_agent: navigator.userAgent,
    viewport: { w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio },
    color_scheme: window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    locale: navigator.language,
    scroll: { x: Math.round(window.scrollX), y: Math.round(window.scrollY) },
    last_element: lastElement,
    perf: perfSnapshot(),
    breadcrumbs: [...rings.breadcrumbs],
    console: [...rings.console],
    network: [...rings.network],
    errors: [...rings.errors],
  };
}
