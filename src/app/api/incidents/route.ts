import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createRawClient } from "@supabase/supabase-js";
import { jsonError, optionalAuth, requireAuth } from "@/lib/auth";
import { classifyReport } from "@/lib/classifier";
import {
  calculateConfidence,
  verificationFor,
  highestSeverity,
} from "@/lib/confidence";
import type {
  IncidentSeverity,
  IncidentStatus,
  IncidentType,
  ReportSource,
} from "@/types/database";

// GET /api/incidents?status=REPORTED&severity=CRITICAL&type=FLOOD&limit=50
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  let query = supabase
    .from("incidents")
    .select("*")
    .order("reported_at", { ascending: false });

  const severity = searchParams.get("severity");
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const limit = Number(searchParams.get("limit") ?? 100);

  if (severity) query = query.eq("severity", severity as IncidentSeverity);
  if (status) query = query.eq("status", status as IncidentStatus);
  if (type) query = query.eq("type", type as IncidentType);

  const { data, error } = await query.limit(Math.min(limit, 500));
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ incidents: data });
}

const SEVERITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
const TYPES = [
  "FLOOD",
  "FIRE",
  "LANDSLIDE",
  "STRUCTURAL_COLLAPSE",
  "MEDICAL_EMERGENCY",
  "EARTHQUAKE",
  "CYCLONE",
  "OTHER",
];
const SOURCES = ["APP", "SMS", "IVR", "OFFICIAL", "MANUAL"];

// POST /api/incidents - citizen/operator/SMS/anonymous report submission.
// Pipeline: validate -> AI classify -> confidence score -> duplicate cluster.
export async function POST(request: NextRequest) {
  const auth = await optionalAuth();
  const reporterId = auth.userId;
  if (auth instanceof NextResponse) return auth;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body");
  }

  const description =
    typeof body.description === "string" ? body.description.trim() : "";
  const latitude = Number(body.latitude);
  const longitude = Number(body.longitude);

  if (description.length < 5)
    return jsonError("description must be at least 5 characters");
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)
    return jsonError("latitude is invalid");
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)
    return jsonError("longitude is invalid");

  // ---- Intelligence pipeline ------------------------------------
  // AI classifies the free text; explicit user picks still win.
  const userPickedType =
    typeof body.type === "string" && TYPES.includes(body.type) && body.type !== "OTHER";
  const userPickedSeverity =
    typeof body.severity === "string" && SEVERITIES.includes(body.severity);

  const ai = await classifyReport(description);

  const type = (userPickedType ? body.type : ai.type) as IncidentType;
  const severity = (userPickedSeverity ? body.severity : ai.severity) as IncidentSeverity;
  const people_affected = Math.max(
    1,
    Number(body.people_affected) ||
      ai.peopleAffected ||
      1
  );
  const required_capabilities = Array.isArray(body.required_capabilities)
    ? (body.required_capabilities.filter((c) => typeof c === "string") as string[])
    : ai.requiredCapabilities;

  const source = (SOURCES.includes(String(body.source)) ? body.source : "APP") as ReportSource;
  const photo_url = typeof body.photo_url === "string" ? body.photo_url : null;

  const supabase = reporterId
    ? await createClient()
    : // No usable session: use a clean anon client. The cookie-bound
      // client may still carry a stale-but-signed token, which Postgres
      // treats as `authenticated` - and then no insert policy matches
      // (authenticated requires reporter_id = uid; anon requires null).
      createRawClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false } }
      );

  // ---- Duplicate detection: same type within 500m in last 30 min ----
  const windowStart = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  let nearbyQuery = supabase
    .from("incidents")
    .select("id, latitude, longitude, cluster_id, reported_at")
    .eq("type", type)
    .not("status", "in", "(RESOLVED,CANCELLED)")
    .gte("reported_at", windowStart);
  if (reporterId) nearbyQuery = nearbyQuery.neq("reporter_id", reporterId);
  const { data: nearby } = await nearbyQuery;

  function distKm(aLat: number, aLng: number) {
    const R = 6371;
    const dLat = ((latitude - aLat) * Math.PI) / 180;
    const dLng = ((longitude - aLng) * Math.PI) / 180;
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((latitude * Math.PI) / 180) *
        Math.cos((aLat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.asin(Math.sqrt(h));
  }

  const matches = (nearby ?? []).filter(
    (n) => distKm(n.latitude, n.longitude) <= 0.5
  );

  // Cluster head: an existing member's head or the oldest match itself
  let clusterHeadId: string | null = null;
  for (const m of matches.sort(
    (a, b) => Date.parse(a.reported_at) - Date.parse(b.reported_at)
  )) {
    clusterHeadId = m.cluster_id ?? m.id;
    break;
  }

  const confidence = calculateConfidence({
    source,
    hasPhoto: Boolean(photo_url),
    nearbyReports: matches.length,
  });

  const payload = {
    reporter_id: reporterId,
    title: description.slice(0, 60),
    description,
    latitude,
    longitude,
    location_text:
      typeof body.location_text === "string" && body.location_text.trim()
        ? body.location_text.trim()
        : null,
    address:
      typeof body.location_text === "string" && body.location_text.trim()
        ? body.location_text.trim()
        : null,
    landmark:
      typeof body.location_text === "string" && body.location_text.trim()
        ? body.location_text.trim()
        : null,
    people_affected,
    trapped_count: people_affected,
    required_capabilities,
    confidence_score: confidence,
    verification_status: verificationFor(confidence),
    severity,
    type,
    incident_type: type,
    source,
    photo_url,
    cluster_id: clusterHeadId,
    is_simulated: false,
    ai_classification: {
      by: ai.classifiedBy,
      suggested_type: ai.type,
      suggested_severity: ai.severity,
    },
  };

  let { data: incident, error } = await supabase
    .from("incidents")
    .insert(payload as any)
    .select("*")
    .single();

  // Safety net: a stale-but-signed browser token can make Postgres treat
  // the request as `authenticated` even when we have no usable session.
  // Never block the report - retry it as truly anonymous instead.
  if (error && reporterId) {
    console.error("[incidents] authenticated insert failed, retrying anon:", error.message);
    const anon = createRawClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    );
    ({ data: incident, error } = await anon
      .from("incidents")
      .insert({ ...payload, reporter_id: null } as any)
      .select("*")
      .single());
  }

  if (error) {
    console.error("[incidents] insert failed:", error.message);
    return jsonError(error.message, 500);
  }
  if (!incident) return jsonError("Insert returned no row", 500);

  // Raise the head's confidence/severity when corroboration happens
  if (clusterHeadId && matches.length > 0 && clusterHeadId !== incident.id) {
    const { data: head } = await supabase
      .from("incidents")
      .select("severity, confidence_score, people_affected")
      .eq("id", clusterHeadId)
      .single();

    if (head) {
      const headConfidence = calculateConfidence({
        source,
        hasPhoto: true,
        nearbyReports: matches.length + 1,
      });
      await supabase
        .from("incidents")
        .update({
          confidence_score: Math.max(head.confidence_score, headConfidence),
          verification_status: verificationFor(headConfidence),
          severity: highestSeverity(head.severity, incident.severity),
          people_affected: Math.max(head.people_affected, people_affected),
        })
        .eq("id", clusterHeadId);
    }
  }

  return NextResponse.json(
    {
      incident,
      intelligence: {
        classified_by: ai.classifiedBy,
        duplicates_detected: matches.length,
        clustered_under: clusterHeadId,
        confidence,
      },
    },
    { status: 201 }
  );
}
