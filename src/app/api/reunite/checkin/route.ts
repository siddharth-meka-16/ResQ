import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const FALLBACK_CHECKINS = [
  {
    id: "chk-001",
    shelter_id: "sh-001",
    shelter: { id: "sh-001", name: "Sector 4 Community Relief Shelter", status: "OPEN" },
    person_name: "Aarav Sharma",
    age: 7,
    gender: "MALE",
    phone: null,
    medical_condition: "Minor scrapes, stable, wearing yellow shirt and shorts",
    checked_in_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "chk-002",
    shelter_id: "sh-002",
    shelter: { id: "sh-002", name: "Metro High School Relief Camp", status: "OPEN" },
    person_name: "Suresh Patel",
    age: 42,
    gender: "MALE",
    phone: "+91-98765-11223",
    medical_condition: "Mild dehydration",
    checked_in_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shelterId = searchParams.get("shelterId");

    let checkins: any[] = FALLBACK_CHECKINS;

    try {
      const supabase = await createClient();
      let query = supabase
        .from("shelter_checkins")
        .select("*, shelter:shelters(id, name, address, status)")
        .order("checked_in_at", { ascending: false });

      if (shelterId) {
        query = query.eq("shelter_id", shelterId);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        checkins = data;
      }
    } catch {
      // Fallback
    }

    return NextResponse.json({
      success: true,
      count: checkins.length,
      checkins,
    });
  } catch (error) {
    console.error("GET /api/reunite/checkin error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      shelterId = "sh-001",
      personName,
      age,
      gender,
      phone,
      medicalCondition,
    } = body;

    if (!personName) {
      return NextResponse.json(
        { error: "personName is required." },
        { status: 400 }
      );
    }

    const newCheckin = {
      id: "chk-" + Math.random().toString(36).substring(2, 9),
      shelter_id: shelterId,
      person_name: personName,
      age: age ? parseInt(age, 10) : null,
      gender: gender || null,
      phone: phone || null,
      medical_condition: medicalCondition || null,
      checked_in_at: new Date().toISOString(),
    };

    try {
      const supabase = await createClient();
      const { data, error } = await (supabase.from("shelter_checkins") as any)
        .insert(newCheckin)
        .select()
        .single();

      if (!error && data) {
        return NextResponse.json(
          {
            success: true,
            checkin: data,
            message: "Displaced citizen successfully checked into relief shelter.",
          },
          { status: 201 }
        );
      }
    } catch {
      // Fallback
    }

    return NextResponse.json(
      {
        success: true,
        checkin: newCheckin,
        message: "Citizen checked into shelter registry (demo mode).",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/reunite/checkin error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
