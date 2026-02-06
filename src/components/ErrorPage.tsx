import { Link } from 'react-router-dom';
import { Wheat } from 'lucide-react';

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
  const fallback = getDefaults(statusCode);
  const resolvedTitle = title ?? fallback.title;
  const resolvedMessage = message ?? fallback.message;
  const resolvedCode = statusCode ?? fallback.statusCode;

  return (
    <main className="min-h-screen bg-muted px-6 py-16 text-text">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand-strong">
          <Wheat className="h-7 w-7" aria-hidden="true" />
        </div>

        <p className="text-xs font-semibold tracking-[0.3em] text-secondary uppercase">
          {resolvedCode}
        </p>
        <h1 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight">{resolvedTitle}</h1>
        <p className="mt-4 text-base md:text-lg text-secondary leading-relaxed">
          {resolvedMessage}
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-text px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-text/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-strong"
          >
            Back to Home
          </Link>
          <Link
            to="/bake-days"
            className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-surface px-6 py-3 text-base font-semibold text-text shadow-sm transition hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-strong"
          >
            Order Now
          </Link>
        </div>

        <div className="mt-6">
          <Link
            to="/about#contact"
            className="text-sm font-semibold text-text underline hover:text-secondary transition"
          >
            Contact Grane
          </Link>
        </div>
      </div>
    </main>
  );
}
