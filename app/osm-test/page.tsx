"use client";

import Link from "next/link";
import dynamic from "next/dynamic";

const OSMMap = dynamic(() => import("./OSMMap"), {
  ssr: false,
});

export default function OsmTestPage() {
  return (
    <main style={{ padding: "1rem" }}>
      <div style={{ marginBottom: "1rem" }}>
        <Link
          href="/"
          className="text-[var(--color-accent)] underline hover:text-[var(--color-accent-hover)] transition-colors duration-200"
        >
          ← Back to Home
        </Link>
      </div>
      <h1>OSM Map Test</h1>
      <p>Leaflet map rendered client-side only.</p>
      <OSMMap />
    </main>
  );
}


