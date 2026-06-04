"use client";

import type { LatLngExpression } from "leaflet";

interface Waypoint {
  position: [number, number];
}

interface WaypointListProps {
  waypoints: Waypoint[];
  maxWaypoints: number;
  onRemoveWaypoint: (index: number) => void;
}

function getWaypointLabel(index: number): string {
  return index === 0 ? "Start/Finish" : `Waypoint ${index}`;
}

export function WaypointList({ waypoints, maxWaypoints, onRemoveWaypoint }: WaypointListProps) {
  if (waypoints.length === 0) return null;

  return (
    <div style={{ marginBottom: "0.75rem", padding: "0.5rem", backgroundColor: "#fff", borderRadius: "0.375rem", border: "1px solid #e5e7eb" }}>
      <div style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "0.25rem" }}>
        Waypoints ({waypoints.length}/{maxWaypoints}):
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
            onClick={() => onRemoveWaypoint(index)}
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
  );
}

interface ControlsPanelProps {
  waypointsCount: number;
  maxWaypoints: number;
  isGenerating: boolean;
  cooldownRemaining: number;
  onGenerateRoute: () => void;
  onClearAll: () => void;
}

export function ControlsPanel({
  waypointsCount,
  maxWaypoints,
  isGenerating,
  cooldownRemaining,
  onGenerateRoute,
  onClearAll,
}: ControlsPanelProps) {
  const canGenerate = waypointsCount >= 2 && !isGenerating && cooldownRemaining === 0;

  return (
    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
      {/* Generate Button */}
      <button
        onClick={onGenerateRoute}
        disabled={!canGenerate}
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: canGenerate ? "#3b82f6" : "#9ca3af",
          color: "white",
          border: "none",
          borderRadius: "0.375rem",
          cursor: canGenerate ? "pointer" : "not-allowed",
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
        onClick={onClearAll}
        disabled={waypointsCount === 0 || isGenerating}
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: waypointsCount > 0 ? "#6b7280" : "#9ca3af",
          color: "white",
          border: "none",
          borderRadius: "0.375rem",
          cursor: waypointsCount > 0 && !isGenerating ? "pointer" : "not-allowed",
          fontSize: "0.875rem",
          fontWeight: 500,
        }}
      >
        🗑️ Clear All
      </button>

      {/* Instructions */}
      <div style={{ marginLeft: "auto", fontSize: "0.75rem", color: "#6b7280" }}>
        💡 Click map to add points (max {maxWaypoints}) • First = Start/Finish, rest = Waypoints
      </div>
    </div>
  );
}

interface RouteInfoBarProps {
  distance: number;
  duration: number;
}

export function RouteInfoBar({ distance, duration }: RouteInfoBarProps) {
  return (
    <div style={{
      marginBottom: "1rem",
      padding: "0.75rem 1rem",
      backgroundColor: "#ecfdf5",
      color: "#065f46",
      borderRadius: "0.375rem",
      fontSize: "0.875rem",
    }}>
      <strong>Route:</strong> {distance.toFixed(2)} km • ~{Math.round(duration)} min walk
    </div>
  );
}

interface ErrorMessageBarProps {
  message: string;
}

export function ErrorMessageBar({ message }: ErrorMessageBarProps) {
  return (
    <div style={{
      marginBottom: "1rem",
      padding: "0.75rem 1rem",
      backgroundColor: "#fee2e2",
      color: "#991b1b",
      borderRadius: "0.375rem",
      fontSize: "0.875rem",
    }}>
      ⚠️ {message}
    </div>
  );
}

interface StatusMessageProps {
  waypointsCount: number;
  maxWaypoints: number;
  hasRoute: boolean;
}

export function StatusMessage({ waypointsCount, maxWaypoints, hasRoute }: StatusMessageProps) {
  if (waypointsCount === 0) {
    return (
      <div style={{ marginTop: "1rem", textAlign: "center", color: "#6b7280" }}>
        📍 Click on the map to place your starting point, then add waypoints.
      </div>
    );
  }

  if (waypointsCount < maxWaypoints) {
    return (
      <div style={{ marginTop: "1rem", textAlign: "center", color: "#6b7280" }}>
        📍 {waypointsCount}/{maxWaypoints} point{waypointsCount !== 1 ? 's' : ''} placed. Click map to add more, or generate route with {waypointsCount >= 2 ? 'current points' : 'at least one waypoint'}.
      </div>
    );
  }

  if (hasRoute) return null;

  if (waypointsCount >= 2) {
    return (
      <div style={{ marginTop: "0.5rem", textAlign: "center", color: "#10b981" }}>
        🗺️ Ready to generate! Click the button above.
      </div>
    );
  }

  return null;
}
