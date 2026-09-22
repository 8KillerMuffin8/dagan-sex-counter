import { NextResponse } from "next/server";
import { ensureTables, getAllEvents } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const hasPostgres = Boolean(
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING
  );

  const envVarsDetected = {
    POSTGRES_URL: Boolean(process.env.POSTGRES_URL),
    DATABASE_URL: Boolean(process.env.DATABASE_URL),
    POSTGRES_PRISMA_URL: Boolean(process.env.POSTGRES_PRISMA_URL),
    POSTGRES_URL_NON_POOLING: Boolean(process.env.POSTGRES_URL_NON_POOLING),
  };

  try {
    await ensureTables();
    const events = await getAllEvents();
    return NextResponse.json({
      status: "ok",
      driver: hasPostgres ? "neon-postgres" : "local-file-fallback",
      envVarsDetected,
      tablesReady: true,
      eventsCount: events.length,
    });
  } catch (err: unknown) {
    console.error("Database check failed:", err);
    return NextResponse.json(
      {
        status: "error",
        driver: hasPostgres ? "neon-postgres" : "local-file-fallback",
        envVarsDetected,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
