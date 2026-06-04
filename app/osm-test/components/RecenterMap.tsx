"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import type { LatLngExpression } from "leaflet";

const DEFAULT_POSITION: LatLngExpression = [51.505, -0.09];

export function RecenterMap({ position }: { position: LatLngExpression }) {
  const map = useMap();

  useEffect(() => {
    map.setView(position, 15, { animate: true });
  }, [position, map]);

  return null;
}

export { DEFAULT_POSITION };
