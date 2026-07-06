"use client";

import { Marker } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import { divIcon } from "leaflet";

interface DistanceMarker {
  latlng: LatLngExpression;
  distanceKm: number;
}

// Changed return type to 'any' to resolve the DivIcon vs Icon mismatch in React-Leaflet v5 types.
function createDistanceMarkerIcon(distance: number, unit: "km" | "mi"): any {
  const label = `${distance}${unit}`;

  return divIcon({
    className: "distance-marker",
    html: `<div style="background-color: #e04000; color: white; border-radius: 12px; padding: 2px 6px; font-weight: bold; font-size: 10px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); white-space: nowrap;">${label}</div>`,
    iconSize: [40, 20] as const,
    iconAnchor: [20, 10] as const,
    popupAnchor: [0, -10] as const,
  });
}

export function DistanceMarkers({ markers, unit }: { markers: DistanceMarker[]; unit: "km" | "mi" }) {
  return (
    <>
      {markers.map((marker, index) => {
        const icon = createDistanceMarkerIcon(marker.distanceKm, unit);
        return (
          <Marker
            key={`distance-${index}`}
            position={marker.latlng as [number, number]}
            icon={icon}
          />
        );
      })}
    </>
  );
}