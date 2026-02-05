export default function Contact() {
  return (
    <main className="min-h-screen flex flex-col items-center bg-muted px-4 py-14 text-center">
      <h1 className="text-4xl font-bold mb-3">Get in Touch</h1>
      <p className="text-lg text-text max-w-xl mb-8">
        Have a question about an upcoming bake day, ingredients, allergies, pickups, or just want to
        say hi? I’d love to hear from you. Grane is a small one-person bakery, so every message goes
        straight to me — Dane.
      </p>
      <a
        href="mailto:support@granebakery.com"
        className="inline-block bg-text text-white px-8 py-4 rounded-xl text-lg font-medium hover:bg-text/90 transition shadow mb-10"
      >
        Email Me
      </a>

      {/* Additional Information */}
      <div className="text-secondary text-sm max-w-md leading-relaxed space-y-3 mb-10">
        <p>
          <strong>Typical Response Time:</strong> within the same day
        </p>
        <p>
          You can reach out about:
          <br />— order questions
          <br />— bake day availability
          <br />— custom requests
          <br />— ingredients or allergies
          <br />— or anything else!
        </p>
        <p>
          If you're unsure what to order or new to sourdough, I’m happy to help you pick something
          you'll love.
        </p>
        <p className="pt-4 text-text">
          <a href="/about#faq" className="font-semibold underline hover:text-secondary transition">
            Check our FAQ →
          </a>
        </p>{' '}
      </div>

      {/* Image */}
      <img
        src="/IMG_6188.jpg"
        alt="Bread"
        className="rounded-xl w-60 h-60 object-cover shadow-md"
      />
    </main>
  );
}
