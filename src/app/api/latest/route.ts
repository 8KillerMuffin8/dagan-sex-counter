import { NextResponse } from "next/server";
import { getLatestEvent, getAllEvents } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [latest, all] = await Promise.all([getLatestEvent(), getAllEvents()]);
    return NextResponse.json({
      latest,
      totalCount: all.length,
    });
  } catch (err) {
    console.error("Failed to fetch latest event:", err);
    return NextResponse.json(
      { error: "שגיאה בשליפת הנתונים" },
      { status: 500 }
    );
  }
}
