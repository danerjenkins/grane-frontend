/**
 * Global capture instrumentation for feedback reports.
 * Installed once at boot; keeps the last RING_CAP entries of each ring.
 */
import { scrub, scrubStack } from './scrub';
import type { Breadcrumb, ConsoleEntry, ErrorEntry, NetworkEntry } from './types';

const RING_CAP = 25;

export const rings = {
  breadcrumbs: [] as Breadcrumb[],
  console: [] as ConsoleEntry[],
  network: [] as NetworkEntry[],
  errors: [] as ErrorEntry[],
};

export let lastElement: { selector: string; text: string } | null = null;
export let longTasks = 0;

let installed = false;

function push<T>(ring: T[], entry: T) {
  ring.push(entry);
  if (ring.length > RING_CAP) ring.splice(0, ring.length - RING_CAP);
}

/** A short, reasonably stable selector for an element (tag#id.class1.class2, or [data-*]). */
function selectorFor(el: Element): string {
  const tag = el.tagName.toLowerCase();
  if (el.id) return `${tag}#${el.id}`;
  const testId = el.getAttribute('data-testid') ?? el.getAttribute('aria-label');
  if (testId)
    return `${tag}[${el.hasAttribute('data-testid') ? 'data-testid' : 'aria-label'}="${testId.slice(0, 40)}"]`;
  const classes = Array.from(el.classList)
    .filter((c) => !c.includes(':') && c.length < 30)
    .slice(0, 2);
  return classes.length ? `${tag}.${classes.join('.')}` : tag;
}

function isFeedbackIgnored(el: Element) {
  return Boolean(el.closest('[data-feedback-ignore]'));
}

export function recordNav(path: string) {
  push(rings.breadcrumbs, { t: Date.now(), type: 'nav', detail: scrub(path, 160) });
}

export function installCapture(skipUrlIncludes: string[] = []) {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  // console.*
  (['log', 'info', 'warn', 'error'] as const).forEach((level) => {
    const original = console[level].bind(console);
    console[level] = (...args: unknown[]) => {
      try {
        push(rings.console, {
          t: Date.now(),
          level,
          text: scrub(args.map((a) => (typeof a === 'string' ? a : scrub(a, 300))).join(' '), 300),
        });
      } catch {
        // never let capture break logging
      }
      original(...args);
    };
  });

  // fetch
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const method = (
      init?.method ?? (input instanceof Request ? input.method : 'GET')
    ).toUpperCase();
    const skip = skipUrlIncludes.some((s) => url.includes(s));
    const started = performance.now();
    try {
      const res = await originalFetch(input, init);
      if (!skip) {
        push(rings.network, {
          t: Date.now(),
          method,
          url: scrub(url, 300),
          status: res.status,
          ms: Math.round(performance.now() - started),
          ok: res.ok,
        });
      }
      return res;
    } catch (err) {
      if (!skip) {
        push(rings.network, {
          t: Date.now(),
          method,
          url: scrub(url, 300),
          status: 0,
          ms: Math.round(performance.now() - started),
          ok: false,
        });
      }
      throw err;
    }
  };

  // thrown errors
  window.addEventListener('error', (event) => {
    push(rings.errors, {
      t: Date.now(),
      message: scrub(event.message || String(event.error), 300),
      stack: scrubStack(event.error instanceof Error ? event.error.stack : undefined),
      source: event.filename
        ? scrub(`${event.filename}:${event.lineno}:${event.colno}`, 300)
        : undefined,
    });
  });
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    push(rings.errors, {
      t: Date.now(),
      message: scrub(reason instanceof Error ? reason.message : reason, 300),
      stack: scrubStack(reason instanceof Error ? reason.stack : undefined),
      source: 'unhandledrejection',
    });
  });

  // clicks + inputs
  document.addEventListener(
    'click',
    (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target || isFeedbackIgnored(target)) return;
      const el =
        target.closest('button, a, input, select, textarea, [role="button"], label') ?? target;
      const text = (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 60);
      const selector = selectorFor(el);
      lastElement = { selector, text: scrub(text, 60) };
      push(rings.breadcrumbs, {
        t: Date.now(),
        type: 'click',
        detail: scrub(text ? `${selector} "${text}"` : selector, 160),
      });
    },
    true
  );
  document.addEventListener(
    'change',
    (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target || isFeedbackIgnored(target)) return;
      // Field identity only, never the value.
      const name = target.getAttribute('name') ?? target.getAttribute('id') ?? '';
      push(rings.breadcrumbs, {
        t: Date.now(),
        type: 'input',
        detail: scrub(`${selectorFor(target)}${name ? ` (${name})` : ''}`, 160),
      });
    },
    true
  );

  // long tasks
  try {
    const observer = new PerformanceObserver((list) => {
      longTasks += list.getEntries().length;
    });
    observer.observe({ type: 'longtask', buffered: true });
  } catch {
    // unsupported browser
  }
}
