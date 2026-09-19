// ============================================================
// ResQ — Universal Disaster Operations Sector Configuration
// ============================================================

export const CITY = {
  name: "Central Sector",
  district: "Metro Disaster Operations Zone",
  // Coordinate hub centered on the primary operations telemetry area
  latitude: 22.2604,
  longitude: 84.8536,
} as const;

export const CITY_CENTER: [number, number] = [CITY.latitude, CITY.longitude];

// Fallback incident location when reports omit coordinates
export const DEFAULT_REPORT_LOCATION = {
  latitude: CITY.latitude,
  longitude: CITY.longitude,
};
