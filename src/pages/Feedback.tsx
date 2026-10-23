import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, MessageSquare } from 'lucide-react';
import {
  listMessages,
  listMyReports,
  postReply,
  reopenReport,
  reporterStatusLabel,
  type BugMessage,
  type BugReportRow,
} from '../api/feedback';
import { OPEN_FEEDBACK_EVENT } from '../components/feedback/FeedbackWidget';
import { formatDateTime, KIND_LABELS } from '../feedback/format';

const STATUS_CHIP: Record<string, string> = {
  Submitted: 'bg-info-soft text-info',
  Reviewing: 'bg-warning-soft text-warning',
  Fixed: 'bg-success-soft text-success',
  Reviewed: 'bg-muted text-secondary',
};

function ReportCard({ report, onChanged }: { report: BugReportRow; onChanged: () => void }) {
  const [messages, setMessages] = useState<BugMessage[]>([]);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const label = reporterStatusLabel(report);

  useEffect(() => {
    let active = true;
    listMessages(report.id)
      .then((data) => active && setMessages(data))
      .catch((err) => active && setError(err instanceof Error ? err.message : 'Failed to load'));
    return () => {
      active = false;
    };
  }, [report.id, report.last_message_at]);

  const handleReply = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!reply.trim()) return;
    try {
      setBusy(true);
      setError(null);
      const message = await postReply(report.id, reply);
      setMessages((prev) => [...prev, message]);
      setReply('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reply');
    } finally {
      setBusy(false);
    }
  };

  const handleReopen = async () => {
    try {
      setBusy(true);
      setError(null);
      await reopenReport(report.id);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reopen');
    } finally {
      setBusy(false);
    }
  };

  const timeline = [
    { label: 'Submitted', at: report.created_at },
    report.triaged_at && { label: 'Reviewing', at: report.triaged_at },
    report.resolved_at && { label, at: report.resolved_at },
  ].filter(Boolean) as { label: string; at: string }[];

  return (
    <article className="admin-card p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-secondary">
          <span className="font-medium text-text">{KIND_LABELS[report.kind]}</span>
          <span>·</span>
          <span>{report.route ?? '/'}</span>
        </div>
        <span className={`status-chip ${STATUS_CHIP[label]}`}>{label}</span>
      </div>

      <p className="whitespace-pre-wrap text-text">
        {report.expectation?.trim() || (
          <span className="italic text-secondary">(screenshot only)</span>
        )}
      </p>

      <ol className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-secondary">
        {timeline.map((step) => (
          <li key={step.label}>
            <span className="font-medium text-text">{step.label}</span> {formatDateTime(step.at)}
          </li>
        ))}
      </ol>

      {report.status === 'resolved' && report.reporter_note && (
        <div className="banner banner-success flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <p className="text-sm">{report.reporter_note}</p>
        </div>
      )}

      {messages.length > 0 && (
        <ul className="space-y-2 border-t border-neutral-200 pt-4">
          {messages.map((m) => (
            <li
              key={m.id}
              className={`rounded-lg px-3 py-2 text-sm ${
                m.sender_role === 'team' ? 'bg-brand-soft text-text' : 'ml-8 bg-muted text-text'
              }`}
            >
              <p className="mb-1 text-xs text-secondary">
                {m.sender_role === 'team' ? 'Grane' : 'You'} · {formatDateTime(m.created_at)}
              </p>
              <p className="whitespace-pre-wrap">{m.body}</p>
            </li>
          ))}
        </ul>
      )}

      {error && <div className="banner banner-error text-sm">{error}</div>}

      <form onSubmit={handleReply} className="flex gap-2">
        <input
          value={reply}
          onChange={(e) => setReply(e.target.value.slice(0, 2000))}
          placeholder="Add a reply…"
          className="input-base"
          aria-label="Reply"
        />
        <button type="submit" className="btn-secondary" disabled={busy || !reply.trim()}>
          Reply
        </button>
      </form>

      {report.status === 'resolved' && (
        <button type="button" onClick={handleReopen} className="link-info" disabled={busy}>
          Still happening? Reopen this report
        </button>
      )}
    </article>
  );
}

export default function Feedback() {
  const [reports, setReports] = useState<BugReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      setReports(await listMyReports());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load your feedback');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const fixedCount = reports.filter((r) => r.resolution === 'fixed').length;

  return (
    <main className="min-h-screen bg-muted px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <Link to="/account" className="text-sm text-secondary hover:text-text">
            ← Back to account
          </Link>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event(OPEN_FEEDBACK_EVENT))}
            className="btn-neutral text-sm"
          >
            <MessageSquare className="h-4 w-4" />
            Send feedback
          </button>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-text mb-2">Your feedback</h1>
          <p className="text-secondary">
            Everything you&apos;ve told us, and what we did about it.
          </p>
          {reports.length > 0 && (
            <p className="mt-3 inline-flex rounded-full bg-success-soft px-3 py-1 text-sm font-medium text-success">
              You&apos;ve sent {reports.length} {reports.length === 1 ? 'report' : 'reports'}
              {fixedCount > 0 && `, ${fixedCount} led to a fix`}
            </p>
          )}
        </div>

        {loading && (
          <div className="admin-card p-6">
            <p className="text-sm text-secondary">Loading your feedback...</p>
          </div>
        )}

        {!loading && error && (
          <div className="banner banner-error p-6">
            <h2 className="mb-2 text-lg font-semibold">We hit a snag</h2>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && reports.length === 0 && (
          <div className="admin-card p-8 text-center">
            <p className="text-sm text-secondary">
              You haven&apos;t sent any feedback yet. Use the Feedback button in the corner of any
              page.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {reports.map((report) => (
            <ReportCard key={report.id} report={report} onChanged={load} />
          ))}
        </div>
      </div>
    </main>
  );
}
