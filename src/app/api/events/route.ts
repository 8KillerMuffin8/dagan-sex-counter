import { NextResponse } from "next/server";
import { getAllEvents } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const events = await getAllEvents();
    return NextResponse.json({ events });
  } catch (err) {
    console.error("Failed to fetch events:", err);
    return NextResponse.json(
      { error: "שגיאה בשליפת האירועים" },
      { status: 500 }
    );
  }
}
