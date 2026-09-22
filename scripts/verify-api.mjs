// Automated verification test script for Dagan Sex Counter

const BASE_URL = process.env.TEST_URL || "http://localhost:3009";

function log(msg, status = "INFO") {
  const icons = { INFO: "ℹ️", PASS: "✅", FAIL: "❌", WARN: "⚠️" };
  console.log(`${icons[status] || "•"} [${status}] ${msg}`);
}

async function runTests() {
  log(`Starting verification tests against ${BASE_URL}...`);
  let passed = 0;
  let failed = 0;

  async function assert(desc, fn) {
    try {
      await fn();
      log(desc, "PASS");
      passed++;
    } catch (err) {
      log(`${desc} - Error: ${err.message}`, "FAIL");
      failed++;
    }
  }

  // Test 1: Fetch Token
  let validToken = "";
  await assert("1. GET /api/token returns valid token", async () => {
    const res = await fetch(`${BASE_URL}/api/token`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.token || typeof data.token !== "string") {
      throw new Error("Missing or invalid token in response");
    }
    validToken = data.token;
  });

  // Test 2: Honeypot rejection
  await assert("2. POST /api/report rejects bot when honeypot is populated", async () => {
    const res = await fetch(`${BASE_URL}/api/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: validToken,
        company_website: "http://spam-bot.xyz",
        notes: "I am a bot",
      }),
    });
    if (res.status !== 400) {
      throw new Error(`Expected 400, got ${res.status}`);
    }
  });

  // Test 3: Rejection on tampered token
  await assert("3. POST /api/report rejects tampered token", async () => {
    const res = await fetch(`${BASE_URL}/api/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: validToken + "corrupted",
        notes: "Tampered",
      }),
    });
    if (res.status !== 403) {
      throw new Error(`Expected 403, got ${res.status}`);
    }
  });

  // Test 4: Too fast submission (< 1.5s)
  await assert("4. POST /api/report rejects submission sent too fast (< 1.5s)", async () => {
    // Fetch a brand new token right now
    const tokenRes = await fetch(`${BASE_URL}/api/token`);
    const { token: freshToken } = await tokenRes.json();

    // Immediately submit without delay
    const res = await fetch(`${BASE_URL}/api/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: freshToken,
        notes: "Super fast bot",
      }),
    });

    if (res.status !== 403) {
      throw new Error(`Expected 403 for fast submission, got ${res.status}`);
    }
    const data = await res.json();
    if (!data.error || !data.error.includes("מהר מדי")) {
      throw new Error(`Expected fast submission error message, got: ${data.error}`);
    }
  });

  // Test 5: Legitimate human submission (wait 1.6s)
  await assert("5. POST /api/report succeeds after waiting human time (> 1.5s)", async () => {
    const tokenRes = await fetch(`${BASE_URL}/api/token`);
    const { token } = await tokenRes.json();

    // Wait 1.6 seconds to emulate human filling form
    log("Waiting 1.6 seconds to simulate human interaction...");
    await new Promise((r) => setTimeout(r, 1600));

    const res = await fetch(`${BASE_URL}/api/report`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": "203.0.113.195", // unique test IP
      },
      body: JSON.stringify({
        token,
        durationMinutes: 45,
        durationCategory: "קלאסי",
        location: "בצימר בצפון",
        notes: "היה מדהים, דגן במיטבו!",
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(`Status ${res.status}: ${JSON.stringify(data)}`);
    }

    const data = await res.json();
    if (!data.success || !data.event) {
      throw new Error("Invalid success response");
    }
  });

  // Test 6: Rate limit cooldown (same IP within 30 minutes)
  await assert("6. POST /api/report blocks duplicate report within 30 min (429)", async () => {
    const tokenRes = await fetch(`${BASE_URL}/api/token`);
    const { token } = await tokenRes.json();
    await new Promise((r) => setTimeout(r, 1600));

    const res = await fetch(`${BASE_URL}/api/report`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": "203.0.113.195", // Same test IP
      },
      body: JSON.stringify({
        token,
        notes: "Another one immediately",
      }),
    });

    if (res.status !== 429) {
      throw new Error(`Expected 429 Rate Limit, got ${res.status}`);
    }

    const data = await res.json();
    if (!data.error || !data.error.includes("30 דקות")) {
      throw new Error(`Expected 30 min cooldown message, got: ${data.error}`);
    }
  });

  // Test 7: GET /api/latest
  await assert("7. GET /api/latest returns the reported event", async () => {
    const res = await fetch(`${BASE_URL}/api/latest`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.latest) throw new Error("Expected latest event, got null");
    if (data.latest.location !== "בצימר בצפון") {
      throw new Error(`Expected location 'בצימר בצפון', got '${data.latest.location}'`);
    }
    if (data.totalCount < 1) {
      throw new Error(`Expected totalCount >= 1, got ${data.totalCount}`);
    }
  });

  // Test 8: GET /api/events
  await assert("8. GET /api/events returns event list for calendar", async () => {
    const res = await fetch(`${BASE_URL}/api/events`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.events) || data.events.length < 1) {
      throw new Error("Expected array of events");
    }
    const found = data.events.find((e) => e.location === "בצימר בצפון");
    if (!found) throw new Error("Created event not found in events list");
  });

  console.log("\n==================================");
  console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
