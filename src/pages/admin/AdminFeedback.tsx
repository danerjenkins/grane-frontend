import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bug, Camera, HelpCircle, Lightbulb } from 'lucide-react';
import {
  listFeedback,
  type FeedbackSourceFilter,
  type FeedbackStatusFilter,
} from '../../api/admin/feedbackAdmin';
import type { BugReportRow } from '../../api/feedback';
import { timeAgo } from '../../feedback/format';

const STATUS_TABS: FeedbackStatusFilter[] = ['open', 'triaged', 'resolved'];
const SOURCE_OPTIONS: { value: FeedbackSourceFilter; label: string }[] = [
  { value: 'people', label: 'From customers' },
  { value: 'passes', label: 'From our passes' },
  { value: 'all', label: 'All' },
];

const KIND_ICONS = { bug: Bug, confusing: HelpCircle, idea: Lightbulb };

const SEVERITY_CHIP: Record<string, string> = {
  low: 'bg-muted text-secondary',
  med: 'bg-warning-soft text-warning',
  high: 'bg-danger-soft text-danger',
};

export default function AdminFeedback() {
  const [status, setStatus] = useState<FeedbackStatusFilter>('open');
  const [source, setSource] = useState<FeedbackSourceFilter>('people');
  const [reports, setReports] = useState<BugReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    listFeedback(status, source)
      .then((data) => active && setReports(data))
      .catch((err) => active && setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [status, source]);

  return (
    <main className="bg-muted px-6 py-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-text">Feedback</h1>
            <p className="text-secondary">Reports sent from the Feedback button.</p>
          </div>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as FeedbackSourceFilter)}
            className="input-base w-auto"
            aria-label="Queue"
          >
            {SOURCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2" role="tablist">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={status === tab}
              onClick={() => setStatus(tab)}
              className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors ${
                status === tab ? 'bg-text text-white' : 'text-secondary hover:bg-surface'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {error && <div className="banner banner-error">{error}</div>}

        <div className="table-shell divide-y divide-neutral-200">
          {loading && <p className="p-6 text-sm text-secondary">Loading…</p>}
          {!loading && reports.length === 0 && (
            <p className="p-6 text-sm text-secondary">Nothing {status} here.</p>
          )}
          {!loading &&
            reports.map((r) => {
              const Icon = KIND_ICONS[r.kind];
              return (
                <Link
                  key={r.id}
                  to={`/admin/feedback/${r.id}`}
                  className="flex items-start gap-4 px-6 py-4 transition-colors hover:bg-muted"
                >
                  <Icon className="mt-1 h-5 w-5 flex-shrink-0 text-secondary" aria-label={r.kind} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-text">
                      {r.summary || r.expectation?.trim() || `(${r.kind}, no note, see context)`}
                    </p>
                    <p className="text-xs text-secondary">
                      {r.route ?? '/'} · v{r.app_version ?? '?'} · {timeAgo(r.created_at)}
                      {r.source !== 'user' && ` · ${r.source}`}
                      {r.last_message_role === 'reporter' && ' · new reply'}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    {r.severity && (
                      <span className={`status-chip ${SEVERITY_CHIP[r.severity]}`}>
                        {r.severity}
                      </span>
                    )}
                    {r.resolution && (
                      <span className="status-chip bg-success-soft text-success">
                        {r.resolution.replace('_', ' ')}
                      </span>
                    )}
                    {r.screenshot_path && (
                      <Camera className="h-4 w-4 text-secondary" aria-label="Has screenshot" />
                    )}
                  </div>
                </Link>
              );
            })}
        </div>
      </div>
    </main>
  );
}
