"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import L from "leaflet";
import "./leafletIconFix";
import { DEFAULT_POSITION } from "./components/RecenterMap";
import { MapClickHandler } from "./components/MapClickHandler";
import { generateManualRoute } from "./services/routeGenerator";

// Custom icon for numbered waypoints
function createWaypointIcon(number: number): L.Icon<L.DivIconOptions> {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      background-color: #3b82f6;
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
  const [route, setRoute] = useState<LatLngExpression[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);

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
      setRoute(null); // Clear existing route when waypoints change
      setRouteInfo(null);
    } else {
      setErrorMessage(`Maximum ${MAX_WAYPOINTS} points reached. Remove a waypoint or generate the route.`);
    }
  };

  const removeWaypoint = (index: number) => {
    setWaypoints(waypoints.filter((_, i) => i !== index));
    setRoute(null);
    setRouteInfo(null);
  };

  async function handleGenerateRoute() {
    if (waypoints.length < 2 || isGenerating || cooldownRemaining > 0) return;
    
    setIsGenerating(true);
    setCooldownRemaining(10);
    setErrorMessage(null);
    try {
      const positions = waypoints.map((wp) => wp.position);
      const result = await generateManualRoute({ waypoints: positions });
      setRoute(result.coords);
      setRouteInfo({ distance: result.distanceKm, duration: result.durationMinutes });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      setErrorMessage(message);
    } finally {
      setIsGenerating(false);
    }
  }

  // Get map center from first waypoint or default
  const mapCenter: LatLngExpression = waypoints.length > 0 
    ? waypoints[0].position 
    : DEFAULT_POSITION;

  return (
    <>
      {/* Controls Panel */}
      <div style={{
        marginBottom: "1rem",
        padding: "1rem",
        backgroundColor: "#f8fafc",
        borderRadius: "0.5rem",
        border: "1px solid #e2e8f0",
      }}>
        <h3 style={{ margin: "0 0 0.75rem 0", fontSize: "1rem" }}>Manual Waypoint Routing</h3>
        
        {/* Waypoint list */}
        {waypoints.length > 0 && (
          <div style={{ marginBottom: "0.75rem", padding: "0.5rem", backgroundColor: "#fff", borderRadius: "0.375rem", border: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "0.25rem" }}>
              Waypoints ({waypoints.length}/{MAX_WAYPOINTS}):
            </div>
            {waypoints.map((wp, index) => (
              <div key={index} style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "0.5rem",
                padding: "0.25rem 0",
                fontSize: "0.875rem",
              }}>
                <span style={{ 
                  backgroundColor: index === 0 ? "#ef4444" : "#3b82f6",
                  color: "white",
                  borderRadius: "50%",
                  width: "20px",
                  height: "20px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  fontWeight: "bold",
                }}>
                  {index === 0 ? "📍" : index}
                </span>
                <span style={{ flex: 1 }}>{getWaypointLabel(index)}</span>
                <span style={{ color: "#6b7280", fontSize: "0.75rem" }}>
                  [{wp.position[0].toFixed(4)}, {wp.position[1].toFixed(4)}]
                </span>
                <button 
                  onClick={() => removeWaypoint(index)}
                  style={{
                    background: "#fee2e2",
                    border: "none",
                    borderRadius: "4px",
                    padding: "2px 6px",
                    cursor: "pointer",
                    fontSize: "12px",
                    color: "#991b1b",
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          {/* Generate Button */}
          <button
            onClick={handleGenerateRoute}
            disabled={waypoints.length < 2 || isGenerating || cooldownRemaining > 0}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: (waypoints.length >= 2 && cooldownRemaining === 0) ? "#3b82f6" : "#9ca3af",
              color: "white",
              border: "none",
              borderRadius: "0.375rem",
              cursor: (waypoints.length >= 2 && cooldownRemaining === 0) ? "pointer" : "not-allowed",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            {isGenerating 
              ? "⏳ Generating..." 
              : cooldownRemaining > 0 
                ? `⏱️ Cooldown: ${cooldownRemaining}s` 
                : "🗺️ Generate Route"}
          </button>

          {/* Clear All Button */}
          <button
            onClick={() => {
              setWaypoints([]);
              setRoute(null);
              setRouteInfo(null);
            }}
            disabled={waypoints.length === 0 || isGenerating}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: waypoints.length > 0 ? "#6b7280" : "#9ca3af",
              color: "white",
              border: "none",
              borderRadius: "0.375rem",
              cursor: waypoints.length > 0 && !isGenerating ? "pointer" : "not-allowed",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            🗑️ Clear All
          </button>

          {/* Instructions */}
          <div style={{ marginLeft: "auto", fontSize: "0.75rem", color: "#6b7280" }}>
            💡 Click map to add points (max {MAX_WAYPOINTS}) • First = Start/Finish, rest = Waypoints
          </div>
        </div>
      </div>

      {/* Route Info */}
      {routeInfo && (
        <div style={{
          marginBottom: "1rem",
          padding: "0.75rem 1rem",
          backgroundColor: "#ecfdf5",
          color: "#065f46",
          borderRadius: "0.375rem",
          fontSize: "0.875rem",
        }}>
          <strong>Route:</strong> {routeInfo.distance.toFixed(2)} km • ~{Math.round(routeInfo.duration)} min walk
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div style={{
          marginBottom: "1rem",
          padding: "0.75rem 1rem",
          backgroundColor: "#fee2e2",
          color: "#991b1b",
          borderRadius: "0.375rem",
          fontSize: "0.875rem",
        }}>
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Map */}
      <MapContainer
        center={mapCenter}
        zoom={waypoints.length > 0 ? 14 : 13}
        style={{ height: "400px", width: "100%", borderRadius: "0.5rem" }}
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
        {route && <Polyline positions={route} color="#3b82f6" weight={4} />}
        
        {/* Enable map clicking to add waypoints */}
        <MapClickHandler onMapClick={handleMapClick} />
      </MapContainer>

      {/* Status Message */}
      {waypoints.length === 0 && (
        <div style={{ marginTop: "1rem", textAlign: "center", color: "#6b7280" }}>
          📍 Click on the map to place your starting point, then add waypoints.
        </div>
      )}

      {waypoints.length > 0 && waypoints.length < MAX_WAYPOINTS && (
        <div style={{ marginTop: "1rem", textAlign: "center", color: "#6b7280" }}>
          📍 {waypoints.length}/{MAX_WAYPOINTS} point{waypoints.length !== 1 ? 's' : ''} placed. Click map to add more, or generate route with {waypoints.length >= 2 ? 'current points' : 'at least one waypoint'}.
        </div>
      )}

      {waypoints.length === MAX_WAYPOINTS && (
        <div style={{ marginTop: "1rem", textAlign: "center", color: "#3b82f6" }}>
          ✅ All {MAX_WAYPOINTS} points placed! Generate route or remove points to add more.
        </div>
      )}

      {waypoints.length >= 2 && !route && (
        <div style={{ marginTop: "0.5rem", textAlign: "center", color: "#10b981" }}>
          🗺️ Ready to generate! Click the button above.
        </div>
      )}
    </>
  );
}
