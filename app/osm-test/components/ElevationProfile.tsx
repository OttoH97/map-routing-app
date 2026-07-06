"use client";

import { useMemo } from "react";
import type { ElevationPoint } from "../services/routeGenerator";

interface ElevationProfileProps {
  elevationData: ElevationPoint[];
  distanceKm: number;
}

export function ElevationProfile({ elevationData, distanceKm }: ElevationProfileProps) {
  const chartData = useMemo(() => {
    if (elevationData.length < 2) return null;

    // Find min/max elevation for scaling
    const elevations = elevationData.map(p => p.elevation);
    const minElev = Math.min(...elevations);
    const maxElev = Math.max(...elevations);
    const elevationRange = maxElev - minElev || 10; // Avoid division by zero

    // Chart dimensions
    const width = 600;
    const height = 150;
    const padding = { top: 20, right: 20, bottom: 30, left: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Convert to SVG path points
    const points = elevationData.map((point, index) => {
      const x = padding.left + (index / (elevationData.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - ((point.elevation - minElev) / elevationRange) * chartHeight;
      return `${x},${y}`;
    });

    const pathD = `M ${points.join(" L ")}`;
    
    // Fill area under the curve
    const fillPathD = `${pathD} L ${padding.left + chartWidth},${padding.top + chartHeight} L ${padding.left},${padding.top + chartHeight} Z`;

    return { pathD, fillPathD, width, height, minElev, maxElev, padding, chartWidth, chartHeight };
  }, [elevationData]);

  if (!chartData || elevationData.length < 2) {
    return (
      <div className="text-sm text-gray-500 italic">No elevation data available</div>
    );
  }

  const { pathD, fillPathD, width, height, minElev, maxElev, padding, chartWidth, chartHeight } = chartData;

  return (
    <div className="space-y-2">
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        className="w-full"
        style={{ height: "150px", display: "block" }}
      >
        {/* Background */}
        <rect x="0" y="0" width={width} height={height} fill="#f8fafc" rx="4" />
        
        {/* Grid lines - using proper chart dimensions */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
          <line
            key={ratio}
            x1={padding.left}
            y1={padding.top + ratio * chartHeight}
            x2={padding.left + chartWidth}
            y2={padding.top + ratio * chartHeight}
            stroke="#e2e8f0"
            strokeWidth="1"
          />
        ))}

        {/* Elevation fill */}
        <path d={fillPathD} fill="#606040" opacity="0.3" />
        
        {/* Elevation line */}
        <path 
          d={pathD} 
          fill="none" 
          stroke="#606040" 
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Y-axis labels - positioned within padding */}
        <text x={padding.left - 5} y={padding.top + 4} fontSize="10" fill="#6b7280">{Math.round(maxElev)}m</text>
        <text x={padding.left - 5} y={padding.top + chartHeight + 4} fontSize="10" fill="#6b7280">{Math.round(minElev)}m</text>

        {/* X-axis labels */}
        {[0, 0.5, 1].map((ratio) => (
          <text
            key={ratio}
            x={padding.left + ratio * chartWidth}
            y={height - 8}
            fontSize="10"
            fill="#6b7280"
            textAnchor="middle"
          >
            {(distanceKm * ratio).toFixed(1)}km
          </text>
        ))}
      </svg>
    </div>
  );
}

