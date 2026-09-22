import crypto from "crypto";

const TOKEN_SECRET = process.env.APP_SECRET || "dagan-sex-counter-secret-key-salt-2026";
const MIN_TIME_MS = 1500; // Must wait at least 1.5 seconds (human speed)
const MAX_TIME_MS = 15 * 60 * 1000; // Token expires after 15 minutes

interface TokenPayload {
  issuedAt: number;
  nonce: string;
}

export function generateSubmissionToken(): string {
  const payload: TokenPayload = {
    issuedAt: Date.now(),
    nonce: crypto.randomBytes(8).toString("hex"),
  };

  const payloadStr = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", TOKEN_SECRET)
    .update(payloadStr)
    .digest("base64url");

  return `${payloadStr}.${signature}`;
}

export function verifySubmissionToken(token: string): { valid: boolean; reason?: string } {
  if (!token || typeof token !== "string") {
    return { valid: false, reason: "טוקן חסר" };
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return { valid: false, reason: "פורמט טוקן לא תקין" };
  }

  const [payloadStr, signature] = parts;
  const expectedSignature = crypto
    .createHmac("sha256", TOKEN_SECRET)
    .update(payloadStr)
    .digest("base64url");
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSignature);

  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return { valid: false, reason: "חתימת טוקן שגויה" };
  }

  try {
    const payloadJson = Buffer.from(payloadStr, "base64url").toString("utf-8");
    const payload: TokenPayload = JSON.parse(payloadJson);

    const now = Date.now();
    const elapsed = now - payload.issuedAt;

    if (elapsed < MIN_TIME_MS) {
      return {
        valid: false,
        reason: "הטופס נשלח מהר מדי (חשד לבוט אוטומטי). אנא המתן מספר שניות ונסה שוב.",
      };
    }

    if (elapsed > MAX_TIME_MS) {
      return {
        valid: false,
        reason: "תוקף הטופס פג. אנא רענן את העמוד ונסה שוב.",
      };
    }

    return { valid: true };
  } catch {
    return { valid: false, reason: "טוקן פגום" };
  }
}
