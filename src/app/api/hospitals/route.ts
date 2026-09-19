import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Fallback seed hospitals for offline demo resilience
const FALLBACK_HOSPITALS = [
  {
    id: "50000000-0000-0000-0000-000000000001",
    name: "Central Civil Hospital & Trauma Centre",
    address: "Medical Enclave, Sector 19, Metro Central",
    latitude: 22.2618,
    longitude: 84.8694,
    total_icu_beds: 35,
    available_icu_beds: 4,
    total_general_beds: 600,
    available_general_beds: 52,
    oxygen_reserve_hours: 18,
    generator_fuel_hours: 24,
    divert_status: "CAUTION",
    contact_phone: "+91-11-2647-1001",
    updated_at: new Date().toISOString(),
  },
  {
    id: "50000000-0000-0000-0000-000000000002",
    name: "Metro General Hospital",
    address: "Outer Ring Road, Civil Lines",
    latitude: 22.238,
    longitude: 84.825,
    total_icu_beds: 20,
    available_icu_beds: 11,
    total_general_beds: 250,
    available_general_beds: 94,
    oxygen_reserve_hours: 36,
    generator_fuel_hours: 48,
    divert_status: "NORMAL",
    contact_phone: "+91-11-2500-2150",
    updated_at: new Date().toISOString(),
  },
  {
    id: "50000000-0000-0000-0000-000000000003",
    name: "Apex Emergency Care & Burn Institute",
    address: "Bypass Expressway, Sector 4",
    latitude: 22.285,
    longitude: 84.892,
    total_icu_beds: 15,
    available_icu_beds: 8,
    total_general_beds: 180,
    available_general_beds: 64,
    oxygen_reserve_hours: 42,
    generator_fuel_hours: 36,
    divert_status: "NORMAL",
    contact_phone: "+91-11-2680-3344",
    updated_at: new Date().toISOString(),
  },
];

export async function GET() {
  try {
    let hospitals: any[] = FALLBACK_HOSPITALS;

    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("hospitals")
        .select("*")
        .order("available_icu_beds", { ascending: false });

      if (!error && data && data.length > 0) {
        hospitals = data;
      }
    } catch {
      // Offline fallback
    }

    const totalIcuBeds = hospitals.reduce((sum, h) => sum + (h.total_icu_beds || 0), 0);
    const availableIcuBeds = hospitals.reduce((sum, h) => sum + (h.available_icu_beds || 0), 0);
    const totalGeneralBeds = hospitals.reduce((sum, h) => sum + (h.total_general_beds || 0), 0);
    const availableGeneralBeds = hospitals.reduce((sum, h) => sum + (h.available_general_beds || 0), 0);

    return NextResponse.json({
      success: true,
      hospitals,
      gridSummary: {
        totalFacilities: hospitals.length,
        totalIcuBeds,
        availableIcuBeds,
        icuOccupancyPercent: totalIcuBeds > 0 ? Math.round(((totalIcuBeds - availableIcuBeds) / totalIcuBeds) * 100) : 0,
        totalGeneralBeds,
        availableGeneralBeds,
        facilitiesOnDivert: hospitals.filter((h) => h.divert_status === "DIVERT_ALL" || h.divert_status === "CAUTION").length,
      },
    });
  } catch (error) {
    console.error("GET /api/hospitals error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
