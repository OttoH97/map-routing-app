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
    const tolerance = 0.1; // ±10%
    const maxAttempts = 5;
    const delayMs = 1500; // 1 second between attempts to respect rate limit
    let bestRoute: { coords: LatLngExpression[]; distanceKm: number } | null = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Generate a random midpoint for the loop
      const bearing = Math.random() * 360;
      const mid = destinationPoint(
        start as [number, number],
        (distanceKm * 1000) / 2,
        bearing
      );

      const url = `https://graphhopper.com/api/1/route` +
        `?point=${startLat},${startLng}` +
        `&point=${mid[0]},${mid[1]}` +
        `&point=${startLat},${startLng}` +
        `&profile=foot` +
        `&points_encoded=false` +
        `&key=${process.env.NEXT_PUBLIC_GRAPHHOPPER_KEY}`;

      try {
        const res = await fetch(url);
        const data = await res.json();

        if (!data.paths || data.paths.length === 0) {
          console.warn(`Attempt ${attempt + 1}: no path returned`);
          // Wait before next attempt
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }

        const path = data.paths[0];
        const actualKm = path.distance / 1000;
        const coords = path.points.coordinates.map(
          ([lng, lat]: [number, number]) => [lat, lng]
        );

        const error = Math.abs(actualKm - distanceKm);

        // Accept if within tolerance, else track closest
        if (actualKm >= distanceKm * (1 - tolerance) &&
            actualKm <= distanceKm * (1 + tolerance)) {
          console.log(`Accepted route on attempt ${attempt + 1}: ${actualKm.toFixed(2)} km`);
          setRoute(coords);
          return;
        } else {
          if (!bestRoute || error < Math.abs(bestRoute.distanceKm - distanceKm)) {
            bestRoute = { coords, distanceKm: actualKm };
          }
          console.log(`Attempt ${attempt + 1}: ${actualKm.toFixed(2)} km (outside tolerance)`);
        }

      } catch (err) {
        console.error(`Error fetching GraphHopper route on attempt ${attempt + 1}:`, err);
      }

      // Wait before next attempt to avoid exceeding rate limit
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    // Use best match if none were within tolerance
    if (bestRoute) {
      console.warn(`Using closest match after ${maxAttempts} attempts: ${bestRoute.distanceKm.toFixed(2)} km`);
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
