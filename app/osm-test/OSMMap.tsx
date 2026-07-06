"use client";

import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import L from "leaflet";
import "./leafletIconFix";
import { DEFAULT_POSITION } from "./components/RecenterMap";
import { MapClickHandler } from "./components/MapClickHandler";
import { generateManualRoute, type RouteResult } from "./services/routeGenerator";
import { ElevationProfile } from "./components/ElevationProfile";
import { DistanceMarkers } from "./components/DistanceMarkers";
import { calculateDistanceMarkers } from "./utils/distanceMarkers";

// Custom icon for numbered waypoints using CSS variables for theme support
function createWaypointIcon(number: number): L.Icon<L.DivIconOptions> {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      background-color: var(--color-accent, #e04000);
      color: white;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 12px;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    ">${number}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

interface Waypoint {
  position: [number, number];
}

function getWaypointLabel(index: number): string {
  return index === 0 ? "Start/Finish" : `Waypoint ${index}`;
}

export default function OSMMap() {
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);

  const MAX_WAYPOINTS = 4; // Start/Finish + up to 3 intermediate (5 total points in URL)

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldownRemaining <= 0) return;

    const interval = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldownRemaining]);

  // Clear error message after 5 seconds
  useEffect(() => {
    if (!errorMessage) return;
    const timer = setTimeout(() => setErrorMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [errorMessage]);

  const handleMapClick = (latlng: LatLngExpression) => {
    // If we have waypoints and user clicks, add a new waypoint
    if (waypoints.length < MAX_WAYPOINTS) {
      // Safely extract coordinates from Leaflet's LatLngExpression type
      const lat = Array.isArray(latlng) ? (latlng[0] as number) : latlng.lat;
      const lng = Array.isArray(latlng) ? (latlng[1] as number) : latlng.lng;
      const position: [number, number] = [lat, lng];

      setWaypoints([...waypoints, { position }]);
      setRouteResult(null); // Clear existing route when waypoints change
    } else {
      setErrorMessage(`Maximum ${MAX_WAYPOINTS} points reached. Remove a waypoint or generate the route.`);
    }
  };

  const removeWaypoint = (index: number) => {
    setWaypoints(waypoints.filter((_, i) => i !== index));
    setRouteResult(null);
  };

  async function handleGenerateRoute() {
    if (waypoints.length < 2 || isGenerating || cooldownRemaining > 0) return;

    setIsGenerating(true);
    setCooldownRemaining(10);
    setErrorMessage(null);
    try {
      const positions = waypoints.map((wp) => wp.position);
      const result = await generateManualRoute({ waypoints: positions });
      setRouteResult(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      setErrorMessage(message);
    } finally {
      setIsGenerating(false);
    }
  }

  // Memoize distance markers to avoid recalculation on every render
  const distanceMarkers = useMemo(() => {
    if (!routeResult?.coords) return [];
    return calculateDistanceMarkers(routeResult.coords, 0.5);
  }, [routeResult]);

  // Get map center from first waypoint or default
  const mapCenter: LatLngExpression = waypoints.length > 0
    ? waypoints[0].position
    : DEFAULT_POSITION;

  return (
    <>
      {/* Controls Panel */}
      <div className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
        <h3 className="m-0 mb-3 text-sm font-medium text-slate-800">Manual Waypoint Routing</h3>

        {/* Waypoint list */}
        {waypoints.length > 0 && (
          <div className="mb-3 p-2 bg-white border border-slate-100 rounded-md">
            <div className="text-xs text-slate-500 mb-1">
              Waypoints ({waypoints.length}/{MAX_WAYPOINTS}):
            </div>
            {waypoints.map((wp, index) => (
              <div key={index} className="flex items-center gap-2 py-1 text-sm">
                <span
                  style={{ backgroundColor: index === 0 ? "#ef4444" : "var(--color-accent)" }}
                  className="text-white rounded-full w-5 h-5 flex items-center justify-center text-[11px] font-bold shrink-0"
                >
                  {index === 0 ? "📍" : index}
                </span>
                <span className="flex-1 text-slate-700">{getWaypointLabel(index)}</span>
                <span className="text-xs text-slate-500 font-mono">
                  [{wp.position[0].toFixed(4)}, {wp.position[1].toFixed(4)}]
                </span>
                <button
                  onClick={() => removeWaypoint(index)}
                  disabled={isGenerating}
                  className="bg-red-50 border-none rounded px-2 py-0.5 cursor-pointer text-xs text-red-800 hover:bg-red-100 disabled:opacity-50"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3 flex-wrap items-center">
          {/* Generate Button */}
          <button
            onClick={handleGenerateRoute}
            disabled={waypoints.length < 2 || isGenerating || cooldownRemaining > 0}
            style={{ backgroundColor: (waypoints.length >= 2 && cooldownRemaining === 0) ? "var(--color-accent)" : "#9ca3af" }}
            className="px-4 py-2 text-white border-none rounded-md cursor-pointer text-sm font-medium disabled:cursor-not-allowed hover:brightness-110 transition-all"
          >
            {isGenerating
              ? "Generating..."
              : cooldownRemaining > 0
                ? `Cooldown: ${cooldownRemaining}s`
                : "Generate Route"}
          </button>

          {/* Clear All Button */}
          <button
            onClick={() => {
              setWaypoints([]);
              setRouteResult(null);
            }}
            disabled={waypoints.length === 0 || isGenerating}
            className="px-4 py-2 bg-slate-500 text-white border-none rounded-md cursor-pointer text-sm font-medium hover:bg-slate-600 transition-all disabled:opacity-50"
          >
            Clear All
          </button>

          {/* Instructions */}
          <div className="ml-auto text-xs text-slate-500">
            💡 Click map to add points (max {MAX_WAYPOINTS}) • First = Start/Finish, rest = Waypoints
          </div>
        </div>
      </div>

      {/* Route Info */}
      {routeResult && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-md text-sm text-emerald-800 flex justify-between items-center">
          <div>
            <strong>Route:</strong> {routeResult.distanceKm.toFixed(2)} km • ~{Math.round(routeResult.durationMinutes)} min walk
          </div>
          <div className="flex gap-2">
            {/* Surface Badges */}
            {routeResult.surfaceBreakdown.slice(0, 3).map((s, i) => (
              <span key={i} className="px-2 py-1 bg-white border border-emerald-200 rounded text-xs capitalize">
                {s.surface}: {s.percentage.toFixed(0)}%
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-md text-sm text-red-800">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Elevation Profile */}
      {routeResult && routeResult.elevationProfile.length > 0 && (
        <div className="mb-4 p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-slate-700 mb-2">Elevation Profile</h3>
          <div className="w-full h-36">
            <ElevationProfile
              elevationData={routeResult.elevationProfile}
              distanceKm={routeResult.distanceKm}
            />
          </div>
        </div>
      )}

      {/* Map */}
      <div className="relative rounded-lg overflow-hidden border border-slate-200 shadow-sm">
        <MapContainer
          center={mapCenter}
          zoom={waypoints.length > 0 ? 14 : 13}
          style={{ height: "400px", width: "100%" }} // MapContainer needs inline styles for dimensions usually, or a wrapper class. I'll keep the style here as it's standard for Leaflet wrappers in React if not using specific CSS modules.
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="© OpenStreetMap contributors"
          />

          {waypoints.map((wp, index) => (
            <Marker
              key={index}
              position={wp.position}
              icon={createWaypointIcon(index === 0 ? 0 : index)}
            >
              <Popup>
                <strong>{getWaypointLabel(index)}</strong><br />
                {wp.position[0].toFixed(6)}, {wp.position[1].toFixed(6)}
              </Popup>
            </Marker>
          ))}

          {/* Draw preview line connecting waypoints */}
          {waypoints.length >= 2 && (
            <Polyline
              positions={waypoints.map((wp) => wp.position)}
              color="#ef4444"
              weight={2}
              dashArray="8, 8"
            />
          )}

          {/* Draw route line when generated */}
          {routeResult && <Polyline positions={routeResult.coords} color="var(--color-accent)" weight={5} />}

          {/* Distance Markers */}
          {routeResult && (
            <DistanceMarkers
              markers={distanceMarkers}
              unit="km"
            />
          )}

          {/* Enable map clicking to add waypoints */}
          <MapClickHandler onMapClick={handleMapClick} />
        </MapContainer>
      </div>

      {/* Status Message */}
      {waypoints.length === 0 && (
        <div className="mt-4 text-center text-slate-500">
          📍 Click on the map to place your starting point, then add waypoints.
        </div>
      )}

      {waypoints.length > 0 && waypoints.length < MAX_WAYPOINTS && (
        <div className="mt-4 text-center text-slate-500">
          📍 {waypoints.length}/{MAX_WAYPOINTS} point{waypoints.length !== 1 ? 's' : ''} placed. Click map to add more, or generate route with {waypoints.length >= 2 ? 'current points' : 'at least one waypoint'}.
        </div>
      )}

      {waypoints.length === MAX_WAYPOINTS && (
        <div className="mt-4 text-center text-blue-600 font-medium">
          ✅ All {MAX_WAYPOINTS} points placed! Generate route or remove points to add more.
        </div>
      )}

      {waypoints.length >= 2 && !routeResult && (
        <div className="mt-2 text-center text-emerald-600">
          🗺️ Ready to generate! Click the button above.
        </div>
      )}
    </>
  );
}