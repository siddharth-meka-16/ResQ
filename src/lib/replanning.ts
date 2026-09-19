import { haversineDistanceKm } from "./allocation";

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface RoadHazard {
  id: string;
  hazardType: "FLOODED" | "COLLAPSED" | "LANDSLIDE" | "DEBRIS";
  latitude: number;
  longitude: number;
  waterDepthCm: number;
  isPassableByBoat: boolean;
  isActive: boolean;
  title?: string;
}

export interface RouteWaypoint extends GeoPoint {
  name?: string;
}

export interface ActiveRoute {
  dispatchId: string;
  teamId: string;
  incidentId: string;
  waypoints: RouteWaypoint[];
  requiredVehicle: "TRUCK" | "BOAT" | "AIRLIFT";
  etaMinutes: number;
}

export type ReplanningAction =
  | "NO_ACTION"
  | "REROUTED_OVERLAND"
  | "UPGRADED_TO_BOAT"
  | "UPGRADED_TO_AIRLIFT";

export interface ReplanResult {
  isBlocked: boolean;
  collidingHazards: RoadHazard[];
  originalRoute: ActiveRoute;
  newRoute?: RouteWaypoint[];
  newEtaMinutes?: number;
  upgradedVehicle?: "TRUCK" | "BOAT" | "AIRLIFT";
  actionTaken: ReplanningAction;
  explanation: string;
}

/**
 * Calculates minimum distance from a point to a line segment in kilometers.
 */
export function pointToSegmentDistanceKm(
  point: GeoPoint,
  segmentStart: GeoPoint,
  segmentEnd: GeoPoint
): number {
  const l2 =
    Math.pow(segmentEnd.lat - segmentStart.lat, 2) +
    Math.pow(segmentEnd.lng - segmentStart.lng, 2);

  if (l2 === 0) {
    return haversineDistanceKm(point.lat, point.lng, segmentStart.lat, segmentStart.lng);
  }

  // Projection scalar t on line segment
  let t =
    ((point.lat - segmentStart.lat) * (segmentEnd.lat - segmentStart.lat) +
      (point.lng - segmentStart.lng) * (segmentEnd.lng - segmentStart.lng)) /
    l2;

  t = Math.max(0, Math.min(1, t));

  const projLat = segmentStart.lat + t * (segmentEnd.lat - segmentStart.lat);
  const projLng = segmentStart.lng + t * (segmentEnd.lng - segmentStart.lng);

  return haversineDistanceKm(point.lat, point.lng, projLat, projLng);
}

/**
 * Detects whether a path intersects with a hazard zone (buffer in km, default 300 meters).
 */
export function isRouteIntersectingHazard(
  waypoints: RouteWaypoint[],
  hazard: RoadHazard,
  bufferRadiusKm = 0.3
): boolean {
  if (!hazard.isActive || waypoints.length === 0) return false;

  const hazardPoint: GeoPoint = { lat: hazard.latitude, lng: hazard.longitude };

  // Check proximity to each node
  for (const wp of waypoints) {
    if (haversineDistanceKm(wp.lat, wp.lng, hazard.latitude, hazard.longitude) <= bufferRadiusKm) {
      return true;
    }
  }

  // Check proximity to each edge
  for (let i = 0; i < waypoints.length - 1; i++) {
    const dist = pointToSegmentDistanceKm(hazardPoint, waypoints[i], waypoints[i + 1]);
    if (dist <= bufferRadiusKm) {
      return true;
    }
  }

  return false;
}

/**
 * Evaluates active dispatches against incoming road hazards and triggers automated replanning.
 */
export function replanRouteUnderHazards(
  route: ActiveRoute,
  hazards: RoadHazard[],
  availableDetours?: RouteWaypoint[]
): ReplanResult {
  const activeHazards = hazards.filter((h) => h.isActive);
  const colliding = activeHazards.filter((h) =>
    isRouteIntersectingHazard(route.waypoints, h)
  );

  if (colliding.length === 0) {
    return {
      isBlocked: false,
      collidingHazards: [],
      originalRoute: route,
      actionTaken: "NO_ACTION",
      explanation: "Active route clear of all verified hazards. Proceeding on primary corridor.",
    };
  }

  // Determine hazard characteristics
  const maxWaterDepth = Math.max(...colliding.map((h) => h.waterDepthCm));
  const canBoatsPass = colliding.every((h) => h.isPassableByBoat);
  const hasStructuralCollapse = colliding.some((h) => h.hazardType === "COLLAPSED");

  // Case 1: Overland Detour Available that bypasses all hazards
  if (availableDetours && availableDetours.length > 0) {
    const detourIsClear = !activeHazards.some((h) =>
      isRouteIntersectingHazard(availableDetours, h)
    );

    if (detourIsClear) {
      // Calculate new distance & ETA
      let detourDist = 0;
      for (let i = 0; i < availableDetours.length - 1; i++) {
        detourDist += haversineDistanceKm(
          availableDetours[i].lat,
          availableDetours[i].lng,
          availableDetours[i + 1].lat,
          availableDetours[i + 1].lng
        );
      }
      const newEta = Math.round((detourDist / 30) * 60 * 10) / 10;
      const hazardNames = colliding.map((h) => h.title || h.hazardType).join(", ");

      return {
        isBlocked: true,
        collidingHazards: colliding,
        originalRoute: route,
        newRoute: availableDetours,
        newEtaMinutes: newEta,
        upgradedVehicle: route.requiredVehicle,
        actionTaken: "REROUTED_OVERLAND",
        explanation: `Road blockage detected (${hazardNames}). Rerouted overland via bypass corridor. ETA revised from ${route.etaMinutes}m to ${newEta}m (+${Math.round((newEta - route.etaMinutes) * 10) / 10}m trade-off).`,
      };
    }
  }

  // Case 2: Water depth exceeds 50cm and is boat-passable -> Upgrade to BOAT
  if (maxWaterDepth >= 50 && canBoatsPass && !hasStructuralCollapse) {
    return {
      isBlocked: true,
      collidingHazards: colliding,
      originalRoute: route,
      newRoute: route.waypoints,
      newEtaMinutes: Math.round(route.etaMinutes * 1.3),
      upgradedVehicle: "BOAT",
      actionTaken: "UPGRADED_TO_BOAT",
      explanation: `Critical road submergence (${maxWaterDepth}cm water depth). No safe vehicular overland bypass. Mission vehicle upgraded from ${route.requiredVehicle} to BOAT. Watercraft dispatched with swift-water crew.`,
    };
  }

  // Case 3: Structural collapse or impassable water -> Upgrade to AIRLIFT
  return {
    isBlocked: true,
    collidingHazards: colliding,
    originalRoute: route,
    newRoute: route.waypoints,
    newEtaMinutes: 20,
    upgradedVehicle: "AIRLIFT",
    actionTaken: "UPGRADED_TO_AIRLIFT",
    explanation: `Total corridor severance detected (Structural collapse or extreme flash current). Ground and surface watercraft blocked. Mission escalated to AIRLIFT (Aerial Rapid Extraction).`,
  };
}
