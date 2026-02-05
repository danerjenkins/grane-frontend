import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, Clock, Leaf, ArrowRight, Sparkles } from 'lucide-react';

export default function About() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const sectionId = location.hash.replace('#', '');
      const section = document.getElementById(sectionId);
      if (section) {
        setTimeout(() => {
          section.scrollIntoView({ behavior: 'smooth' });
        }, 0);
      }
    }
  }, [location.hash]);

  return (
    <main className="min-h-screen bg-muted text-text">
      {/* Hero */}
      <section className="px-4 py-16 md:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand-strong">
            <Sparkles className="h-7 w-7" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">About Grane</h1>
          <p className="text-xl md:text-2xl text-secondary leading-relaxed mb-4">
            A microbakery built on slow fermentation, small batches, and the joy of sharing warm
            bread with your community.
          </p>
          <p className="text-lg text-secondary leading-relaxed mb-10">
            Learn the story behind Grane and how bake days keep everything intentional and fresh.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Link
              to="/bake-days"
              className="inline-flex items-center justify-center rounded-xl bg-text px-8 py-4 text-base font-semibold text-white shadow-sm transition hover:bg-text/90"
            >
              View Upcoming Bake Days
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-xl border bg-surface px-8 py-4 text-base font-semibold text-text shadow-sm transition hover:bg-muted"
            >
              How it works
            </a>
          </div>
        </div>
      </section>

      {/* About Me */}
      <section id="about" className="px-4 pb-16">
        <div className="mx-auto max-w-5xl grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-neutral-200 bg-surface p-8 shadow-sm">
            <h2 className="text-3xl font-bold mb-4">Hi, I’m Dane</h2>
            <div className="space-y-5 text-lg text-secondary leading-relaxed">
              <p>
                I’m a BYU student, runner, Catan enthusiast, and the baker behind{' '}
                <span className="font-semibold text-text">Grane</span>. I bake naturally fermented
                sourdough here in Provo, Utah.
              </p>
              <p>
                What started as a simple curiosity when I was 16 turned into a passionate chase for
                the perfect loaf. I love the slow, patient rhythm of sourdough and the way three
                simple ingredients can turn into something alive, flavorful, and deeply comforting.
              </p>
              <p>
                Between studying Information Systems, working on tech projects, and the occasional
                run, making bread has become my way to slow down and create something real with my
                hands. Every bake is small-batch, personal, and made with care.
              </p>
              <p>
                Grane is more than a side hustle for me. I’m building it into a small in-home
                microbakery where I can share naturally fermented bread with friends, neighbors, and
                the community. Thanks for being part of the journey.
              </p>
            </div>
            <div className="mt-6">
              <a
                href="#faq"
                className="inline-flex items-center gap-2 font-semibold text-text underline hover:text-secondary transition"
              >
                Have questions? Check our FAQ <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-surface p-6 shadow-sm flex items-center justify-center">
            <img
              src="/IMG_1097.jpg"
              alt="Dane baking"
              className="rounded-xl w-full h-full max-h-[420px] object-cover"
            />
          </div>
        </div>
      </section>

      {/* Why Bake Days Section */}
      <section id="why-bake-days" className="px-4 py-16">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-4xl font-bold mb-3">Why bake days</h2>
          <p className="text-lg text-secondary">
            Small-batch baking means everything is made fresh, ordered beforehand, and baked
            specifically for you on a scheduled bake day.
          </p>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="px-4 py-16 bg-surface">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-3">How it works</h2>
            <p className="text-lg text-secondary">Three simple steps to fresh, artisanal bread</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-neutral-200 bg-muted p-8 shadow-sm transition hover:shadow-md">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-soft">
                <Calendar className="h-6 w-6 text-brand-strong" />
              </div>
              <h3 className="text-xl font-semibold mb-3">1. Choose a bake day</h3>
              <p className="text-secondary leading-relaxed">
                Browse upcoming bake dates and see what's being made that day.
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-muted p-8 shadow-sm transition hover:shadow-md">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-soft">
                <Clock className="h-6 w-6 text-brand-strong" />
              </div>
              <h3 className="text-xl font-semibold mb-3">2. Order before cutoff</h3>
              <p className="text-secondary leading-relaxed">
                Reserve your loaves and items before the ordering window closes. Quantities are
                limited.
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-muted p-8 shadow-sm transition hover:shadow-md">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-soft">
                <Leaf className="h-6 w-6 text-brand-strong" />
              </div>
              <h3 className="text-xl font-semibold mb-3">3. Pick up fresh</h3>
              <p className="text-secondary leading-relaxed">
                Collect your order on bake day. Everything is made fresh that morning—no exceptions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Bake Days Are Better */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-3">Why bake days are better</h2>
            <p className="text-lg text-secondary">
              The benefits of small-batch, intentional baking
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-neutral-200 bg-surface p-8 shadow-sm transition hover:shadow-md">
              <h3 className="text-lg font-semibold mb-3">Maximum freshness</h3>
              <p className="text-secondary leading-relaxed">
                Your bread is baked the day you pick it up. No day-old loaves, no deep freezing—just
                peak quality.
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-surface p-8 shadow-sm transition hover:shadow-md">
              <h3 className="text-lg font-semibold mb-3">Predictable supply</h3>
              <p className="text-secondary leading-relaxed">
                You always know what's available and when. No more checking back hoping bread is in
                stock.
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-surface p-8 shadow-sm transition hover:shadow-md">
              <h3 className="text-lg font-semibold mb-3">Better planning</h3>
              <p className="text-secondary leading-relaxed">
                Schedule your pickup in advance. Perfect for meal planning and reducing last-minute
                stress.
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-surface p-8 shadow-sm transition hover:shadow-md">
              <h3 className="text-lg font-semibold mb-3">Support intentional craftsmanship</h3>
              <p className="text-secondary leading-relaxed">
                Pre-orders mean I bake exactly what you need—no waste, no overproduction. Pure
                craft.
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-surface p-8 shadow-sm transition hover:shadow-md">
              <h3 className="text-lg font-semibold mb-3">Community connection</h3>
              <p className="text-secondary leading-relaxed">
                You're supporting a small, local microbakery and building direct relationships with
                what you eat.
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-surface p-8 shadow-sm transition hover:shadow-md">
              <h3 className="text-lg font-semibold mb-3">Guaranteed quality</h3>
              <p className="text-secondary leading-relaxed">
                Every loaf gets the time and attention it deserves. No shortcuts. No compromises.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What This Means For You */}
      <section className="px-4 py-16 bg-surface">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-3">What this means for you</h2>
            <p className="text-lg text-secondary">A few things to know before you order</p>
          </div>

          <div className="space-y-5">
            <div className="flex gap-4">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-brand-soft flex items-center justify-center text-sm font-semibold text-brand-strong">
                ✓
              </div>
              <p className="text-lg text-secondary leading-relaxed">
                <span className="font-semibold">Orders have deadlines.</span> Each bake day has a
                cutoff time to place your order. This helps me plan baking schedules accurately.
              </p>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-brand-soft flex items-center justify-center text-sm font-semibold text-brand-strong">
                ✓
              </div>
              <p className="text-lg text-secondary leading-relaxed">
                <span className="font-semibold">Quantities are limited.</span> Small-batch means
                quantities are carefully controlled. Popular items may sell out, so ordering early
                is wise.
              </p>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-brand-soft flex items-center justify-center text-sm font-semibold text-brand-strong">
                ✓
              </div>
              <p className="text-lg text-secondary leading-relaxed">
                <span className="font-semibold">Pickup is local.</span> All pickups are in Provo,
                Utah on the scheduled bake day. Exact time and location details arrive after you
                order.
              </p>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-brand-soft flex items-center justify-center text-sm font-semibold text-brand-strong">
                ✓
              </div>
              <p className="text-lg text-secondary leading-relaxed">
                <span className="font-semibold">Anything is possible.</span> Can't wait until a set
                bake day? Have special requests? Reach out—we can talk about custom orders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-3">Frequently asked questions</h2>
          </div>

          <div className="space-y-4">
            <details className="group border border-neutral-200 rounded-xl bg-surface p-6 hover:shadow-md transition cursor-pointer">
              <summary className="flex items-center justify-between font-semibold text-lg text-text select-none">
                What makes Grane bread different?
                <span className="transition group-open:rotate-180">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                </span>
              </summary>
              <p className="mt-4 text-secondary leading-relaxed">
                Every loaf is naturally fermented using a sourdough culture, hand-shaped, and baked
                in small batches. We use just three ingredients: flour, water, and salt. No
                commercial yeast, no additives, no shortcuts. Each bake is intentional and personal.
                Learn more about the story behind Grane in the{' '}
                <a href="#about" className="font-semibold text-text underline hover:text-secondary">
                  About section
                </a>
                .
              </p>
            </details>

            <details className="group border border-neutral-200 rounded-xl bg-surface p-6 hover:shadow-md transition cursor-pointer">
              <summary className="flex items-center justify-between font-semibold text-lg text-text select-none">
                Why do I need to order ahead?
                <span className="transition group-open:rotate-180">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                </span>
              </summary>
              <p className="mt-4 text-secondary leading-relaxed">
                Bake days help me plan fermentation schedules and keep everything fresh. Ordering
                ahead ensures you get what you want and that nothing is wasted.
              </p>
            </details>

            <details className="group border border-neutral-200 rounded-xl bg-surface p-6 hover:shadow-md transition cursor-pointer">
              <summary className="flex items-center justify-between font-semibold text-lg text-text select-none">
                Where do I pick up my order?
                <span className="transition group-open:rotate-180">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                </span>
              </summary>
              <p className="mt-4 text-secondary leading-relaxed">
                Pickups are in Provo, Utah on the scheduled bake day. The exact address and pickup
                window are sent after you place your order.
              </p>
            </details>

            <details className="group border border-neutral-200 rounded-xl bg-surface p-6 hover:shadow-md transition cursor-pointer">
              <summary className="flex items-center justify-between font-semibold text-lg text-text select-none">
                Can I request a custom order?
                <span className="transition group-open:rotate-180">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                </span>
              </summary>
              <p className="mt-4 text-secondary leading-relaxed">
                Absolutely. Reach out anytime and we’ll chat about what’s possible.
              </p>
            </details>
          </div>
        </div>
      </section>
    </main>
  );
}
