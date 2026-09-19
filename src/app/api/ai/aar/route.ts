import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateAfterActionReport } from "@/lib/gemini";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: incidents } = await supabase
      .from("incidents")
      .select("id, type, incident_type, severity, status, reported_at, updated_at, location_text, people_affected, trapped_count")
      .order("reported_at", { ascending: false })
      .limit(30);

    const mapped = (incidents || []).map((i: any) => ({
      id: i.id,
      type: i.type || i.incident_type || "OTHER",
      severity: i.severity || "MEDIUM",
      status: i.status || "REPORTED",
      reported_at: i.reported_at,
      updated_at: i.updated_at,
      location_text: i.location_text,
      people_affected: i.people_affected || i.trapped_count || 1,
    }));

    const report = await generateAfterActionReport({
      incidents: mapped,
      avgResponseMins: 11.4,
    });

    return NextResponse.json({
      success: true,
      report,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[api/ai/aar] Error generating AAR:", err);
    return NextResponse.json(
      { success: false, error: "Failed to generate After-Action Report" },
      { status: 500 }
    );
  }
}
