import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateSituationalAdvisory } from "@/lib/gemini";

export async function GET() {
  try {
    const supabase = await createClient();

    const [incidentsRes, hospitalsRes, hazardsRes] = await Promise.all([
      supabase
        .from("incidents")
        .select("id, type, incident_type, severity, status, people_affected, trapped_count, location_text")
        .not("status", "in", "(RESOLVED,CANCELLED)")
        .limit(20),
      supabase
        .from("hospitals")
        .select("name, available_icu_beds, total_icu_beds, divert_status")
        .limit(10),
      supabase
        .from("road_hazards")
        .select("title, hazard_type, is_active, water_depth_cm")
        .eq("is_active", true)
        .limit(10),
    ]);

    const advisory = await generateSituationalAdvisory({
      incidents: (incidentsRes.data || []).map((i: any) => ({
        id: i.id,
        type: i.type || i.incident_type || "OTHER",
        severity: i.severity || "MEDIUM",
        status: i.status || "REPORTED",
        people_affected: i.people_affected || i.trapped_count || 1,
        location_text: i.location_text || null,
      })),
      hospitals: hospitalsRes.data || [],
      hazards: hazardsRes.data || [],
    });

    return NextResponse.json({
      success: true,
      advisory,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[api/ai/copilot] Error generating advisory:", err);
    return NextResponse.json(
      { success: false, error: "Failed to generate situational advisory" },
      { status: 500 }
    );
  }
}
