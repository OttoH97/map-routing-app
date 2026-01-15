"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import "./leafletIconFix";

// Simple function to calculate a destination point given distance and bearing
function destinationPoint(
  [lat, lng]: [number, number],
  distanceMeters: number,
  bearingDegrees: number
): [number, number] {
  const R = 6371e3; // Earth radius in meters
  const δ = distanceMeters / R;
  const θ = (bearingDegrees * Math.PI) / 180;
  const φ1 = (lat * Math.PI) / 180;
  const λ1 = (lng * Math.PI) / 180;

  const φ2 = Math.asin(
    Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ)
  );
  const λ2 =
    λ1 +
    Math.atan2(
      Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
      Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2)
    );

  return [(φ2 * 180) / Math.PI, ((λ2 * 180) / Math.PI + 540) % 360 - 180];
}

const DEFAULT_POSITION: LatLngExpression = [51.505, -0.09];

function RecenterMap({ position }: { position: LatLngExpression }) {
  const map = useMap();

  useEffect(() => {
    map.setView(position, 15, { animate: true });
  }, [position, map]);

  return null;
}

export default function OSMMap() {
  const [position, setPosition] = useState<LatLngExpression | null>(null);
  const [route, setRoute] = useState<LatLngExpression[] | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const start: LatLngExpression = [
          pos.coords.latitude,
          pos.coords.longitude,
        ];
        setPosition(start);

        // Fetch a pedestrian loop via GraphHopper
        fetchGraphHopperLoop(start, 5); // 5 km target distance
      },
      () => {
        setPosition(DEFAULT_POSITION);
      }
    );
  }, []);

  function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


  async function fetchGraphHopperLoop(
    start: LatLngExpression,
    distanceKm: number
  ) {
    const [startLat, startLng] = start as [number, number];
    const tolerance = 0.1;
    const maxAttempts = 3;
    const delayMs = 2000;

    let bestRoute: {
      coords: LatLngExpression[];
      distanceKm: number;
    } | null = null;

    const baseRadius = distanceKm * 1000 * 0.16;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const baseBearing = (Math.random() * 360 + attempt * 45) % 360;
      const radiusMeters = baseRadius * (1 - attempt * 0.12);
      
      const wp1 = destinationPoint(start as [number, number], radiusMeters, baseBearing);
      const wp2 = destinationPoint(start as [number, number], radiusMeters, baseBearing + 120);
      const wp3 = destinationPoint(start as [number, number], radiusMeters, baseBearing + 240);

      const url =
        `https://graphhopper.com/api/1/route` +
        `?point=${startLat},${startLng}` +
        `&point=${wp1[0]},${wp1[1]}` +
        `&point=${wp2[0]},${wp2[1]}` +
        `&point=${wp3[0]},${wp3[1]}` +
        `&point=${startLat},${startLng}` +
        `&profile=foot` +
        `&points_encoded=false` +
        `&key=${process.env.NEXT_PUBLIC_GRAPHHOPPER_KEY}`;

      try {
        const res = await fetch(url);
        const data = await res.json();

        if (!data.paths?.length) {
          await new Promise((r) => setTimeout(r, delayMs));
          continue;
        }

        const path = data.paths[0];
        const actualKm = path.distance / 1000;

        const coords = path.points.coordinates.map(
          ([lng, lat]: [number, number]) => [lat, lng]
        );

        const error = Math.abs(actualKm - distanceKm);

        if (
          actualKm >= distanceKm * (1 - tolerance) &&
          actualKm <= distanceKm * (1 + tolerance)
        ) {
          console.log(`Accepted route on attempt ${attempt + 1}: ${actualKm.toFixed(2)} km`);
          setRoute(coords);
          return;
        }

        if (!bestRoute || error < Math.abs(bestRoute.distanceKm - distanceKm)) {
          bestRoute = { coords, distanceKm: actualKm };
        }

        console.log(`Attempt ${attempt + 1}: ${actualKm.toFixed(2)} km`);
      } catch (err) {
        console.error("GraphHopper error:", err);
      }

      await new Promise((r) => setTimeout(r, delayMs));
    }

    if (bestRoute) {
      console.warn(`Using closest match: ${bestRoute.distanceKm.toFixed(2)} km`);
      setRoute(bestRoute.coords);
    }
  }

  return (
    <MapContainer
      center={position ?? DEFAULT_POSITION}
      zoom={15}
      style={{ height: "400px", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap contributors"
      />

      {position && (
        <>
          <RecenterMap position={position} />

          <Marker position={position}>
            <Popup>Start / Finish 📍</Popup>
          </Marker>
        </>
      )}

      {route && <Polyline positions={route} />}
    </MapContainer>
  );
}
