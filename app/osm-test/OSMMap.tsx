"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import "./leafletIconFix";

const center: LatLngExpression = [51.505, -0.09];

export default function OSMMap() {
  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: "400px", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">
          OpenStreetMap
        </a> contributors'
      />
      <Marker position={center}>
        <Popup>
          Test marker<br />
          Leaflet + Next.js
        </Popup>
      </Marker>
    </MapContainer>
  );
}
