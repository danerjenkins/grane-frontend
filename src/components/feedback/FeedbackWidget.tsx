import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Bug, CheckCircle2, HelpCircle, Lightbulb, MessageSquare, X } from 'lucide-react';
import { getSession } from '../../api/auth';
import { buildContext, getSessionId } from '../../feedback/context';
import { recordNav } from '../../feedback/rings';
import { prime, takeScreenshot } from '../../feedback/screenshot';
import { submitReport } from '../../feedback/submit';
import type { FeedbackKind } from '../../feedback/types';

const MAX_CHARS = 2000;
const SENT_DISMISS_MS = 4000;

/** Dispatch this from anywhere to open the widget: window.dispatchEvent(new Event(OPEN_FEEDBACK_EVENT)) */
export const OPEN_FEEDBACK_EVENT = 'open-feedback';

type WidgetState = 'launcher' | 'panel' | 'sent';

const KINDS: { value: FeedbackKind; label: string; icon: typeof Bug }[] = [
  { value: 'bug', label: 'Bug', icon: Bug },
  { value: 'confusing', label: 'Confusing', icon: HelpCircle },
  { value: 'idea', label: 'Idea', icon: Lightbulb },
];

export default function FeedbackWidget() {
  const location = useLocation();
  const [state, setState] = useState<WidgetState>('launcher');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [includeScreenshot, setIncludeScreenshot] = useState(true);
  const [zoomed, setZoomed] = useState(false);
  const [description, setDescription] = useState('');
  const [kind, setKind] = useState<FeedbackKind | null>(null);
  const [email, setEmail] = useState('');
  const [signedIn, setSignedIn] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    recordNav(`${location.pathname}${location.search}`);
  }, [location.pathname, location.search]);

  const open = useCallback(async () => {
    if (state === 'panel') return;
    setState('panel');
    setCapturing(true);
    // Capture before the panel paints over the page (the panel is excluded anyway).
    prime();
    const [shot, session] = await Promise.all([takeScreenshot(), getSession().catch(() => null)]);
    setScreenshot(shot);
    setSignedIn(Boolean(session));
    setCapturing(false);
  }, [state]);

  const collapse = useCallback(() => {
    setZoomed(false);
    setState('launcher');
  }, []);

  // Cmd/Ctrl+Shift+F, Escape, and the programmatic open event.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        void open();
      } else if (event.key === 'Escape' && state === 'panel') {
        if (zoomed) setZoomed(false);
        else collapse();
      }
    };
    const onOpen = () => void open();
    window.addEventListener('keydown', onKey);
    window.addEventListener(OPEN_FEEDBACK_EVENT, onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener(OPEN_FEEDBACK_EVENT, onOpen);
    };
  }, [open, collapse, state, zoomed]);

  useEffect(() => {
    if (state === 'panel' && !capturing) textareaRef.current?.focus();
  }, [state, capturing]);

  useEffect(() => {
    if (state !== 'sent') return;
    const timer = window.setTimeout(() => setState('launcher'), SENT_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [state]);

  const canSend =
    !capturing && (description.trim().length > 0 || (includeScreenshot && screenshot));

  const handleSend = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSend) return;

    const context = buildContext();
    const bundle = {
      kind: kind ?? 'bug',
      expectation: description.trim().slice(0, MAX_CHARS),
      reporter_email: !signedIn && email.trim() ? email.trim() : undefined,
      route: location.pathname.slice(0, 256),
      app_version: import.meta.env.VITE_APP_VERSION ?? '0.0.0',
      app_commit: import.meta.env.VITE_APP_COMMIT || undefined,
      session_id: getSessionId(),
      context,
      screenshot: includeScreenshot ? screenshot : null,
    };

    // Optimistic: show success immediately; submitReport queues on failure.
    void submitReport(bundle);
    setDescription('');
    setKind(null);
    setEmail('');
    setScreenshot(null);
    setIncludeScreenshot(true);
    setZoomed(false);
    setState('sent');
  };

  const remaining = MAX_CHARS - description.length;

  return (
    <div data-feedback-ignore className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {state === 'launcher' && (
        <button
          type="button"
          onPointerDown={() => prime()}
          onClick={() => void open()}
          className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-surface px-4 py-2 text-sm font-medium text-text shadow-lg transition-colors hover:bg-muted"
          aria-label="Send feedback (Ctrl+Shift+F)"
          title="Send feedback (Ctrl+Shift+F)"
        >
          <MessageSquare className="h-4 w-4" />
          Feedback
        </button>
      )}

      {state === 'sent' && (
        <div
          role="status"
          className="banner banner-success flex items-center gap-2 bg-surface shadow-lg"
        >
          <CheckCircle2 className="h-4 w-4" />
          Thanks! We got your feedback.
        </div>
      )}

      {state === 'panel' && (
        <form
          onSubmit={handleSend}
          className="surface-card flex max-h-[calc(100dvh-2.5rem)] w-[380px] max-w-[calc(100vw-2.5rem)] flex-col gap-4 overflow-y-auto p-4 shadow-xl"
          aria-label="Feedback"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text">Feedback</h2>
            <button
              type="button"
              onClick={collapse}
              className="rounded p-1 text-secondary hover:bg-muted hover:text-text"
              aria-label="Close feedback"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div>
            <button
              type="button"
              onClick={() => screenshot && setZoomed(true)}
              disabled={!screenshot}
              className="flex h-32 w-full items-center justify-center overflow-hidden rounded-lg border border-neutral-200 bg-muted"
              aria-label="Zoom screenshot"
            >
              {capturing ? (
                <span className="text-sm text-secondary">Capturing screen…</span>
              ) : screenshot ? (
                <img
                  src={screenshot}
                  alt="Screenshot of this page"
                  className={`h-full w-full object-cover object-top ${includeScreenshot ? '' : 'opacity-40'}`}
                />
              ) : (
                <span className="text-sm text-secondary">No screenshot available</span>
              )}
            </button>
            {screenshot && (
              <label className="mt-2 flex items-center gap-2 text-sm text-secondary">
                <input
                  type="checkbox"
                  className="input-check"
                  checked={includeScreenshot}
                  onChange={(e) => setIncludeScreenshot(e.target.checked)}
                />
                Include this screenshot
              </label>
            )}
          </div>

          <div>
            <label
              htmlFor="feedback-description"
              className="mb-1 block text-sm font-medium text-text"
            >
              What should we fix or improve?
            </label>
            <textarea
              id="feedback-description"
              ref={textareaRef}
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, MAX_CHARS))}
              maxLength={MAX_CHARS}
              rows={4}
              placeholder="Tell us anything."
              className="input-base resize-none"
            />
            {remaining < 200 && (
              <p className="mt-1 text-right text-xs text-secondary">{remaining} characters left</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Kind">
            <span className="text-sm text-secondary">It&apos;s:</span>
            {KINDS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={kind === value}
                onClick={() => setKind(kind === value ? null : value)}
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm transition-colors ${
                  kind === value
                    ? 'border-text bg-text text-white'
                    : 'border-neutral-300 text-secondary hover:bg-muted'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          {!signedIn && (
            <div>
              <label htmlFor="feedback-email" className="mb-1 block text-sm font-medium text-text">
                Email{' '}
                <span className="font-normal text-secondary">(optional, so we can reply)</span>
              </label>
              <input
                id="feedback-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.slice(0, 254))}
                placeholder="you@example.com"
                className="input-base"
                autoComplete="email"
              />
            </div>
          )}

          <div className="flex justify-end">
            <button type="submit" className="btn-neutral" disabled={!canSend}>
              Send
            </button>
          </div>
        </form>
      )}

      {zoomed && screenshot && (
        <div className="modal-backdrop" onClick={() => setZoomed(false)}>
          <img
            src={screenshot}
            alt="Screenshot of this page, enlarged"
            className="max-h-full max-w-full rounded-lg shadow-xl"
          />
        </div>
      )}
    </div>
  );
}
