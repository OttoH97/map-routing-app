import type { LatLngExpression } from "leaflet";

export interface ElevationPoint {
  lat: number;
  lng: number;
  elevation: number; // meters
}

export interface RouteResult {
  coords: LatLngExpression[];
  distanceKm: number;
  durationMinutes: number;
  elevationGain: number; // total ascent in meters
  elevationLoss: number; // total descent in meters
  elevationProfile: ElevationPoint[]; // sampled points for chart
}

export interface ManualRouteOptions {
  waypoints: LatLngExpression[]; // [start, wp1?, wp2?, ..., start]
}

/**
 * Generate a walking route through user-specified waypoints using GraphHopper API.
 * Routes directly through the provided points and returns to the start.
 */
export async function generateManualRoute(
  options: ManualRouteOptions
): Promise<RouteResult> {
  const { waypoints } = options;

  if (waypoints.length < 2) {
    throw new Error("At least 2 points are required (start and end).");
  }

  if (waypoints.length > 5) {
    throw new Error("Maximum 5 routing locations allowed on free tier.");
  }

  const [startLat, startLng] = waypoints[0] as [number, number];

  // Build point parameters: all user waypoints + return to start
  const pointParams = [
    `&point=${startLat},${startLng}`,
    ...waypoints.slice(1).map((wp) => {
      const [lat, lng] = wp as [number, number];
      return `&point=${lat},${lng}`;
    }),
    `&point=${startLat},${startLng}`, // return to start
  ].join('\n');

  const url =
    `https://graphhopper.com/api/1/route` +
    `?key=${process.env.NEXT_PUBLIC_GRAPHHOPPER_KEY}` +
    pointParams +
    `&profile=foot` +
    `&vehicle=foot` +
    `&points_encoded=false` +
    `&elevation=true`;
  const response = await fetch(url);

  if (response.status === 429) {
    throw new Error("Rate limit exceeded. Please wait before making another request.");
  }
  if (response.status === 401 || response.status === 403) {
    throw new Error("Authentication failed. Check your GraphHopper API key.");
  }
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error ${response.status}: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  const path = data.paths?.[0];

  if (!path) {
    throw new Error("No route found. Try adjusting your waypoints to be closer together or on accessible roads.");
  }

  if (path.distance > 64000) {
    throw new Error(`Route exceeds 64km free tier limit: ${(path.distance / 1000).toFixed(2)} km`);
  }

  const actualKm = path.distance / 1000;
  const durationMinutes = (path.time || 0) / 60000;



  // Parse elevation data from coordinates.
    // When points_encoded=false & elevation=true, each coordinate is [lng, lat, elevation].
    let elevationGain = 0;
    let elevationLoss = 0;
    let elevationProfile: ElevationPoint[] = [];

    if (path.points?.coordinates) {
      const coordinates = path.points.coordinates as [number, number, number][] | [number, number][];
      
      // Sample elevation points (every Nth point to avoid too many data points)
      const sampleInterval = Math.max(1, Math.floor(coordinates.length / 200));

      let lastElevation: number | null = null;
      coordinates.forEach((coord, index) => {
        // Extract elevation from the third value if present (3D point)
        const elevation = coord[2] !== undefined ? coord[2] : null;

        if (elevation !== null && index % sampleInterval === 0) {
          const [lng, lat] = coord as [number, number];
          
          elevationProfile.push({ lat, lng, elevation });

          // Calculate gain/loss
          if (lastElevation !== null) {
            const diff = elevation - lastElevation;
            if (diff > 0) elevationGain += diff;
            else elevationLoss += Math.abs(diff);
          }
          lastElevation = elevation;
        }
      });
    }

  const coords = path.points.coordinates.map(
    ([lng, lat]: [number, number]) => [lat, lng] as LatLngExpression
  );

  return {
    coords,
    distanceKm: actualKm,
    durationMinutes,
    elevationGain,
    elevationLoss,
    elevationProfile,
  };
}

