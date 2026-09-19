import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      availableIcuBeds,
      availableGeneralBeds,
      oxygenReserveHours,
      generatorFuelHours,
      divertStatus,
    } = body;

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (availableIcuBeds !== undefined) updates.available_icu_beds = availableIcuBeds;
    if (availableGeneralBeds !== undefined) updates.available_general_beds = availableGeneralBeds;
    if (oxygenReserveHours !== undefined) updates.oxygen_reserve_hours = oxygenReserveHours;
    if (generatorFuelHours !== undefined) updates.generator_fuel_hours = generatorFuelHours;
    if (divertStatus) updates.divert_status = divertStatus;

    try {
      const supabase = await createClient();
      const { data, error } = await (supabase.from("hospitals") as any)
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (!error && data) {
        return NextResponse.json({
          success: true,
          hospital: data,
          message: "Hospital bed & divert status updated successfully.",
        });
      }
    } catch {
      // Local fallback simulation
    }

    return NextResponse.json({
      success: true,
      hospital: { id, ...updates },
      message: "Hospital bed & divert status updated (local demo mode).",
    });
  } catch (error) {
    console.error("PATCH /api/hospitals/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
