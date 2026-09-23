import { NextRequest, NextResponse } from "next/server";
import { getLatestEvent, getAllEvents } from "@/lib/db";
import {
  generateDailyReportMessage,
  sendWhatsAppMessage,
} from "@/lib/whatsapp/green-api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Verify CRON_SECRET if configured
  if (cronSecret) {
    const isVercelCron = authHeader === `Bearer ${cronSecret}`;
    const isSecretQuery = searchParams.get("secret") === cronSecret;

    if (!isVercelCron && !isSecretQuery) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const [latest, all] = await Promise.all([getLatestEvent(), getAllEvents()]);
    const message = generateDailyReportMessage(latest, all);

    // If preview requested, return the formatted message without sending
    if (searchParams.get("preview") === "true") {
      return NextResponse.json({
        preview: true,
        message,
        recipient: searchParams.get("to") || process.env.WHATSAPP_RECIPIENT || "not configured",
      });
    }

    const recipient = searchParams.get("to") || process.env.WHATSAPP_RECIPIENT;
    if (!recipient) {
      return NextResponse.json(
        {
          error:
            "Missing WHATSAPP_RECIPIENT environment variable (or ?to= query parameter).",
          messagePreview: message,
        },
        { status: 400 }
      );
    }

    const result = await sendWhatsAppMessage(recipient, message);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error,
          messagePreview: message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      recipient,
      message,
    });
  } catch (err: unknown) {
    console.error("Error running daily report cron:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
