import React from 'react';

export default function About() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 px-4 py-10 text-center">
      <h1 className="text-4xl font-bold mb-4">About Me</h1>
      <p className="text-lg">
        Hi! I'm Dane, and I bake naturally fermented sourdough here in Provo, Utah.
      </p>
      <br/>
      {/* Profile Image */}
      <img src="/IMG_1097.jpg" alt="Me" className="rounded-xl w-60 h-60 object-cover" />
    </main>
  );
}
