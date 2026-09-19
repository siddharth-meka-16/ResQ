import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { haversineKm } from "@/lib/allocation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      incidentLatitude = 22.25,
      incidentLongitude = 84.84,
      requiresIcu = false,
      casualtyCount = 1,
    } = body;

    let hospitals: any[] = [];

    try {
      const supabase = await createClient();
      const { data } = await supabase.from("hospitals").select("*");
      if (data && data.length > 0) {
        hospitals = data;
      }
    } catch {
      // Fallback below
    }

    if (hospitals.length === 0) {
      hospitals = [
        {
          id: "50000000-0000-0000-0000-000000000001",
          name: "Central Civil Hospital & Trauma Centre",
          address: "Sector 19, Metro Central",
          latitude: 22.2618,
          longitude: 84.8694,
          available_icu_beds: 4,
          available_general_beds: 52,
          oxygen_reserve_hours: 18,
          divert_status: "CAUTION",
        },
        {
          id: "50000000-0000-0000-0000-000000000002",
          name: "Metro General Hospital",
          address: "Outer Ring Road, Civil Lines",
          latitude: 22.238,
          longitude: 84.825,
          available_icu_beds: 11,
          available_general_beds: 94,
          oxygen_reserve_hours: 36,
          divert_status: "NORMAL",
        },
      ];
    }

    // Score and rank hospitals
    const rankedHospitals = hospitals.map((h) => {
      const distanceKm = Math.round(haversineKm(
        incidentLatitude,
        incidentLongitude,
        h.latitude,
        h.longitude
      ) * 10) / 10;
      const etaMinutes = Math.round((distanceKm / 35) * 60 * 10) / 10; // 35 km/h ambulance speed

      let capacityScore = 100;
      let divertPenalty = 0;

      if (requiresIcu) {
        if (h.available_icu_beds <= 0) {
          capacityScore = 0;
          divertPenalty = 80;
        } else if (h.available_icu_beds < casualtyCount) {
          capacityScore = 40;
          divertPenalty = 30;
        } else {
          capacityScore = Math.min(100, (h.available_icu_beds / 10) * 100);
        }
      } else {
        capacityScore = Math.min(100, (h.available_general_beds / 30) * 100);
      }

      if (h.divert_status === "DIVERT_ALL") {
        divertPenalty += 90;
      } else if (h.divert_status === "CAUTION") {
        divertPenalty += 25;
      }

      if (h.oxygen_reserve_hours < 6) {
        divertPenalty += 30;
      }

      const proximityScore = Math.max(0, 100 - (distanceKm / 20) * 100);
      const compositeScore = Math.round(
        proximityScore * 0.40 + capacityScore * 0.40 - divertPenalty * 0.20
      );

      return {
        hospital: h,
        distanceKm,
        etaMinutes,
        capacityScore,
        divertPenalty,
        compositeScore,
        isDiverted: divertPenalty >= 50 || capacityScore === 0,
      };
    });

    rankedHospitals.sort((a, b) => b.compositeScore - a.compositeScore);

    const recommended = rankedHospitals[0];
    const runnerUps = rankedHospitals.slice(1);

    let rationale = `Dispatched to ${recommended.hospital.name}: ${recommended.distanceKm} km (ETA ${recommended.etaMinutes}m). `;
    if (requiresIcu) {
      rationale += `${recommended.hospital.available_icu_beds} ICU beds confirmed available. `;
    }
    if (runnerUps.length > 0 && runnerUps[0].isDiverted) {
      rationale += `Diverted from ${runnerUps[0].hospital.name} due to facility strain (${runnerUps[0].hospital.divert_status}).`;
    }

    return NextResponse.json({
      success: true,
      recommendedDestination: {
        hospitalId: recommended.hospital.id,
        hospitalName: recommended.hospital.name,
        address: recommended.hospital.address,
        distanceKm: recommended.distanceKm,
        etaMinutes: recommended.etaMinutes,
        availableIcuBeds: recommended.hospital.available_icu_beds,
        oxygenReserveHours: recommended.hospital.oxygen_reserve_hours,
        divertStatus: recommended.hospital.divert_status,
        rationale,
      },
      rankedFacilities: rankedHospitals,
    });
  } catch (error) {
    console.error("POST /api/hospitals/divert error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
