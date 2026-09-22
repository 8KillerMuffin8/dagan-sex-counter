"use client";

import { useState, useEffect } from "react";
import {
  Clock,
  MapPin,
  FileText,
  Rocket,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Flame,
  Calendar,
} from "lucide-react";
import ConfettiCelebration from "./ConfettiCelebration";

interface DaganReportFormProps {
  onSuccess: () => void;
  onBack: () => void;
}

const DURATION_PRESETS = [
  { label: "זריז ⚡", value: "זריז", minutes: 15 },
  { label: "קלאסי ⏱️", value: "קלאסי", minutes: 35 },
  { label: "מרתון 🏆", value: "מרתון", minutes: 75 },
];

const LOCATION_PRESETS = [
  "בבית 🏠",
  "בצימר / מלון 🏨",
  "ברכב 🚗",
  "בטבע 🌲",
];

export default function DaganReportForm({
  onSuccess,
  onBack,
}: DaganReportFormProps) {
  const [token, setToken] = useState<string | null>(null);
  const [useCurrentTime, setUseCurrentTime] = useState(true);
  const [customDateTime, setCustomDateTime] = useState("");
  const [durationCategory, setDurationCategory] = useState<string>("");
  const [durationMinutes, setDurationMinutes] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [companyWebsite, setCompanyWebsite] = useState<string>(""); // Honeypot

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCelebration, setIsCelebration] = useState(false);

  // Fetch submission token on mount
  useEffect(() => {
    async function fetchToken() {
      try {
        const res = await fetch("/api/token");
        const data = await res.json();
        if (data.token) {
          setToken(data.token);
        }
      } catch (err) {
        console.error("Failed to fetch token:", err);
      }
    }
    fetchToken();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!token) {
      setErrorMsg("טוען מזהה אבטחה, אנא נסה שוב בעוד רגע...");
      return;
    }

    setIsLoading(true);

    try {
      const timestamp = useCurrentTime
        ? new Date().toISOString()
        : customDateTime
        ? new Date(customDateTime).toISOString()
        : new Date().toISOString();

      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          timestamp,
          durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : null,
          durationCategory: durationCategory || null,
          location: location || null,
          notes: notes || null,
          company_website: companyWebsite, // Honeypot field
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "אירעה שגיאה בשמירת הדיווח");
      }

      // Success!
      setIsCelebration(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("אירעה שגיאה לא צפויה");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isCelebration) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] px-4">
        <ConfettiCelebration />
        <div className="w-full max-w-md bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-3xl p-8 border border-rose-200/50 dark:border-rose-900/40 shadow-2xl shadow-rose-500/10 text-center animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-500 mx-auto flex items-center justify-center mb-6 shadow-inner">
            <Flame className="w-10 h-10 animate-bounce" />
          </div>

          <h2 className="text-3xl font-black text-zinc-900 dark:text-zinc-50 mb-2">
            מזל טוב מלך! 🎉
          </h2>
          <p className="text-zinc-600 dark:text-zinc-300 text-lg mb-8 font-medium">
            הדיווח נשמר בהצלחה והשעון אופס.
            <br />
            העם גאה בך! 👑
          </p>

          <button
            onClick={onSuccess}
            className="w-full py-4 px-6 rounded-2xl font-bold text-lg text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 active:scale-[0.98] transition-all shadow-lg shadow-rose-500/25 cursor-pointer"
          >
            צפה בטיימר המאופס ⏱️
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] px-4 py-8">
      <div className="w-full max-w-lg bg-white/85 dark:bg-zinc-900/85 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-zinc-200/80 dark:border-zinc-800 shadow-xl shadow-zinc-950/5">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>חזרה</span>
          </button>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
            דיווח אירוע
          </span>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
            ספר לנו על זה, דגן 🔥
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            כל הפרטים למטה הם אופציונליים לחלוטין.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-200 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div className="flex-1 font-medium leading-relaxed">{errorMsg}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Honeypot field (hidden from legitimate users) */}
          <div
            aria-hidden="true"
            style={{ display: "none", position: "absolute", left: "-9999px" }}
          >
            <label htmlFor="company_website">Website</label>
            <input
              type="text"
              id="company_website"
              name="company_website"
              tabIndex={-1}
              autoComplete="off"
              value={companyWebsite}
              onChange={(e) => setCompanyWebsite(e.target.value)}
            />
          </div>

          {/* 1. Time Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              מתי זה קרה?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setUseCurrentTime(true)}
                className={`py-3 px-4 rounded-2xl text-sm font-semibold transition-all border cursor-pointer ${
                  useCurrentTime
                    ? "bg-rose-50 dark:bg-rose-950/40 border-rose-400 text-rose-700 dark:text-rose-300 shadow-sm"
                    : "bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                ממש עכשיו ⚡
              </button>
              <button
                type="button"
                onClick={() => setUseCurrentTime(false)}
                className={`py-3 px-4 rounded-2xl text-sm font-semibold transition-all border cursor-pointer ${
                  !useCurrentTime
                    ? "bg-rose-50 dark:bg-rose-950/40 border-rose-400 text-rose-700 dark:text-rose-300 shadow-sm"
                    : "bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                זמן מותאם 📅
              </button>
            </div>

            {!useCurrentTime && (
              <div className="mt-3 pt-2">
                <input
                  type="datetime-local"
                  value={customDateTime}
                  onChange={(e) => setCustomDateTime(e.target.value)}
                  className="w-full py-3 px-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50"
                />
              </div>
            )}
          </div>

          {/* 2. Duration */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-zinc-400" />
              <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                כמה זמן? (אופציונלי)
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              {DURATION_PRESETS.map((preset) => {
                const isSelected = durationCategory === preset.value;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setDurationCategory("");
                        setDurationMinutes("");
                      } else {
                        setDurationCategory(preset.value);
                        setDurationMinutes(preset.minutes.toString());
                      }
                    }}
                    className={`py-2 px-3.5 rounded-xl text-xs sm:text-sm font-medium transition-all border cursor-pointer ${
                      isSelected
                        ? "bg-pink-50 dark:bg-pink-950/40 border-pink-400 text-pink-700 dark:text-pink-300 font-semibold"
                        : "bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
            <div className="mt-2">
              <input
                type="number"
                min="1"
                max="1440"
                placeholder="או הזן דקות ידנית..."
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
              />
            </div>
          </div>

          {/* 3. Location */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-zinc-400" />
              <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                איפה זה היה? (אופציונלי)
              </label>
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              {LOCATION_PRESETS.map((loc) => {
                const isSelected = location === loc;
                return (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setLocation(isSelected ? "" : loc)}
                    className={`py-1.5 px-3 rounded-xl text-xs sm:text-sm font-medium transition-all border cursor-pointer ${
                      isSelected
                        ? "bg-rose-50 dark:bg-rose-950/40 border-rose-400 text-rose-700 dark:text-rose-300 font-semibold"
                        : "bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {loc}
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              placeholder="או הזן מיקום חופשי..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full py-2.5 px-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
            />
          </div>

          {/* 4. Notes */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-zinc-400" />
              <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                הערות / סיפור פיקנטי (אופציונלי)
              </label>
            </div>
            <textarea
              rows={3}
              placeholder="איך היה? משהו מעניין שראוי לציון?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full py-2.5 px-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-rose-500/50 resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 px-6 rounded-2xl font-bold text-lg text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-rose-500/25 flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                שומר את הדיווח...
              </span>
            ) : (
              <>
                <Rocket className="w-5 h-5" />
                <span>דווח על ההישג 🚀</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
