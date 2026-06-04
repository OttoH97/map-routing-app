import type { LatLngExpression } from "leaflet";

/**
 * Calculate a destination point given a start point, distance (meters), and bearing (degrees).
 * Uses spherical geometry (haversine-based) for accuracy.
 */
export function destinationPoint(
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
