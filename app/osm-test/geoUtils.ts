import type { LatLngExpression } from "leaflet";

export function metersToDegrees(meters: number): number {
  // Very rough conversion, good enough for short distances
  return meters / 111_000;
}

export function destinationPoint(
  start: LatLngExpression,
  distanceMeters: number,
  bearingDegrees: number
): LatLngExpression {
  const [lat, lng] = start as [number, number];

  const bearing = (bearingDegrees * Math.PI) / 180;
  const delta = metersToDegrees(distanceMeters);

  const newLat = lat + delta * Math.cos(bearing);
  const newLng = lng + delta * Math.sin(bearing);

  return [newLat, newLng];
}
