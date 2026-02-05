import { ArrowRight, Clock, Mail, MessageCircle } from 'lucide-react';

export default function Contact() {
  return (
    <main className="min-h-screen bg-muted px-4 py-14">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand-strong">
            <MessageCircle className="h-7 w-7" />
          </div>
          <h1 className="mb-3 text-4xl font-bold">Get in Touch</h1>
          <p className="mx-auto max-w-xl text-sm text-secondary">
            Have a question about an upcoming bake day, ingredients, allergies, pickups, or just
            want to say hi? I’d love to hear from you. Grane is a small one-person bakery, so every
            message goes straight to me — Dane.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-neutral-200 bg-surface p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand-strong">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold">Email Grane</h2>
                <p className="text-sm text-secondary">Fastest way to reach me</p>
              </div>
            </div>

            <a
              href="mailto:support@granebakery.com"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-text px-8 py-4 text-base font-semibold text-white shadow-sm transition hover:bg-text/90"
            >
              <Mail className="h-4 w-4" /> Email Me
            </a>

            <div className="mt-6 space-y-4 text-secondary">
              <p className="inline-flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-brand-strong" /> Typical response time: within the
                same day
              </p>

              <div className="rounded-xl bg-muted p-4 text-sm leading-relaxed">
                <p className="font-semibold text-text mb-2">You can reach out about:</p>
                <ul className="space-y-1">
                  <li>— order questions</li>
                  <li>— bake day availability</li>
                  <li>— custom requests</li>
                  <li>— ingredients or allergies</li>
                  <li>— or anything else!</li>
                </ul>
              </div>

              <p className="text-sm">
                If you're unsure what to order or new to sourdough, I’m happy to help you pick
                something you'll love.
              </p>

              <a
                href="/about#faq"
                className="inline-flex items-center gap-2 font-semibold text-text underline hover:text-secondary transition"
              >
                Check our FAQ <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-surface p-6 shadow-sm flex items-center justify-center">
            <img
              src="/IMG_6188.jpg"
              alt="Freshly baked bread"
              className="rounded-xl w-full h-full max-h-[420px] object-cover"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
