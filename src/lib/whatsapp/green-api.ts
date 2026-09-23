import { SexEvent } from "@/lib/db";

interface SendMessageResponse {
  idMessage?: string;
  [key: string]: unknown;
}

export function formatChatId(input: string): string {
  const cleaned = input.trim();
  // If already a formatted chatId (individual or group)
  if (cleaned.endsWith("@c.us") || cleaned.endsWith("@g.us")) {
    return cleaned;
  }

  // Strip non-digits
  let digits = cleaned.replace(/\D/g, "");

  // Convert Israeli local format (e.g. 0501234567 -> 972501234567)
  if (digits.startsWith("0")) {
    digits = "972" + digits.slice(1);
  }

  return `${digits}@c.us`;
}

export async function sendWhatsAppMessage(
  recipient: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const instanceId = process.env.GREEN_API_INSTANCE_ID;
  const token = process.env.GREEN_API_TOKEN;

  if (!instanceId || !token) {
    return {
      success: false,
      error: "Missing GREEN_API_INSTANCE_ID or GREEN_API_TOKEN environment variables.",
    };
  }

  const chatId = formatChatId(recipient);
  const url = `https://api.green-api.com/waInstance${instanceId}/sendMessage/${token}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatId,
        message,
      }),
    });

    const data = (await res.json()) as SendMessageResponse;

    if (!res.ok) {
      return {
        success: false,
        error: `Green-API error (status ${res.status}): ${JSON.stringify(data)}`,
      };
    }

    return {
      success: true,
      messageId: data.idMessage,
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `Network/Fetch error calling Green-API: ${errMsg}`,
    };
  }
}

export function generateDailyReportMessage(
  latest: SexEvent | null,
  allEvents: SexEvent[]
): string {
  if (!latest) {
    return (
      `📢 *דו״ח בוקר יומי: מונה הסקס של דגן* 📢\n\n` +
      `🕒 *סטטוס:* טרם נרשמו דיווחים במערכת!\n` +
      `דגן, כל העם מחכה להישג הראשון... ⏳\n\n` +
      `🔗 *לכניסה ודיווח:* https://dagan-sex-counter.com`
    );
  }

  const target = new Date(latest.timestamp).getTime();
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - target) / 1000));

  const days = Math.floor(diffSec / 86400);
  const hours = Math.floor((diffSec % 86400) / 3600);
  const minutes = Math.floor((diffSec % 3600) / 60);

  let statusBadge = "שגרה מבורכת 👍";
  if (days < 1) {
    statusBadge = "דגן בשיאו! לוהט במיוחד 🔥🔥🔥";
  } else if (days < 4) {
    statusBadge = "לוהט מהתנור ⚡";
  } else if (days < 8) {
    statusBadge = "שגרה מבורכת 👍";
  } else if (days < 15) {
    statusBadge = "בצורת קלה מתפתחת 🏜️";
  } else if (days < 30) {
    statusBadge = "געגועים עזים... דגן תתעורר ⏳";
  } else {
    statusBadge = "מצב חירום לאומי! 🆘🚨";
  }

  // Format date in Hebrew
  let dateFormatted = latest.timestamp;
  try {
    const d = new Date(latest.timestamp);
    dateFormatted = d.toLocaleDateString("he-IL", {
      weekday: "long",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    // fallback
  }

  let extraDetails = "";
  if (latest.location) {
    extraDetails += `📍 *מיקום אחרון:* ${latest.location}\n`;
  }
  if (latest.durationMinutes || latest.durationCategory) {
    extraDetails += `⏱️ *משך:* ${latest.durationCategory || ""} ${
      latest.durationMinutes ? `(${latest.durationMinutes} דק׳)` : ""
    }\n`;
  }
  if (latest.notes) {
    extraDetails += `💬 *הערות:* "${latest.notes}"\n`;
  }

  // Calculate this month count
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const thisMonthCount = allEvents.filter((e) => {
    const d = new Date(e.timestamp);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  return (
    `📢 *דו״ח בוקר: מונה הסקס של דגן* 📢\n\n` +
    `⏱️ *זמן שעבר מאז הפעם האחרונה:*\n` +
    `*${days}* ימים, *${hours}* שעות ו-*${minutes}* דקות.\n\n` +
    `📊 *מצב:* ${statusBadge}\n` +
    `📅 *תאריך אחרון:* ${dateFormatted}\n` +
    (extraDetails ? `${extraDetails}\n` : `\n`) +
    `📈 *סטטיסטיקה:*\n` +
    `• סה״כ אירועים החודש: *${thisMonthCount}*\n` +
    `• סה״כ דיווחים מתועדים: *${allEvents.length}*\n\n` +
    `🔗 *למעקב חי או לדיווח חדש:* https://dagan-sex-counter.com`
  );
}
