import { NextRequest, NextResponse } from "next/server";
import { verifySubmissionToken } from "@/lib/security/token";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { createEvent } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      token,
      timestamp,
      durationMinutes,
      durationCategory,
      location,
      notes,
      company_website, // Honeypot
    } = body;

    // 1. Honeypot check
    if (company_website) {
      // Quiet rejection for bots
      console.warn("Honeypot triggered, rejecting bot submission.");
      return NextResponse.json(
        { error: "בקשה לא חוקית" },
        { status: 400 }
      );
    }

    // 2. Token verification (signature + minimum 1.5s human time)
    const tokenCheck = verifySubmissionToken(token);
    if (!tokenCheck.valid) {
      return NextResponse.json(
        { error: tokenCheck.reason || "טוקן לא תקין" },
        { status: 403 }
      );
    }

    // 3. Rate limiting (30-minute cooldown + flood protection)
    const rateCheck = await checkRateLimit(request.headers);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: rateCheck.reason || "חריגה ממגבלת הקצב" },
        { status: 429 }
      );
    }

    // 4. Validate timestamp
    let eventTime = new Date();
    if (timestamp) {
      const parsedTime = new Date(timestamp);
      if (!isNaN(parsedTime.getTime())) {
        // Allow up to 10 minutes in the future for clock drift, but not days in advance
        if (parsedTime.getTime() > Date.now() + 10 * 60 * 1000) {
          return NextResponse.json(
            { error: "לא ניתן לדווח על אירוע בעתיד הרחוק 😅" },
            { status: 400 }
          );
        }
        eventTime = parsedTime;
      }
    }

    // 5. Sanitize optional fields
    const sanitizedDurationMinutes =
      durationMinutes && !isNaN(Number(durationMinutes))
        ? Math.min(Math.max(Number(durationMinutes), 1), 1440)
        : null;

    const sanitizedCategory =
      typeof durationCategory === "string"
        ? durationCategory.trim().slice(0, 50)
        : null;

    const sanitizedLocation =
      typeof location === "string" ? location.trim().slice(0, 150) : null;

    const sanitizedNotes =
      typeof notes === "string" ? notes.trim().slice(0, 1000) : null;

    // 6. Save event
    const newEvent = await createEvent({
      timestamp: eventTime,
      durationMinutes: sanitizedDurationMinutes,
      durationCategory: sanitizedCategory,
      location: sanitizedLocation,
      notes: sanitizedNotes,
      ipHash: rateCheck.ipHash,
    });

    return NextResponse.json({
      success: true,
      message: "הדיווח נשמר בהצלחה! השעון אופס 🎉",
      event: newEvent,
    });
  } catch (err) {
    console.error("Error processing report:", err);
    return NextResponse.json(
      { error: "שגיאה בעיבוד הדיווח. אנא נסה שוב." },
      { status: 500 }
    );
  }
}
