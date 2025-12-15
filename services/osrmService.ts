import { Waypoint, RouteData } from '../types';

const OSRM_BASE_URL = 'https://router.project-osrm.org';
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

// Helper to process response data into RouteData format
const processRouteResponse = (route: any) => {
  const geometry = route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
  
  return {
    distance: route.distance,
    duration: route.duration,
    geometry: geometry,
    legs: route.legs ? route.legs.map((leg: any) => ({
      distance: leg.distance,
      duration: leg.duration
    })) : []
  };
};

export const fetchRoute = async (waypoints: Waypoint[]): Promise<RouteData | null> => {
  if (waypoints.length < 2) return null;

  // Format coordinates for OSRM: lon,lat;lon,lat
  const coordinates = waypoints
    .map((wp) => `${wp.lng},${wp.lat}`)
    .join(';');

  try {
    const response = await fetch(
      `${OSRM_BASE_URL}/route/v1/driving/${coordinates}?overview=full&geometries=geojson`
    );

    if (!response.ok) throw new Error('Failed to fetch route');

    const data = await response.json();
    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) return null;

    return processRouteResponse(data.routes[0]);
  } catch (error) {
    console.error('OSRM API Error:', error);
    return null;
  }
};

// Updated return type to include error info
export const fetchOptimizedRoute = async (waypoints: Waypoint[]): Promise<{ sortedWaypoints: Waypoint[], routeData: RouteData } | { error: string }> => {
  if (waypoints.length < 2) return { error: 'Not enough points to optimize' };

  const coordinates = waypoints
    .map((wp) => `${wp.lng},${wp.lat}`)
    .join(';');

  try {
    const response = await fetch(
      `${OSRM_BASE_URL}/trip/v1/driving/${coordinates}?source=first&roundtrip=false&overview=full&geometries=geojson`
    );

    const data = await response.json();

    if (!response.ok) {
        // Handle HTTP errors (like 429 Too Many Requests)
        return { error: data.message || `Server Error: ${response.status} ${response.statusText}` };
    }

    if (data.code !== 'Ok') {
        // Handle OSRM logic errors (like NoRoute)
        let msg = data.message || data.code;
        if (data.code === 'NoRoute') msg = 'Cannot find a driving route between these locations.';
        return { error: msg };
    }
    
    if (!data.trips || data.trips.length === 0) {
        return { error: 'No trip solution found.' };
    }

    if (!data.waypoints) {
         return { error: 'Optimization failed: Invalid response structure (missing waypoints).' };
    }

    // In OSRM Trip response, the `waypoints` array in the root object is sorted by the visit order.
    // Each entry has `waypoint_index` pointing to the original input index.
    const sortedWaypoints = data.waypoints.map((wp: any) => {
        if (wp.waypoint_index === undefined || wp.waypoint_index >= waypoints.length) {
             return waypoints[0]; // Fallback, shouldn't happen if API is consistent
        }
        return waypoints[wp.waypoint_index];
    });

    const trip = data.trips[0];
    
    return {
      sortedWaypoints: sortedWaypoints,
      routeData: processRouteResponse(trip)
    };

  } catch (error) {
    console.error('OSRM Optimization Error:', error);
    return { error: error instanceof Error ? error.message : 'Network connection failed' };
  }
};

export const searchLocation = async (query: string): Promise<{ name: string; lat: number; lng: number } | null> => {
  try {
    const response = await fetch(
      `${NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(query)}&limit=1`
    );

    if (!response.ok) throw new Error('Search failed');

    const data = await response.json();
    if (data && data.length > 0) {
      return {
        name: data[0].display_name.split(',')[0], // Take the first part of the name for brevity
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
    return null;
  } catch (error) {
    console.error('Nominatim Search Error:', error);
    return null;
  }
};