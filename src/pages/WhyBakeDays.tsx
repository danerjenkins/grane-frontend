import { Link, useLocation } from 'react-router-dom';
import { Calendar, Clock, Leaf } from 'lucide-react';
import { useEffect } from 'react';

export default function WhyBakeDays() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash === '#faq') {
      const faqElement = document.getElementById('faq');
      if (faqElement) {
        setTimeout(() => {
          faqElement.scrollIntoView({ behavior: 'smooth' });
        }, 0);
      }
    }
  }, [location.hash]);

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* Hero Section */}
      <section className="px-4 py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-5xl md:text-6xl font-bold font-serif tracking-tight mb-6">
            Why Bake Days
          </h1>
          <p className="text-xl md:text-2xl text-neutral-700 leading-relaxed mb-4">
            Small-batch baking means everything is made fresh, ordered beforehand, and baked
            specifically for you on a scheduled bake day.
          </p>
          <p className="text-lg text-neutral-600 leading-relaxed mb-10">
            No guessing. No sitting on shelves. Just exceptional, artisanal sourdough made when you
            need it.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Link
              to="/bake-days"
              className="inline-flex items-center justify-center rounded-xl bg-neutral-900 px-8 py-4 text-base font-semibold text-white shadow-sm transition hover:bg-neutral-800"
            >
              View Upcoming Bake Days
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-xl border bg-white px-8 py-4 text-base font-semibold text-neutral-900 shadow-sm transition hover:bg-neutral-50"
            >
              How it works
            </a>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="px-4 py-16 bg-white">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold font-serif mb-3">How it works</h2>
            <p className="text-lg text-neutral-600">Three simple steps to fresh, artisanal bread</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-8 shadow-sm transition hover:shadow-md">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
                <Calendar className="h-6 w-6 text-amber-900" />
              </div>
              <h3 className="text-xl font-semibold mb-3">1. Choose a bake day</h3>
              <p className="text-neutral-600 leading-relaxed">
                Browse upcoming bake dates and see what's being made that day.
              </p>
            </div>

            {/* Step 2 */}
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-8 shadow-sm transition hover:shadow-md">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
                <Clock className="h-6 w-6 text-amber-900" />
              </div>
              <h3 className="text-xl font-semibold mb-3">2. Order before cutoff</h3>
              <p className="text-neutral-600 leading-relaxed">
                Reserve your loaves and items before the ordering window closes. Quantities are
                limited.
              </p>
            </div>

            {/* Step 3 */}
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-8 shadow-sm transition hover:shadow-md">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
                <Leaf className="h-6 w-6 text-amber-900" />
              </div>
              <h3 className="text-xl font-semibold mb-3">3. Pick up fresh</h3>
              <p className="text-neutral-600 leading-relaxed">
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
            <h2 className="text-4xl font-bold font-serif mb-3">Why bake days are better</h2>
            <p className="text-lg text-neutral-600">
              The benefits of small-batch, intentional baking
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Benefit 1 */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm transition hover:shadow-md">
              <h3 className="text-lg font-semibold mb-3">Maximum freshness</h3>
              <p className="text-neutral-600 leading-relaxed">
                Your bread is baked the day you pick it up. No day-old loaves, no deep freezing—just
                peak quality.
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm transition hover:shadow-md">
              <h3 className="text-lg font-semibold mb-3">Predictable supply</h3>
              <p className="text-neutral-600 leading-relaxed">
                You always know what's available and when. No more checking back hoping bread is in
                stock.
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm transition hover:shadow-md">
              <h3 className="text-lg font-semibold mb-3">Better planning</h3>
              <p className="text-neutral-600 leading-relaxed">
                Schedule your pickup in advance. Perfect for meal planning and reducing last-minute
                stress.
              </p>
            </div>

            {/* Benefit 4 */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm transition hover:shadow-md">
              <h3 className="text-lg font-semibold mb-3">Support intentional craftsmanship</h3>
              <p className="text-neutral-600 leading-relaxed">
                Pre-orders mean I bake exactly what you need—no waste, no overproduction. Pure
                craft.
              </p>
            </div>

            {/* Benefit 5 */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm transition hover:shadow-md">
              <h3 className="text-lg font-semibold mb-3">Community connection</h3>
              <p className="text-neutral-600 leading-relaxed">
                You're supporting a small, local microbakery and building direct relationships with
                what you eat.
              </p>
            </div>

            {/* Benefit 6 */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm transition hover:shadow-md">
              <h3 className="text-lg font-semibold mb-3">Guaranteed quality</h3>
              <p className="text-neutral-600 leading-relaxed">
                Every loaf gets the time and attention it deserves. No shortcuts. No compromises.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What This Means For You */}
      <section className="px-4 py-16 bg-white">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold font-serif mb-3">What this means for you</h2>
            <p className="text-lg text-neutral-600">A few things to know before you order</p>
          </div>

          <div className="space-y-5">
            <div className="flex gap-4">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-amber-200 flex items-center justify-center text-sm font-semibold text-amber-900">
                ✓
              </div>
              <p className="text-lg text-neutral-700 leading-relaxed">
                <span className="font-semibold">Orders have deadlines.</span> Each bake day has a
                cutoff time to place your order. This helps me plan baking schedules accurately.
              </p>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-amber-200 flex items-center justify-center text-sm font-semibold text-amber-900">
                ✓
              </div>
              <p className="text-lg text-neutral-700 leading-relaxed">
                <span className="font-semibold">Quantities are limited.</span> Small-batch means
                quantities are carefully controlled. Popular items may sell out, so ordering early
                is wise.
              </p>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-amber-200 flex items-center justify-center text-sm font-semibold text-amber-900">
                ✓
              </div>
              <p className="text-lg text-neutral-700 leading-relaxed">
                <span className="font-semibold">Pickup is local.</span> All pickups are in Provo,
                Utah on the scheduled bake day. Exact time and location details arrive after you
                order.
              </p>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-amber-200 flex items-center justify-center text-sm font-semibold text-amber-900">
                ✓
              </div>
              <p className="text-lg text-neutral-700 leading-relaxed">
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
            <h2 className="text-4xl font-bold font-serif mb-3">Frequently asked questions</h2>
          </div>

          <div className="space-y-4">
            {/* FAQ 1 */}
            <details className="group border border-neutral-200 rounded-xl bg-white p-6 hover:shadow-md transition cursor-pointer">
              <summary className="flex items-center justify-between font-semibold text-lg text-neutral-900 select-none">
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
              <p className="mt-4 text-neutral-700 leading-relaxed">
                Every loaf is naturally fermented using a sourdough culture, hand-shaped, and baked
                in small batches. We use just three ingredients: flour, water, and salt. No
                commercial yeast, no additives, no shortcuts. Each bake is intentional and personal.
              </p>
            </details>

            {/* FAQ 2 */}
            <details className="group border border-neutral-200 rounded-xl bg-white p-6 hover:shadow-md transition cursor-pointer">
              <summary className="flex items-center justify-between font-semibold text-lg text-neutral-900 select-none">
                How far in advance do I need to order?
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
              <p className="mt-4 text-neutral-700 leading-relaxed">
                Most bake days have a 24-48 hour ordering window. You'll see the exact cutoff time
                when you choose your bake day. This timing allows me to source ingredients and plan
                my baking schedule precisely.
              </p>
            </details>

            {/* FAQ 3 */}
            <details className="group border border-neutral-200 rounded-xl bg-white p-6 hover:shadow-md transition cursor-pointer">
              <summary className="flex items-center justify-between font-semibold text-lg text-neutral-900 select-none">
                Can I freeze my bread?
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
              <p className="mt-4 text-neutral-700 leading-relaxed">
                Absolutely! Sourdough freezes beautifully. Simply wrap your loaf in foil or a
                freezer bag, and it will keep for several weeks. Thaw at room temperature or reheat
                wrapped in foil for a few minutes in the oven to restore freshness.
              </p>
            </details>

            {/* FAQ 4 */}
            <details className="group border border-neutral-200 rounded-xl bg-white p-6 hover:shadow-md transition cursor-pointer">
              <summary className="flex items-center justify-between font-semibold text-lg text-neutral-900 select-none">
                What if I need something custom?
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
              <p className="mt-4 text-neutral-700 leading-relaxed">
                Have a special request or unusual timeline? Reach out directly via{' '}
                <a
                  href="/contact"
                  className="font-semibold text-neutral-900 underline hover:text-neutral-700"
                >
                  the contact page
                </a>
                . I love working on custom orders and can often accommodate requests with a bit of
                notice.
              </p>
            </details>

            {/* FAQ 5 */}
            <details className="group border border-neutral-200 rounded-xl bg-white p-6 hover:shadow-md transition cursor-pointer">
              <summary className="flex items-center justify-between font-semibold text-lg text-neutral-900 select-none">
                What's the best way to store fresh sourdough?
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
              <p className="mt-4 text-neutral-700 leading-relaxed">
                Keep your loaf in a paper bag or linen cloth at room temperature. Avoid plastic
                bags, which trap moisture and soften the crust. The bread will stay delicious for
                2-3 days. For longer storage, wrap and freeze. Never refrigerate—cold temperatures
                stale bread faster.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="px-4 py-16 bg-white">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold font-serif mb-6">Ready to order?</h2>
          <p className="text-xl text-neutral-700 leading-relaxed mb-10">
            Check the schedule, choose your bake day, and reserve your spot.
          </p>
          <Link
            to="/bake-days"
            className="inline-flex items-center justify-center rounded-xl bg-neutral-900 px-10 py-5 text-lg font-semibold text-white shadow-sm transition hover:bg-neutral-800"
          >
            View Upcoming Bake Days
          </Link>
        </div>
      </section>
    </main>
  );
}
