

export default function Menu() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 px-4 py-10 text-center">
      <h1 className="text-4xl font-bold mb-4">Shoot me an email!</h1>
      <a
        href="mailto:support@granebakery.com?subject=Order%20Inquiry&body=Hi%20Grane%20Bakery%2C%0A%0AI%20have%20a%20question%20about..."
        className="inline-block bg-black text-white px-6 py-3 rounded-lg text-lg font-medium hover:bg-gray-800 transition"
      >
        Contact Support
      </a>

      <br />
      {/* Bread Pic */}
      <img src="/IMG_6188.jpg" alt="Me" className="rounded-xl w-60 h-60 object-cover" />
    </main>
  );
}
