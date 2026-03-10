import { Link, useNavigate } from 'react-router-dom';
import { RefreshCw, Sparkles, Wheat } from 'lucide-react';

type ErrorPageProps = {
  title?: string;
  message?: string;
  statusCode?: number;
};

function getDefaults(statusCode?: number) {
  if (statusCode === 500) {
    return {
      title: "We'll be back with warm bread soon.",
      message:
        "Something went a little off in the kitchen. Give us a moment, and we'll have things ready again.",
      statusCode: 500,
    };
  }

  return {
    title: "This page didn't rise.",
    message:
      "Looks like this page isn't here. The oven is warm though, let's get you back to fresh bread.",
    statusCode: statusCode ?? 404,
  };
}

function QuickLink({ to, children }: { to: string; children: string }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between rounded-xl border border-neutral-200 bg-surface px-4 py-3 text-sm font-semibold text-text transition hover:bg-muted"
    >
      {children}
      <span aria-hidden="true">→</span>
    </Link>
  );
}

export default function ErrorPage({ title, message, statusCode }: ErrorPageProps) {
  const navigate = useNavigate();
  const fallback = getDefaults(statusCode);
  const resolvedTitle = title ?? fallback.title;
  const resolvedMessage = message ?? fallback.message;
  const resolvedCode = statusCode ?? fallback.statusCode;
  const isServerError = resolvedCode === 500;
  const helpfulTips = isServerError
    ? [
        'Give us a minute to reheat the ovens.',
        'Refresh to check if the kitchen is back.',
        'Browse bake days while we fix things.',
      ]
    : [
        'Double-check the link or try a fresh route.',
        'Head home to see what is baking today.',
        'Visit bake days to place an order.',
      ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-muted px-6 py-16 text-text">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-brand-soft opacity-70 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 right-10 h-72 w-72 rounded-full bg-accent-soft opacity-70 blur-3xl" />

      <div className="relative mx-auto max-w-3xl">
        <div className="mb-10 flex items-center justify-center">
          <div className="surface-card flex items-center gap-3 rounded-full bg-surface/80 px-4 py-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-brand-strong">
              <Wheat className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-secondary">
                Grane Kitchen
              </p>
              <p className="text-sm font-semibold">Something went off-recipe</p>
            </div>
          </div>
        </div>

        <div className="surface-card rounded-3xl bg-surface/90 p-8 shadow-xl md:p-12">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-strong">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Error {resolvedCode}
            </span>
            <span className="text-xs font-semibold text-secondary">We saved your spot in line.</span>
          </div>

          <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-5xl">{resolvedTitle}</h1>
          <p className="mt-4 text-base leading-relaxed text-secondary md:text-lg">
            {resolvedMessage}
          </p>

          <div className="mt-8 grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
            <div className="surface-card bg-muted/70 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-secondary">
                Helpful next steps
              </p>
              <ul className="mt-4 space-y-3 text-sm text-text">
                {helpfulTips.map((tip) => (
                  <li key={tip} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-brand-strong" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="surface-card rounded-2xl border-dashed p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-secondary">
                Popular paths
              </p>
              <div className="mt-4 space-y-3">
                <QuickLink to="/">Back to Home</QuickLink>
                <QuickLink to="/bake-days">Browse Bake Days</QuickLink>
                <QuickLink to="/about#contact">Contact Grane</QuickLink>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <Link to="/" className="btn-neutral rounded-xl px-6 py-3 text-base">
              Take me home
            </Link>
            <Link to="/bake-days" className="btn-secondary rounded-xl px-6 py-3 text-base">
              Order fresh bread
            </Link>
            {isServerError ? (
              <button
                type="button"
                onClick={() => navigate(0)}
                className="btn-secondary inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-base"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Reload
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
