import crypto from "crypto";
import { getLastEventByIpHash } from "@/lib/db";

const IP_SALT = process.env.APP_SECRET || "dagan-salt-secure-hash-2026";
const COOLDOWN_MINUTES = 30;

// In-memory sliding window for flood protection
interface AttemptRecord {
  count: number;
  resetAt: number;
}
const ipAttempts = new Map<string, AttemptRecord>();

// Clean up stale memory records periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of ipAttempts.entries()) {
    if (value.resetAt < now) {
      ipAttempts.delete(key);
    }
  }
}, 60 * 1000);

export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0].trim();
    if (firstIp) return firstIp;
  }
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();

  return "127.0.0.1";
}

export function hashIp(ip: string): string {
  return crypto
    .createHash("sha256")
    .update(`${ip}:${IP_SALT}`)
    .digest("hex");
}

export async function checkRateLimit(headers: Headers): Promise<{
  allowed: boolean;
  reason?: string;
  remainingMinutes?: number;
  ipHash: string;
}> {
  const clientIp = getClientIp(headers);
  const ipHash = hashIp(clientIp);
  const now = Date.now();

  // 1. Anti-flood protection (max 5 requests per 2 minutes per IP)
  const attempt = ipAttempts.get(ipHash);
  if (attempt) {
    if (now < attempt.resetAt) {
      if (attempt.count >= 5) {
        return {
          allowed: false,
          reason: "יותר מדי בקשות בזמן קצר. אנא המתן מספר דקות.",
          ipHash,
        };
      }
      attempt.count += 1;
    } else {
      ipAttempts.set(ipHash, { count: 1, resetAt: now + 2 * 60 * 1000 });
    }
  } else {
    ipAttempts.set(ipHash, { count: 1, resetAt: now + 2 * 60 * 1000 });
  }

  // 2. 30-minute cooldown since last event created by this IP
  const lastCreated = await getLastEventByIpHash(ipHash);
  if (lastCreated) {
    const diffMs = now - lastCreated.getTime();
    const cooldownMs = COOLDOWN_MINUTES * 60 * 1000;
    if (diffMs < cooldownMs) {
      const remainingMinutes = Math.ceil((cooldownMs - diffMs) / (60 * 1000));
      return {
        allowed: false,
        reason: `ניתן לדווח פעם ב-${COOLDOWN_MINUTES} דקות בלבד. תן לדגן לנוח קצת! (נותרו עוד ${remainingMinutes} דקות)`,
        remainingMinutes,
        ipHash,
      };
    }
  }

  return { allowed: true, ipHash };
}
