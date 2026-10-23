import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ClipboardCopy, Terminal } from 'lucide-react';
import {
  askReporter,
  getFeedback,
  getReporterProfile,
  getScreenshotUrl,
  listFeedbackEvents,
  listFeedbackMessages,
  reopenFeedback,
  resolveFeedback,
  triageFeedback,
  type BugEvent,
  type ReporterProfile,
  type Resolution,
} from '../../api/admin/feedbackAdmin';
import type { BugMessage, BugReportRow } from '../../api/feedback';
import { buildRepairMarkdown } from '../../feedback/repairMarkdown';
import { formatDateTime, KIND_LABELS } from '../../feedback/format';

function clock(t: number) {
  return new Date(t).toLocaleTimeString();
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="admin-card p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-secondary">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function AdminFeedbackDetail() {
  const { feedbackId = '' } = useParams();
  const [report, setReport] = useState<BugReportRow | null>(null);
  const [reporter, setReporter] = useState<ReporterProfile | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [messages, setMessages] = useState<BugMessage[]>([]);
  const [events, setEvents] = useState<BugEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [severity, setSeverity] = useState<BugReportRow['severity']>(null);
  const [summary, setSummary] = useState('');
  const [showFixed, setShowFixed] = useState(false);
  const [note, setNote] = useState('');
  const [commit, setCommit] = useState('');
  const [duplicateOf, setDuplicateOf] = useState('');
  const [question, setQuestion] = useState('');

  const load = useCallback(async () => {
    try {
      setError(null);
      const row = await getFeedback(feedbackId);
      setReport(row);
      setSeverity(row.severity);
      setSummary(row.summary ?? '');
      const [profile, url, thread, history] = await Promise.all([
        row.user_id ? getReporterProfile(row.user_id) : Promise.resolve(null),
        row.screenshot_path ? getScreenshotUrl(row.screenshot_path) : Promise.resolve(null),
        listFeedbackMessages(row.id),
        listFeedbackEvents(row.id),
      ]);
      setReporter(profile);
      setScreenshotUrl(url);
      setMessages(thread);
      setEvents(history);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
    }
  }, [feedbackId]);

  useEffect(() => {
    void load();
  }, [load]);

  const run = async (label: string, action: () => Promise<void>) => {
    try {
      setBusy(true);
      setError(null);
      setNotice(null);
      await action();
      setNotice(label);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setNotice(label);
    } catch {
      setError('Clipboard is unavailable in this browser.');
    }
  };

  if (!report) {
    return (
      <main className="bg-muted px-6 py-10">
        <div className="max-w-5xl mx-auto">
          {error ? (
            <div className="banner banner-error">{error}</div>
          ) : (
            <p className="text-sm text-secondary">Loading…</p>
          )}
        </div>
      </main>
    );
  }

  const ctx = report.context ?? {};
  const id8 = report.id.slice(0, 8);
  const fixCommand = `/fix-bug ${id8}`;
  const repairBundle = `${buildRepairMarkdown(report)}\n## context.json\n\`\`\`json\n${JSON.stringify(ctx, null, 2)}\n\`\`\`\n`;
  const failedRequests = (ctx.network ?? []).filter((n) => !n.ok);
  const consoleErrors = (ctx.console ?? []).filter(
    (c) => c.level === 'error' || c.level === 'warn'
  );

  const closeAs = (resolution: Resolution) =>
    run(`Closed as ${resolution.replace('_', ' ')}.`, () =>
      resolveFeedback(report.id, {
        resolution,
        reporterNote: note.trim() || undefined,
        duplicateOf: resolution === 'duplicate' ? duplicateOf.trim() : undefined,
      })
    );

  return (
    <main className="bg-muted px-6 py-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <Link to="/admin/feedback" className="text-sm text-secondary hover:text-text">
          ← Back to inbox
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text">
              {KIND_LABELS[report.kind]} · {id8}
            </h1>
            <p className="text-sm text-secondary">
              {report.route ?? '/'} · v{report.app_version ?? '?'}
              {report.app_commit && ` (${report.app_commit})`} · {formatDateTime(report.created_at)}{' '}
              · <span className="capitalize">{report.status}</span>
              {report.resolution && ` (${report.resolution.replace('_', ' ')})`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-neutral text-sm"
              onClick={() => copy(fixCommand, `Copied "${fixCommand}". Paste it into Claude Code.`)}
            >
              <Terminal className="h-4 w-4" /> Open in Claude Code
            </button>
            <button
              type="button"
              className="btn-secondary text-sm"
              onClick={() => copy(repairBundle, 'Copied the repair bundle.')}
            >
              <ClipboardCopy className="h-4 w-4" /> Copy repair bundle
            </button>
          </div>
        </div>

        {notice && <div className="banner banner-success">{notice}</div>}
        {error && <div className="banner banner-error">{error}</div>}

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <Section title="What they said">
              <p className="whitespace-pre-wrap text-text">
                {report.expectation?.trim() || (
                  <span className="italic text-secondary">(no note, see context)</span>
                )}
              </p>
              <p className="mt-3 text-xs text-secondary">
                {reporter
                  ? `${reporter.name ?? 'Customer'} · ${reporter.email ?? ''}`
                  : report.reporter_email
                    ? `Guest · ${report.reporter_email}`
                    : 'Guest (no email)'}{' '}
                · {report.reporter_role ?? 'unknown'} · source {report.source}
              </p>
            </Section>

            {screenshotUrl && (
              <Section title="Screenshot">
                <a href={screenshotUrl} target="_blank" rel="noreferrer">
                  <img
                    src={screenshotUrl}
                    alt="Reporter's screen"
                    className="w-full rounded-lg border border-neutral-200"
                  />
                </a>
              </Section>
            )}

            {(ctx.errors?.length ?? 0) > 0 && (
              <Section title="Errors (thrown)">
                <ul className="space-y-2 font-mono text-xs">
                  {ctx.errors!.map((e, i) => (
                    <li key={i} className="rounded bg-danger-soft p-2 text-danger">
                      <p>
                        {clock(e.t)} {e.message} {e.source && `(${e.source})`}
                      </p>
                      {e.stack && <pre className="mt-1 whitespace-pre-wrap">{e.stack}</pre>}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {failedRequests.length > 0 && (
              <Section title="Failed requests">
                <ul className="space-y-1 font-mono text-xs">
                  {failedRequests.map((n, i) => (
                    <li key={i} className="text-danger">
                      {clock(n.t)} {n.method} {n.url} → {n.status} ({n.ms}ms)
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {consoleErrors.length > 0 && (
              <Section title="Console warnings and errors">
                <ul className="space-y-1 font-mono text-xs">
                  {consoleErrors.map((c, i) => (
                    <li key={i} className={c.level === 'error' ? 'text-danger' : 'text-warning'}>
                      {clock(c.t)} [{c.level}] {c.text}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            <Section title="What they did">
              {(ctx.breadcrumbs?.length ?? 0) === 0 ? (
                <p className="text-sm text-secondary">No trail captured.</p>
              ) : (
                <ol className="space-y-1 font-mono text-xs text-text">
                  {ctx.breadcrumbs!.map((b, i) => (
                    <li key={i}>
                      <span className="text-secondary">{clock(b.t)}</span>{' '}
                      <span className="font-semibold">{b.type}</span> {b.detail}
                    </li>
                  ))}
                </ol>
              )}
              {ctx.last_element && (
                <p className="mt-3 text-xs text-secondary">
                  Last clicked: <code>{ctx.last_element.selector}</code> “{ctx.last_element.text}”
                </p>
              )}
            </Section>

            <Section title="Conversation">
              {messages.length === 0 && (
                <p className="mb-3 text-sm text-secondary">No messages yet.</p>
              )}
              <ul className="mb-3 space-y-2">
                {messages.map((m) => (
                  <li
                    key={m.id}
                    className={`rounded-lg px-3 py-2 text-sm ${
                      m.sender_role === 'team' ? 'ml-8 bg-brand-soft' : 'bg-muted'
                    }`}
                  >
                    <p className="mb-1 text-xs text-secondary">
                      {m.sender_role === 'team' ? 'Team' : 'Reporter'} ·{' '}
                      {formatDateTime(m.created_at)}
                    </p>
                    <p className="whitespace-pre-wrap text-text">{m.body}</p>
                  </li>
                ))}
              </ul>
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!question.trim()) return;
                  void run('Question sent to the reporter.', async () => {
                    await askReporter(report.id, question);
                    setQuestion('');
                  });
                }}
              >
                <input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value.slice(0, 2000))}
                  className="input-base"
                  placeholder="Ask the reporter a question…"
                  aria-label="Question for the reporter"
                />
                <button type="submit" className="btn-secondary" disabled={busy || !question.trim()}>
                  Ask
                </button>
              </form>
            </Section>
          </div>

          <div className="space-y-6">
            {report.status !== 'resolved' && (
              <Section title="Triage">
                <div className="space-y-3">
                  <div className="flex gap-2">
                    {(['low', 'med', 'high'] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSeverity(s)}
                        className={`flex-1 rounded-lg border px-3 py-1.5 text-sm capitalize ${
                          severity === s
                            ? 'border-text bg-text text-white'
                            : 'border-neutral-300 text-secondary hover:bg-muted'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <input
                    value={summary}
                    onChange={(e) => setSummary(e.target.value.slice(0, 280))}
                    className="input-base"
                    placeholder="Short summary"
                    aria-label="Summary"
                  />
                  <button
                    type="button"
                    className="btn-neutral w-full text-sm"
                    disabled={busy}
                    onClick={() =>
                      run('Triaged.', () => triageFeedback(report.id, severity, summary))
                    }
                  >
                    Save triage
                  </button>
                </div>
              </Section>
            )}

            {report.status !== 'resolved' ? (
              <Section title="Close">
                <div className="space-y-3">
                  {!showFixed ? (
                    <button
                      type="button"
                      className="btn-primary w-full text-sm"
                      onClick={() => setShowFixed(true)}
                    >
                      Fixed…
                    </button>
                  ) : (
                    <form
                      className="space-y-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        void run('Marked fixed. The reporter has been notified.', () =>
                          resolveFeedback(report.id, {
                            resolution: 'fixed',
                            reporterNote: note,
                            fixedCommit: commit.trim() || undefined,
                          })
                        );
                      }}
                    >
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value.slice(0, 600))}
                        rows={3}
                        required
                        className="input-base resize-none"
                        placeholder="One warm sentence for the reporter (required)"
                        aria-label="Note for the reporter"
                      />
                      <input
                        value={commit}
                        onChange={(e) => setCommit(e.target.value)}
                        className="input-base"
                        placeholder="Fix commit (optional)"
                        aria-label="Fix commit"
                      />
                      <button
                        type="submit"
                        className="btn-primary w-full text-sm"
                        disabled={busy || !note.trim()}
                      >
                        Mark fixed and notify
                      </button>
                    </form>
                  )}

                  <p className="pt-2 text-xs text-secondary">
                    Close as… (the note above is optional here)
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {(['noise', 'wontfix', 'by_design'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        className="btn-muted text-xs"
                        disabled={busy}
                        onClick={() => closeAs(r)}
                      >
                        {r.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={duplicateOf}
                      onChange={(e) => setDuplicateOf(e.target.value)}
                      className="input-base text-sm"
                      placeholder="Duplicate of (id)"
                      aria-label="Duplicate of"
                    />
                    <button
                      type="button"
                      className="btn-muted text-xs"
                      disabled={busy || !duplicateOf.trim()}
                      onClick={() => closeAs('duplicate')}
                    >
                      Duplicate
                    </button>
                  </div>
                </div>
              </Section>
            ) : (
              <Section title="Resolution">
                <p className="text-sm text-text capitalize">
                  {report.resolution?.replace('_', ' ')} via {report.resolved_via}
                  {report.fixed_commit && ` · ${report.fixed_commit}`}
                </p>
                {report.reporter_note && (
                  <p className="mt-2 text-sm text-secondary">“{report.reporter_note}”</p>
                )}
                <button
                  type="button"
                  className="btn-secondary mt-4 w-full text-sm"
                  disabled={busy}
                  onClick={() => run('Reopened.', () => reopenFeedback(report.id))}
                >
                  Reopen
                </button>
              </Section>
            )}

            <Section title="Environment">
              <dl className="space-y-1 text-xs">
                {[
                  ['URL', ctx.url],
                  [
                    'Viewport',
                    ctx.viewport && `${ctx.viewport.w}×${ctx.viewport.h} @${ctx.viewport.dpr}x`,
                  ],
                  ['Scroll', ctx.scroll && `${ctx.scroll.x}, ${ctx.scroll.y}`],
                  ['Theme', ctx.color_scheme],
                  ['Time zone', ctx.timezone],
                  ['Locale', ctx.locale],
                  ['Load', ctx.perf?.load_ms != null && `${ctx.perf.load_ms}ms`],
                  ['Network', ctx.perf?.connection?.type],
                  ['Browser', ctx.user_agent],
                ]
                  .filter(([, v]) => v)
                  .map(([k, v]) => (
                    <div key={k as string} className="flex gap-2">
                      <dt className="w-20 flex-shrink-0 text-secondary">{k}</dt>
                      <dd className="break-all text-text">{v}</dd>
                    </div>
                  ))}
              </dl>
            </Section>

            <Section title="History">
              <ol className="space-y-1 text-xs">
                {events.map((e) => (
                  <li key={e.id}>
                    <span className="font-semibold text-text">{e.kind}</span>{' '}
                    <span className="text-secondary">
                      via {e.via} · {formatDateTime(e.at)}
                      {e.resolution && ` · ${e.resolution}`}
                    </span>
                  </li>
                ))}
              </ol>
            </Section>
          </div>
        </div>
      </div>
    </main>
  );
}
