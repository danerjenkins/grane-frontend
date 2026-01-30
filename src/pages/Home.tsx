import { Link } from 'react-router-dom';
import '../App.css';

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-14">
      <div className="mx-auto w-full max-w-5xl">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl border bg-white shadow-sm">
          {/* subtle top accent */}
          <div className="h-1 w-full bg-brand-soft" />

          <div className="grid grid-cols-1 gap-10 px-6 py-12 md:grid-cols-2 md:px-12">
            {/* Copy */}
            <div className="text-center md:text-left">
              <p className="mb-4 inline-flex items-center rounded-full border bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-700">
                Small-batch sourdough • Provo pickup
              </p>

              <h1 className="text-5xl font-bold tracking-tight text-neutral-900 font-serif">
                Grane Bakery
              </h1>

              <p className="mt-5 text-lg leading-relaxed text-neutral-700">
                Hand-shaped, naturally leavened, and baked in small batches. Grane is a microbakery
                focused on a few excellent loaves and seasonal treats — made fresh for pickup on set
                bake days.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center md:justify-start justify-center">
                <Link
                  to="/bake-days"
                  className="inline-flex items-center justify-center rounded-xl bg-neutral-900 px-8 py-4 text-base font-semibold text-white shadow-sm transition hover:bg-neutral-800"
                >
                  Choose a Bake Day
                </Link>

                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center rounded-xl border bg-white px-8 py-4 text-base font-semibold text-neutral-900 shadow-sm transition hover:bg-neutral-50"
                >
                  How it works
                </a>
              </div>
            </div>

            {/* Image */}
            <div className="flex items-center justify-center">
              <div className="w-full max-w-sm overflow-hidden rounded-3xl border bg-neutral-50 shadow-sm">
                <img
                  src="/IMG_6188.jpg"
                  alt="Fresh sourdough loaf"
                  className="h-80 w-full object-cover"
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Steps */}
        <section id="how-it-works" className="mt-10">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900">
              How ordering works
            </h2>
            <p className="mt-3 text-sm text-neutral-600">
              A simple pre-order flow so everything is baked fresh on bake day.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-strong">
                🗓️
              </div>
              <h3 className="text-base font-semibold text-neutral-900">1) Choose a Bake Day</h3>
              <p className="mt-2 text-sm text-neutral-600">
                Pick a highlighted date to see what’s being baked for that day.
              </p>
            </div>

            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-strong">
                🥖
              </div>
              <h3 className="text-base font-semibold text-neutral-900">2) Reserve Your Loaves</h3>
              <p className="mt-2 text-sm text-neutral-600">Add items while quantities last!</p>
            </div>

            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-strong">
                📍
              </div>
              <h3 className="text-base font-semibold text-neutral-900">3) Pick Up in Provo</h3>
              <p className="mt-2 text-sm text-neutral-600">
                Pickup is local on bake day. Exact details arrive after you order.
              </p>
            </div>
          </div>
        </section>

        <footer className="mt-10 text-center">
          <p className="text-xs text-neutral-500">
            © {new Date().getFullYear()} Grane Bakery • Microbakery sourdough in Provo
          </p>
        </footer>
      </div>
    </main>
  );
}
