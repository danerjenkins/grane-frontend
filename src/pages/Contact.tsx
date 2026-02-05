export default function Contact() {
  return (
    <main className="min-h-screen bg-muted px-4 py-14 text-center">
      <h1 className="text-3xl font-bold mb-3">Contact</h1>
      <p className="text-sm text-secondary">Please use the contact section on the About page.</p>
      <a
        href="/about#contact"
        className="inline-flex items-center justify-center rounded-xl bg-text px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-text/90 mt-6"
      >
        Go to Contact
      </a>
    </main>
  );
}
