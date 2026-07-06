import type { LatLngExpression } from "leaflet";

interface DistanceMarkerPoint {
  latlng: LatLngExpression;
  distanceKm: number;
}

/**
 * Calculate points along a route polyline at regular intervals (e.g., every km)
 */
export function calculateDistanceMarkers(
  coords: LatLngExpression[],
  intervalKm: number = 1.0,
  unit: "km" | "mi" = "km"
): DistanceMarkerPoint[] {
  if (coords.length < 2) return [];

  const conversionFactor = unit === "mi" ? 1.60934 : 1; // km to mi or vice versa
  
  const markers: DistanceMarkerPoint[] = [];
  let cumulativeDistance = 0;
  let nextMarkerDistance = intervalKm;

  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1] as [number, number];
    const curr = coords[i] as [number, number];
    
    // Calculate distance between consecutive points using Haversine formula
    const segmentDistance = haversineDistance(prev[0], prev[1], curr[0], curr[1]);
    cumulativeDistance += segmentDistance;

    // Check if we've passed a marker interval
    while (cumulativeDistance >= nextMarkerDistance && i < coords.length) {
      // Interpolate the exact position at the marker distance
      const remaining = nextMarkerDistance - (cumulativeDistance - segmentDistance);
      const ratio = remaining / segmentDistance;
      
      const lat = prev[0] + (curr[0] - prev[0]) * ratio;
      const lng = prev[1] + (curr[1] - prev[1]) * ratio;
      
      markers.push({
        latlng: [lat, lng],
        distanceKm: nextMarkerDistance / conversionFactor
      });

      nextMarkerDistance += intervalKm;
    }
  }

  return markers;
}

/**
 * Haversine formula to calculate distance between two points in km
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
