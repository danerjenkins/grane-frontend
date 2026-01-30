export default function About() {
  return (
    <main className="min-h-screen flex flex-col items-center bg-muted px-4 py-14 text-center">
      <h1 className="text-4xl font-bold mb-6">About Me</h1>

      <div className="max-w-2xl space-y-6 text-lg text-secondary leading-relaxed">
        <p>
          Hi! I'm Dane: BYU student, runner, Catan enthusiast, and the baker behind{' '}
          <span className="font-semibold">Grane</span>. I bake naturally fermented sourdough here in
          Provo, Utah.
        </p>
        <p>
          What started as a simple curiosity when I was 16 turned into a passionate chase for the
          perfect loaf. I love the slow, patient rhythm of sourdough. I love the way three simple
          ingredients can turn into something alive, flavorful, and deeply comforting. Baking after
          classes and work as well as on weekends is always a highlight of my week.
        </p>
        <p>
          Between studying Information Systems, working on tech projects, and the occasional run,
          making bread has become my way to slow down and create something real with my hands. Every
          bake is small-batch, personal, and made with care.
        </p>
        <p>
          Grane is more than a side hustle for me it’s the beginning of a dream. I’m building it
          into a small in-home microbakery where I can share naturally fermented bread with friends,
          neighbors, and the community. Thank you for following along and being part of this
          journey.
        </p>
        <p className="pt-4">
          <a
            href="/why-bake-days#faq"
            className="text-text font-semibold underline hover:text-secondary transition"
          >
            Have questions? Check out our FAQ →
          </a>
        </p>{' '}
      </div>

      {/* Profile Image */}
      <img
        src="/IMG_1097.jpg"
        alt="Me"
        className="rounded-xl w-60 h-60 object-cover mt-10 shadow-md"
      />
    </main>
  );
}
