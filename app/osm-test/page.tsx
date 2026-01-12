"use client";

import dynamic from "next/dynamic";

const OSMMap = dynamic(() => import("./OSMMap"), {
  ssr: false,
});

export default function OsmTestPage() {
  return (
    <main style={{ padding: "1rem" }}>
      <h1>OSM Map Test</h1>
      <p>Leaflet map rendered client-side only.</p>
      <OSMMap />
    </main>
  );
}
