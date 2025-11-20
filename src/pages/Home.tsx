import '../App.css';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 px-4 py-16 text-center">
      <div className="max-w-3xl w-full">
        {/* Title */}
        <h1 className="text-5xl font-bold mb-4 text-gray-900 font-serif">
          Grane Bakery
        </h1>

        {/* Subtitle / Availability */}
        <p className="text-xl text-gray-700 mb-10">
          Fresh sourdough returning the{' '}
          <span className="font-semibold">week of Thanksgiving</span>.<br />
          Pre-orders will open very soon!
        </p>

        {/* Hero Image */}
        <div className="flex items-center justify-center mb-12">
          <img
            src="/IMG_6188.jpg"
            alt="Fresh sourdough loaf"
            className="rounded-2xl w-72 h-72 object-cover shadow-md"
          />
        </div>

        {/* Call to Action */}
        <div className="flex flex-col items-center gap-4">
          <a
            href="/bake-days"
            className="inline-block bg-black text-white px-8 py-4 rounded-xl text-lg font-medium hover:bg-neutral-800 transition shadow"
          >
            Order Now
          </a>
        </div>
      </div>
    </main>
  );
}
