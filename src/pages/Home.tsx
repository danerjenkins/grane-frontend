import '../App.css';
import React from 'react';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 px-4 py-10 text-center">
      <div className="max-w-3xl w-full">
        <h1 className="text-5xl font-bold mb-4 text-gray-900 font-serif">Grane Bakery</h1>
        <p className="text-xl text-gray-700 mb-8">
          I’ll be baking again in <span className="font-semibold">mid-August</span>. Thanks for your
          patience!
        </p>

        <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-10">
          {/* Bread Image */}
          <img src="/IMG_6188.jpg" alt="Bread" className="rounded-xl w-60 h-60 object-cover" />
        </div>

        <a
          href="mailto:support@granebakery.com"
          className="inline-block bg-black text-white px-6 py-3 rounded-lg text-lg font-medium hover:bg-gray-800 transition"
        >
          Request an Order
        </a>
      </div>
    </main>
  );
}
