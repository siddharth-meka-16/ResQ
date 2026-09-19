import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const FALLBACK_MISSING = [
  {
    id: "80000000-0000-0000-0000-000000000001",
    reported_by_phone: "+91-98765-43210",
    reported_by_name: "Anita Sharma",
    full_name: "Aarav Sharma",
    age: 7,
    gender: "MALE",
    physical_description: "Fair complexion, mole on right cheek, approx 120cm height",
    clothing_last_seen: "Bright yellow t-shirt and blue denim shorts",
    last_seen_location: "Near Sector 4 Riverbank Ghat during flood evacuation",
    latitude: 22.2444,
    longitude: 84.8105,
    status: "SEARCHING",
    reported_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: "80000000-0000-0000-0000-000000000002",
    reported_by_phone: "+91-91234-56789",
    reported_by_name: "Rahul Verma",
    full_name: "Kavita Verma",
    age: 68,
    gender: "FEMALE",
    physical_description: "Silver hair, wears black spectacles, diabetic needs insulin",
    clothing_last_seen: "Green floral saree, red slippers",
    last_seen_location: "Civil Lines bus stand during storm panic",
    latitude: 22.251,
    longitude: 84.832,
    status: "SEARCHING",
    reported_at: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const phone = searchParams.get("phone");

    let records: any[] = FALLBACK_MISSING;

    try {
      const supabase = await createClient();
      let query = supabase
        .from("missing_persons")
        .select("*, matched_checkin:shelter_checkins(id, person_name, checked_in_at, shelter:shelters(name))")
        .order("reported_at", { ascending: false });

      if (status && status !== "ALL") {
        query = query.eq("status", status);
      }
      if (phone) {
        query = query.eq("reported_by_phone", phone);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        records = data;
      }
    } catch {
      // Offline fallback
    }

    return NextResponse.json({
      success: true,
      count: records.length,
      missingPersons: records,
    });
  } catch (error) {
    console.error("GET /api/reunite/missing error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      reportedByPhone,
      reportedByName,
      fullName,
      age,
      gender,
      physicalDescription,
      clothingLastSeen,
      lastSeenLocation,
      latitude,
      longitude,
      photoUrl,
    } = body;

    if (!reportedByPhone || !fullName) {
      return NextResponse.json(
        { error: "reportedByPhone and fullName are required." },
        { status: 400 }
      );
    }

    const newRecord = {
      id: "mp-" + Math.random().toString(36).substring(2, 9),
      reported_by_phone: reportedByPhone,
      reported_by_name: reportedByName,
      full_name: fullName,
      age: age ? parseInt(age, 10) : null,
      gender: gender || null,
      physical_description: physicalDescription || null,
      clothing_last_seen: clothingLastSeen || null,
      last_seen_location: lastSeenLocation || null,
      latitude: latitude || null,
      longitude: longitude || null,
      photo_url: photoUrl || null,
      status: "SEARCHING",
      reported_at: new Date().toISOString(),
    };

    try {
      const supabase = await createClient();
      const { data, error } = await (supabase.from("missing_persons") as any)
        .insert(newRecord)
        .select()
        .single();

      if (!error && data) {
        return NextResponse.json(
          {
            success: true,
            missingPerson: data,
            message: "Missing person report successfully registered in ResQ Reunite database.",
          },
          { status: 201 }
        );
      }
    } catch {
      // Fallback response
    }

    return NextResponse.json(
      {
        success: true,
        missingPerson: newRecord,
        message: "Missing person report registered (demo mode).",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/reunite/missing error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
