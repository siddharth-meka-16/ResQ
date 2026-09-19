import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  replanRouteUnderHazards,
  ActiveRoute,
  RoadHazard,
  RouteWaypoint,
} from "@/lib/replanning";

const FALLBACK_HAZARDS: RoadHazard[] = [
  {
    id: "60000000-0000-0000-0000-000000000001",
    hazardType: "FLOODED",
    title: "Main River Bridge Submerged (+120cm Floodwater)",
    latitude: 22.234,
    longitude: 84.818,
    waterDepthCm: 120,
    isPassableByBoat: true,
    isActive: true,
  },
];

export async function GET() {
  try {
    let hazards = FALLBACK_HAZARDS;

    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("road_hazards")
        .select("*")
        .order("reported_at", { ascending: false });

      if (!error && data && data.length > 0) {
        hazards = (data as any[]).map((h: any) => ({
          id: h.id,
          hazardType: h.hazard_type,
          title: h.title,
          latitude: h.latitude,
          longitude: h.longitude,
          waterDepthCm: h.water_depth_cm,
          isPassableByBoat: h.is_passable_by_boat,
          isActive: h.is_active,
        }));
      }
    } catch {
      // Offline fallback
    }

    return NextResponse.json({
      success: true,
      count: hazards.length,
      hazards,
    });
  } catch (error) {
    console.error("GET /api/replanning error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      hazardType = "FLOODED",
      title = "Central River Bridge Inundated",
      latitude = 22.234,
      longitude = 84.818,
      waterDepthCm = 120,
      isPassableByBoat = true,
      isActive = true,
    } = body;

    const newHazard: RoadHazard = {
      id: "hz-" + Math.random().toString(36).substring(2, 9),
      hazardType,
      title,
      latitude,
      longitude,
      waterDepthCm,
      isPassableByBoat,
      isActive,
    };

    try {
      const supabase = await createClient();
      await (supabase.from("road_hazards") as any).insert({
        hazard_type: hazardType,
        title,
        description: `Severe road submergence. Water depth: ${waterDepthCm}cm. Overland bypass required.`,
        latitude,
        longitude,
        water_depth_cm: waterDepthCm,
        is_passable_by_boat: isPassableByBoat,
        is_active: isActive,
      });
    } catch {
      // Offline simulation
    }

    // Designated safe detour (Outer Ring Road Corridor around river bottleneck)
    const designatedBypass: RouteWaypoint[] = [
      { lat: 22.25, lng: 84.87, name: "Sector 4 Staging Point" },
      { lat: 22.28, lng: 84.88, name: "Ring Road North Expressway" },
      { lat: 22.22, lng: 84.86, name: "South Connector" },
    ];

    const sampleRoute: ActiveRoute = {
      dispatchId: "dsp-live-001",
      teamId: "tm-001",
      incidentId: "inc-riverbank",
      waypoints: [
        { lat: 22.22, lng: 84.81, name: "Fire & Rescue Station 1" },
        { lat: 22.234, lng: 84.818, name: "Main River Bridge (Blocked)" },
        { lat: 22.2532, lng: 84.8315, name: "Rooftop Flood Rescue Site" },
      ],
      requiredVehicle: "TRUCK",
      etaMinutes: 12,
    };

    const result = replanRouteUnderHazards(sampleRoute, [newHazard], designatedBypass);

    return NextResponse.json({
      success: true,
      hazard: newHazard,
      replanResult: result,
      activeHazardsTotal: 1,
      affectedMissionsCount: 1,
    });
  } catch (error) {
    console.error("POST /api/replanning error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
