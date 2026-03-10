import { CalendarDays, MapPin, Wheat } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <main className="min-h-screen bg-muted px-4 py-14">
      <div className="mx-auto w-full max-w-5xl">
        <section className="surface-card relative overflow-hidden rounded-3xl">
          <div className="h-1 w-full bg-brand-soft" />

          <div className="grid grid-cols-1 gap-10 px-6 py-12 md:grid-cols-2 md:px-12">
            <div className="text-center md:text-left">
              <p className="mb-4 inline-flex items-center rounded-full border border-neutral-200 bg-muted px-3 py-1 text-xs font-medium text-secondary">
                Small-batch sourdough • Provo pickup
              </p>

              <h1 className="text-5xl font-bold tracking-tight text">Grane Bakery</h1>

              <p className="mt-5 text-lg leading-relaxed text-secondary">
                Hand-shaped, naturally leavened, and baked in small batches. Grane is a microbakery
                focused on a few excellent loaves and seasonal treats, made fresh for pickup on set
                bake days.
              </p>

              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:items-center md:justify-start">
                <Link to="/bake-days" className="btn-neutral-lg px-8 py-4 text-base">
                  Choose a Bake Day
                </Link>

                <a href="#how-it-works" className="btn-secondary px-8 py-4 text-base">
                  How it works
                </a>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="surface-card w-full max-w-sm overflow-hidden rounded-3xl bg-muted">
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

        <section id="how-it-works" className="mt-10">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text">How ordering works</h2>
            <p className="mt-3 text-sm text-secondary">
              A simple pre-order flow so everything is baked fresh on bake day.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="surface-card p-6">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-strong">
                <CalendarDays className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text">1) Choose a Bake Day</h3>
              <p className="mt-2 text-sm text-secondary">
                Pick a highlighted date to see what is being baked for that day.
              </p>
            </div>

            <div className="surface-card p-6">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-strong">
                <Wheat className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text">2) Reserve Your Loaves</h3>
              <p className="mt-2 text-sm text-secondary">Add items while quantities last.</p>
            </div>

            <div className="surface-card p-6">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-strong">
                <MapPin className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text">3) Pick Up in Provo</h3>
              <p className="mt-2 text-sm text-secondary">
                Pickup is local on bake day. Exact details arrive after you order.
              </p>
            </div>
          </div>
        </section>

        <footer className="mt-10 text-center">
          <p className="text-xs text-secondary">
            © {new Date().getFullYear()} Grane Bakery • Microbakery sourdough in Provo
          </p>
        </footer>
      </div>
    </main>
  );
}
