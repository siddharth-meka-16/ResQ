import type {
  Incident,
  IncidentSeverity,
  ResourceStatus,
  ResourceTeam,
} from "@/types/database";

// ============================================================
// ResQ Autonomous Allocation Engine
//
// Transparent, weighted multi-factor scoring:
//   Score = w.sev*Severity + w.eta*ETA + w.cap*Capability
//         + w.avail*Availability + w.cap2*Capacity
//
// All component scores are normalized to 0-100 so weights are
// directly interpretable and explainable to operators/judges.
// ============================================================

export const AVERAGE_SPEED_KMH = 30;

export interface AllocationWeights {
  severity_weight: number;
  eta_weight: number;
  capability_weight: number;
  availability_weight: number;
  capacity_weight: number;
}

export interface ScoreBreakdown {
  severityScore: number;
  etaScore: number;
  capabilityScore: number;
  availabilityScore: number;
  capacityScore: number;
}

export interface AllocationScore extends ScoreBreakdown {
  resourceId: string;
  incidentId: string;
  totalScore: number;
  distanceKm: number;
  etaMinutes: number;
  explanation: string;
}

const SEVERITY_POINTS: Record<IncidentSeverity, number> = {
  CRITICAL: 100,
  HIGH: 75,
  MEDIUM: 50,
  LOW: 25,
};

const AVAILABILITY_POINTS: Record<ResourceStatus, number> = {
  AVAILABLE: 100,
  RETURNING: 50,
  ASSIGNED: 0,
  EN_ROUTE: 0,
  ON_SCENE: 0,
  UNAVAILABLE: 0,
};

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

export const haversineDistanceKm = haversineKm;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function etaMinutes(distanceKm: number): number {
  return (distanceKm / AVERAGE_SPEED_KMH) * 60;
}

function severityScore(severity: IncidentSeverity): number {
  return SEVERITY_POINTS[severity];
}

function etaScore(eta: number): number {
  // 100 at 0 min, loses 5 points per minute, floors at 0 (~20 min)
  return Math.max(0, 100 - eta * 5);
}

function capabilityScore(
  required: string[],
  available: string[]
): number {
  if (required.length === 0) return 100;
  const matched = required.filter((c) => available.includes(c)).length;
  return (matched / required.length) * 100;
}

function availabilityScore(status: ResourceStatus): number {
  return AVAILABILITY_POINTS[status];
}

function capacityScore(teamCapacity: number, peopleAffected: number): number {
  if (peopleAffected <= 0) return 100;
  return Math.min(100, (teamCapacity / peopleAffected) * 100);
}

export function calculateAllocationScore(
  incident: Pick<
    Incident,
    "id" | "severity" | "required_capabilities" | "people_affected" | "latitude" | "longitude"
  >,
  resource: Pick<
    ResourceTeam,
    "id" | "team_code" | "status" | "latitude" | "longitude" | "capacity" | "capabilities"
  >,
  weights: AllocationWeights
): AllocationScore {
  const severity = severityScore(incident.severity);

  const distanceKm = haversineKm(
    incident.latitude,
    incident.longitude,
    resource.latitude,
    resource.longitude
  );
  const eta = etaMinutes(distanceKm);
  const etaPts = etaScore(eta);

  const capability = capabilityScore(
    incident.required_capabilities,
    resource.capabilities
  );
  const availability = availabilityScore(resource.status);
  const capacity = capacityScore(resource.capacity, incident.people_affected);

  const totalScore = round1(
    weights.severity_weight * severity +
      weights.eta_weight * etaPts +
      weights.capability_weight * capability +
      weights.availability_weight * availability +
      weights.capacity_weight * capacity
  );

  return {
    resourceId: resource.id,
    incidentId: incident.id,
    totalScore,
    distanceKm: round1(distanceKm),
    etaMinutes: Math.ceil(eta),
    severityScore: round1(severity),
    etaScore: round1(etaPts),
    capabilityScore: round1(capability),
    availabilityScore: availability,
    capacityScore: round1(capacity),
    explanation: generateExplanation({
      teamCode: resource.team_code,
      distanceKm,
      etaMinutes: Math.ceil(eta),
      matchedCaps: incident.required_capabilities.filter((c) =>
        resource.capabilities.includes(c)
      ),
      missingCaps: incident.required_capabilities.filter(
        (c) => !resource.capabilities.includes(c)
      ),
      status: resource.status,
      capacity: resource.capacity,
      peopleAffected: incident.people_affected,
      totalScore,
    }),
  };
}

interface ExplanationInput {
  teamCode: string;
  distanceKm: number;
  etaMinutes: number;
  matchedCaps: string[];
  missingCaps: string[];
  status: ResourceStatus;
  capacity: number;
  peopleAffected: number;
  totalScore: number;
}

export function generateExplanation(input: ExplanationInput): string {
  const parts: string[] = [];

  parts.push(
    `${input.teamCode} is ${round1(input.distanceKm)} km away (~${input.etaMinutes} min ETA)`
  );

  if (input.matchedCaps.length > 0 && input.missingCaps.length === 0) {
    parts.push(`has all required capabilities (${input.matchedCaps.join(", ")})`);
  } else if (input.matchedCaps.length > 0) {
    parts.push(
      `covers ${input.matchedCaps.join(", ")} but lacks ${input.missingCaps.join(", ")}`
    );
  } else if (input.missingCaps.length > 0) {
    parts.push(`lacks required ${input.missingCaps.join(", ")}`);
  }

  if (input.status !== "AVAILABLE") {
    parts.push(`currently ${input.status.toLowerCase().replace("_", " ")}`);
  }

  if (input.capacity < input.peopleAffected) {
    parts.push(
      `capacity ${input.capacity} is below ${input.peopleAffected} people affected`
    );
  }

  return `${parts.join("; ")}. Score: ${input.totalScore}`;
}

export function rankResources(
  incident: Parameters<typeof calculateAllocationScore>[0],
  resources: Parameters<typeof calculateAllocationScore>[1][],
  weights: AllocationWeights
): AllocationScore[] {
  return resources
    .map((r) => calculateAllocationScore(incident, r, weights))
    .sort((a, b) => b.totalScore - a.totalScore);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
