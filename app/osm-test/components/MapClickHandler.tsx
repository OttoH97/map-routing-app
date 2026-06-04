"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import type { LatLngExpression, LeafletMouseEvent } from "leaflet";

interface MapClickHandlerProps {
  onMapClick: (latlng: LatLngExpression) => void;
}

export function MapClickHandler({ onMapClick }: MapClickHandlerProps) {
  const map = useMap();

  useEffect(() => {
    const handler = (e: LeafletMouseEvent) => {
      onMapClick([e.latlng.lat, e.latlng.lng]);
    };
    map.on("click", handler);
    return () => {
      map.off("click", handler);
    };
  }, [map, onMapClick]);

  return null;
}
