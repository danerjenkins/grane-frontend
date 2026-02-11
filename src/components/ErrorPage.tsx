import { Link, useNavigate } from 'react-router-dom';
import { Wheat, Sparkles, RefreshCw } from 'lucide-react';

type ErrorPageProps = {
  title?: string;
  message?: string;
  statusCode?: number;
};

function getDefaults(statusCode?: number) {
  if (statusCode === 500) {
    return {
      title: 'We’ll be back with warm bread soon.',
      message:
        'Something went a little off in the kitchen. Give us a moment, and we’ll have things ready again.',
      statusCode: 500,
    };
  }

  return {
    title: 'This page didn’t rise.',
    message:
      'Looks like this page isn’t here. The oven’s warm though — let’s get you back to fresh bread.',
    statusCode: statusCode ?? 404,
  };
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
          <div className="flex items-center gap-3 rounded-full border border-white/70 bg-white/80 px-4 py-2 shadow-sm">
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

        <div className="rounded-3xl border border-white/70 bg-white/90 p-8 shadow-xl md:p-12">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-strong">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Error {resolvedCode}
            </span>
            <span className="text-xs font-semibold text-secondary">
              We saved your spot in line.
            </span>
          </div>

          <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-5xl">{resolvedTitle}</h1>
          <p className="mt-4 text-base leading-relaxed text-secondary md:text-lg">
            {resolvedMessage}
          </p>

          <div className="mt-8 grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl bg-muted/70 p-6">
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

            <div className="rounded-2xl border border-dashed border-neutral-200 bg-surface p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-secondary">
                Popular paths
              </p>
              <div className="mt-4 space-y-3">
                <Link
                  to="/"
                  className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-text transition hover:bg-muted"
                >
                  Back to Home
                  <span aria-hidden="true">→</span>
                </Link>
                <Link
                  to="/bake-days"
                  className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-text transition hover:bg-muted"
                >
                  Browse Bake Days
                  <span aria-hidden="true">→</span>
                </Link>
                <Link
                  to="/about#contact"
                  className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-text transition hover:bg-muted"
                >
                  Contact Grane
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-xl bg-text px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-text/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-strong"
            >
              Take me home
            </Link>
            <Link
              to="/bake-days"
              className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-surface px-6 py-3 text-base font-semibold text-text shadow-sm transition hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-strong"
            >
              Order fresh bread
            </Link>
            {isServerError ? (
              <button
                type="button"
                onClick={() => navigate(0)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 py-3 text-base font-semibold text-text shadow-sm transition hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-strong"
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
