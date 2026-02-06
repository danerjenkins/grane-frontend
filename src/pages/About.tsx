import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, Clock, Leaf, ArrowRight, Wheat, Mail } from 'lucide-react';

type SectionId = 'top' | 'how-it-works' | 'about' | 'faq' | 'contact';

type AccordionItem = {
  id: string;
  question: string;
  answer: React.ReactNode;
};

export default function About() {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState<SectionId>('top');
  const observerRef = useRef<IntersectionObserver | null>(null);

  const sectionIds = useMemo<SectionId[]>(
    () => ['top', 'how-it-works', 'about', 'faq', 'contact'],
    []
  );

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

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible[0]?.target?.id) {
          setActiveSection(visible[0].target.id as SectionId);
        }
      },
      {
        rootMargin: '0px 0px -65% 0px',
        threshold: [0.05, 0.2, 0.4],
      }
    );

    sectionIds.forEach((id) => {
      const section = document.getElementById(id);
      if (section) observerRef.current?.observe(section);
    });

    return () => observerRef.current?.disconnect();
  }, [sectionIds]);

  const handleNavClick = (id: SectionId) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const accordionItems: AccordionItem[] = useMemo(
    () => [
      {
        id: 'faq-1',
        question: 'What makes Grane bread different?',
        answer: (
          <p className="text-secondary leading-relaxed">
            Every loaf is naturally fermented using a sourdough culture, hand-shaped, and baked in
            small batches. We use just three ingredients: flour, water, and salt. No commercial
            yeast, no additives, no shortcuts. Each bake is intentional and personal. Learn more
            about the story behind Grane in the{' '}
            <a href="#about" className="font-semibold text-text underline hover:text-secondary">
              About section
            </a>
            .
          </p>
        ),
      },
      {
        id: 'faq-2',
        question: 'Why do I need to order ahead?',
        answer: (
          <p className="text-secondary leading-relaxed">
            Bake days help me plan fermentation schedules and keep everything fresh. Ordering ahead
            ensures you get what you want and that nothing is wasted.
          </p>
        ),
      },
      {
        id: 'faq-3',
        question: 'Where do I pick up my order?',
        answer: (
          <p className="text-secondary leading-relaxed">
            Pickups are in Provo, Utah on the scheduled bake day. The exact address and pickup
            window are sent after you place your order.
          </p>
        ),
      },
      {
        id: 'faq-4',
        question: 'Can I request a custom order?',
        answer: (
          <p className="text-secondary leading-relaxed">
            Absolutely. Reach out anytime and we’ll chat about what’s possible.
          </p>
        ),
      },
      {
        id: 'faq-5',
        question: 'Why bake days?',
        answer: (
          <p className="text-secondary leading-relaxed">
            Small-batch baking means everything is made fresh, ordered beforehand, and baked
            specifically for you on a scheduled bake day.
          </p>
        ),
      },
      {
        id: 'faq-6',
        question: 'What are the benefits of bake days?',
        answer: (
          <ul className="grid gap-2 text-secondary leading-relaxed">
            <li>— Maximum freshness</li>
            <li>— Better planning and predictable supply</li>
            <li>— Reduced waste through pre-orders</li>
            <li>— Small-batch quality and intentional craftsmanship</li>
            <li>— Fair access to limited items</li>
          </ul>
        ),
      },
      {
        id: 'faq-7',
        question: 'What should I know before ordering?',
        answer: (
          <ul className="grid gap-3 text-secondary leading-relaxed">
            <li>
              <span className="font-semibold">Orders have deadlines.</span> Each bake day has a
              cutoff time to place your order. This helps me plan baking schedules accurately.
            </li>
            <li>
              <span className="font-semibold">Quantities are limited.</span> Small-batch means
              quantities are carefully controlled. Popular items may sell out, so ordering early is
              wise.
            </li>
            <li>
              <span className="font-semibold">Pickup is local.</span> All pickups are in Provo, Utah
              on the scheduled bake day. Exact time and location details arrive after you order.
            </li>
            <li>
              <span className="font-semibold">Anything is possible.</span> Can't wait until a set
              bake day? Have special requests? Reach out—we can talk about custom orders.
            </li>
          </ul>
        ),
      },
    ],
    []
  );

  return (
    <main className="min-h-screen bg-muted text-text">
      <div id="top" />
      {/* Hero */}
      <section className="px-4 py-16 md:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand-strong">
            <Wheat className="h-7 w-7" />
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
              How ordering works
            </a>
            <a
              href="#contact"
              onClick={handleNavClick('contact')}
              className="inline-flex items-center justify-center rounded-xl border border-transparent bg-brand-soft px-8 py-4 text-base font-semibold text-brand-strong shadow-sm transition hover:bg-brand-soft/80"
            >
              Questions? Contact Grane
            </a>
          </div>
        </div>
      </section>

      {/* Sticky Subnav */}
      <div className="sticky top-0 z-40 border-b border-neutral-200 bg-surface/90 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4">
          <nav className="flex items-center gap-3 py-3 overflow-x-auto">
            {sectionIds
              .filter((id) => id !== 'top')
              .map((id) => {
                const labelMap: Record<Exclude<SectionId, 'top'>, string> = {
                  'how-it-works': 'How ordering works',
                  about: 'About',
                  faq: 'FAQ',
                  contact: 'Contact',
                };
                const label = labelMap[id as Exclude<SectionId, 'top'>];
                const isActive = activeSection === id;
                return (
                  <a
                    key={id}
                    href={`#${id}`}
                    onClick={handleNavClick(id)}
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-strong ${
                      isActive
                        ? 'bg-brand-soft text-brand-strong'
                        : 'text-secondary hover:text-text'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {label}
                  </a>
                );
              })}
          </nav>
        </div>
      </div>

      {/* How It Works Section */}
      <section id="how-it-works" className="px-4 py-16 bg-surface">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-3">How ordering works</h2>
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

      {/* About Me */}
      <section id="about" className="px-4 py-16">
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
              className="rounded-xl w-full h-full max-h-[700px] object-cover"
            />
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
            {accordionItems.map((item) => (
              <Accordion key={item.id} item={item} />
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="px-4 py-16 bg-surface">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-bold mb-3">Contact</h2>
            <p className="text-lg text-secondary">The best way to reach me is by email.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
            <form
              className="rounded-2xl border border-neutral-200 bg-muted p-6 shadow-sm"
              action="mailto:support@granebakery.com"
              method="post"
              encType="text/plain"
            >
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-text">
                    Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    className="mt-2 w-full rounded-xl border border-neutral-200 bg-surface px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-strong"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-text">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="mt-2 w-full rounded-xl border border-neutral-200 bg-surface px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-strong"
                    placeholder="you@email.com"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-text">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    className="mt-2 w-full rounded-xl border border-neutral-200 bg-surface px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-strong"
                    placeholder="How can I help?"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-text px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-text/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-strong"
                >
                  <Mail className="h-4 w-4" /> Send Email
                </button>
              </div>
            </form>

            <div className="rounded-2xl border border-neutral-200 bg-muted p-6 shadow-sm text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-soft text-brand-strong">
                <Mail className="h-5 w-5" />
              </div>
              <p className="text-sm text-secondary mb-4">support@granebakery.com</p>
              <a
                href="mailto:support@granebakery.com"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-text px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-text/90"
              >
                <Mail className="h-4 w-4" /> Email Me
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Accordion({ item }: { item: AccordionItem }) {
  const buttonId = `${item.id}-button`;
  const panelId = `${item.id}-panel`;

  return (
    <details className="group border border-neutral-200 rounded-xl bg-surface p-6 hover:shadow-md transition">
      <summary
        id={buttonId}
        aria-controls={panelId}
        className="flex items-center justify-between font-semibold text-lg text-text select-none cursor-pointer"
      >
        {item.question}
        <span className="transition group-open:rotate-180" aria-hidden="true">
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
      <div id={panelId} role="region" aria-labelledby={buttonId} className="mt-4">
        {item.answer}
      </div>
    </details>
  );
}
