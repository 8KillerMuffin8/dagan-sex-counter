import { pgTable, serial, timestamp, integer, varchar, text } from "drizzle-orm/pg-core";

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
  durationMinutes: integer("duration_minutes"),
  durationCategory: varchar("duration_category", { length: 50 }),
  location: varchar("location", { length: 150 }),
  notes: text("notes"),
  ipHash: varchar("ip_hash", { length: 64 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type EventRecord = typeof events.$inferSelect;
export type NewEventRecord = typeof events.$inferInsert;
