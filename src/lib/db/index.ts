import { neon } from "@neondatabase/serverless";
import fs from "fs";
import path from "path";

export interface SexEvent {
  id: number;
  timestamp: string; // ISO string
  durationMinutes: number | null;
  durationCategory: string | null;
  location: string | null;
  notes: string | null;
  ipHash: string | null;
  createdAt: string; // ISO string
}

export interface NewSexEvent {
  timestamp: Date;
  durationMinutes?: number | null;
  durationCategory?: string | null;
  location?: string | null;
  notes?: string | null;
  ipHash?: string | null;
}

// Detect connection string from standard Vercel & Neon env vars
const connectionString =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING;

const neonSql = connectionString ? neon(connectionString) : null;

// Local file storage fallback for offline / local testing without Postgres
const LOCAL_DB_PATH = path.join(process.cwd(), ".local-db.json");

function readLocalDb(): SexEvent[] {
  try {
    if (!fs.existsSync(LOCAL_DB_PATH)) {
      return [];
    }
    const data = fs.readFileSync(LOCAL_DB_PATH, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading local db:", err);
    return [];
  }
}

function writeLocalDb(events: SexEvent[]): void {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(events, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing local db:", err);
  }
}

// Initialize tables if on PostgreSQL / Neon
let isInitialized = false;
export async function ensureTables() {
  if (!neonSql || isInitialized) return;
  try {
    // Run separate statements (Postgres prepared statements require individual commands)
    await neonSql`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        duration_minutes INTEGER,
        duration_category VARCHAR(50),
        location VARCHAR(150),
        notes TEXT,
        ip_hash VARCHAR(64),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;

    await neonSql`
      CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp DESC)
    `;

    isInitialized = true;
    console.log("Postgres tables verified successfully.");
  } catch (err) {
    console.error("Error ensuring Postgres tables exist:", err);
    throw err;
  }
}

export async function getLatestEvent(): Promise<SexEvent | null> {
  if (neonSql) {
    await ensureTables();
    const rows = await neonSql`
      SELECT 
        id,
        timestamp,
        duration_minutes as "durationMinutes",
        duration_category as "durationCategory",
        location,
        notes,
        ip_hash as "ipHash",
        created_at as "createdAt"
      FROM events 
      ORDER BY timestamp DESC 
      LIMIT 1
    `;
    if (rows.length === 0) return null;
    const row = rows[0] as Record<string, unknown>;
    return {
      id: Number(row.id),
      timestamp: new Date(String(row.timestamp)).toISOString(),
      durationMinutes: row.durationMinutes !== null ? Number(row.durationMinutes) : null,
      durationCategory: row.durationCategory ? String(row.durationCategory) : null,
      location: row.location ? String(row.location) : null,
      notes: row.notes ? String(row.notes) : null,
      ipHash: row.ipHash ? String(row.ipHash) : null,
      createdAt: new Date(String(row.createdAt)).toISOString(),
    };
  }

  const localEvents = readLocalDb();
  if (localEvents.length === 0) return null;
  localEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return localEvents[0];
}

export async function getAllEvents(): Promise<SexEvent[]> {
  if (neonSql) {
    await ensureTables();
    const rows = await neonSql`
      SELECT 
        id,
        timestamp,
        duration_minutes as "durationMinutes",
        duration_category as "durationCategory",
        location,
        notes,
        ip_hash as "ipHash",
        created_at as "createdAt"
      FROM events 
      ORDER BY timestamp DESC
    `;
    return rows.map((rowRecord) => {
      const row = rowRecord as Record<string, unknown>;
      return {
        id: Number(row.id),
        timestamp: new Date(String(row.timestamp)).toISOString(),
        durationMinutes: row.durationMinutes !== null ? Number(row.durationMinutes) : null,
        durationCategory: row.durationCategory ? String(row.durationCategory) : null,
        location: row.location ? String(row.location) : null,
        notes: row.notes ? String(row.notes) : null,
        ipHash: row.ipHash ? String(row.ipHash) : null,
        createdAt: new Date(String(row.createdAt)).toISOString(),
      };
    });
  }

  const localEvents = readLocalDb();
  localEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return localEvents;
}

export async function createEvent(data: NewSexEvent): Promise<SexEvent> {
  const ts = data.timestamp instanceof Date ? data.timestamp : new Date(data.timestamp);

  if (neonSql) {
    await ensureTables();
    const rows = await neonSql`
      INSERT INTO events (
        timestamp,
        duration_minutes,
        duration_category,
        location,
        notes,
        ip_hash
      ) VALUES (
        ${ts.toISOString()},
        ${data.durationMinutes ?? null},
        ${data.durationCategory ?? null},
        ${data.location ?? null},
        ${data.notes ?? null},
        ${data.ipHash ?? null}
      )
      RETURNING 
        id,
        timestamp,
        duration_minutes as "durationMinutes",
        duration_category as "durationCategory",
        location,
        notes,
        ip_hash as "ipHash",
        created_at as "createdAt"
    `;
    const row = rows[0] as Record<string, unknown>;
    return {
      id: Number(row.id),
      timestamp: new Date(String(row.timestamp)).toISOString(),
      durationMinutes: row.durationMinutes !== null ? Number(row.durationMinutes) : null,
      durationCategory: row.durationCategory ? String(row.durationCategory) : null,
      location: row.location ? String(row.location) : null,
      notes: row.notes ? String(row.notes) : null,
      ipHash: row.ipHash ? String(row.ipHash) : null,
      createdAt: new Date(String(row.createdAt)).toISOString(),
    };
  }

  const localEvents = readLocalDb();
  const nextId = localEvents.reduce((max, e) => Math.max(max, e.id), 0) + 1;
  const newEvent: SexEvent = {
    id: nextId,
    timestamp: ts.toISOString(),
    durationMinutes: data.durationMinutes ?? null,
    durationCategory: data.durationCategory ?? null,
    location: data.location ?? null,
    notes: data.notes ?? null,
    ipHash: data.ipHash ?? null,
    createdAt: new Date().toISOString(),
  };
  localEvents.push(newEvent);
  writeLocalDb(localEvents);
  return newEvent;
}

export async function getLastEventByIpHash(ipHash: string): Promise<Date | null> {
  if (!ipHash) return null;

  if (neonSql) {
    await ensureTables();
    const rows = await neonSql`
      SELECT created_at as "createdAt"
      FROM events
      WHERE ip_hash = ${ipHash}
      ORDER BY created_at DESC
      LIMIT 1
    `;
    if (rows.length > 0) {
      const row = rows[0] as Record<string, unknown>;
      return new Date(String(row.createdAt));
    }
    return null;
  }

  const localEvents = readLocalDb();
  const matching = localEvents
    .filter((e) => e.ipHash === ipHash)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (matching.length > 0) {
    return new Date(matching[0].createdAt);
  }
  return null;
}
