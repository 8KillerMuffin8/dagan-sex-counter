import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
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

const DATABASE_URL = process.env.DATABASE_URL;

let sql: ReturnType<typeof postgres> | null = null;
let db: ReturnType<typeof drizzle> | null = null;

if (DATABASE_URL) {
  try {
    sql = postgres(DATABASE_URL, {
      ssl: process.env.NODE_ENV === "production" ? "require" : false,
      max: 10,
    });
    db = drizzle(sql, { schema });
  } catch (err) {
    console.warn("Failed to initialize Postgres client, falling back to local file storage:", err);
  }
}

// Local file storage fallback
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

// Initialize tables if on PostgreSQL
let isInitialized = false;
async function ensureTables() {
  if (!sql || isInitialized) return;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        duration_minutes INTEGER,
        duration_category VARCHAR(50),
        location VARCHAR(150),
        notes TEXT,
        ip_hash VARCHAR(64),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp DESC);
    `;
    isInitialized = true;
  } catch (err) {
    console.error("Error ensuring Postgres tables exist:", err);
  }
}

export async function getLatestEvent(): Promise<SexEvent | null> {
  if (sql) {
    await ensureTables();
    try {
      const rows = await sql`
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
      const row = rows[0];
      return {
        id: row.id,
        timestamp: new Date(row.timestamp).toISOString(),
        durationMinutes: row.durationMinutes,
        durationCategory: row.durationCategory,
        location: row.location,
        notes: row.notes,
        ipHash: row.ipHash,
        createdAt: new Date(row.createdAt).toISOString(),
      };
    } catch (err) {
      console.error("Error querying latest event from Postgres:", err);
    }
  }

  const localEvents = readLocalDb();
  if (localEvents.length === 0) return null;
  localEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return localEvents[0];
}

export async function getAllEvents(): Promise<SexEvent[]> {
  if (sql) {
    await ensureTables();
    try {
      const rows = await sql`
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
      return rows.map((row) => ({
        id: row.id,
        timestamp: new Date(row.timestamp).toISOString(),
        durationMinutes: row.durationMinutes,
        durationCategory: row.durationCategory,
        location: row.location,
        notes: row.notes,
        ipHash: row.ipHash,
        createdAt: new Date(row.createdAt).toISOString(),
      }));
    } catch (err) {
      console.error("Error querying all events from Postgres:", err);
    }
  }

  const localEvents = readLocalDb();
  localEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return localEvents;
}

export async function createEvent(data: NewSexEvent): Promise<SexEvent> {
  const ts = data.timestamp instanceof Date ? data.timestamp : new Date(data.timestamp);

  if (sql) {
    await ensureTables();
    try {
      const rows = await sql`
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
      const row = rows[0];
      return {
        id: row.id,
        timestamp: new Date(row.timestamp).toISOString(),
        durationMinutes: row.durationMinutes,
        durationCategory: row.durationCategory,
        location: row.location,
        notes: row.notes,
        ipHash: row.ipHash,
        createdAt: new Date(row.createdAt).toISOString(),
      };
    } catch (err) {
      console.error("Error creating event in Postgres:", err);
    }
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

  if (sql) {
    await ensureTables();
    try {
      const rows = await sql`
        SELECT created_at
        FROM events
        WHERE ip_hash = ${ipHash}
        ORDER BY created_at DESC
        LIMIT 1
      `;
      if (rows.length > 0) {
        return new Date(rows[0].created_at);
      }
      return null;
    } catch (err) {
      console.error("Error querying last event by ip hash:", err);
    }
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
