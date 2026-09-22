"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Flame,
  AlertTriangle,
  Smile,
  Heart,
  RefreshCw,
  MapPin,
  FileText,
  UserCheck,
} from "lucide-react";
import { SexEvent } from "@/lib/db";

interface LiveTimerProps {
  initialLatest: SexEvent | null;
  totalCount: number;
  onOpenCalendar: () => void;
  onSwitchToDagan: () => void;
}

interface ElapsedTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
}

function calculateElapsed(targetIso: string): ElapsedTime {
  const target = new Date(targetIso).getTime();
  const now = Date.now();
  const diff = Math.max(0, Math.floor((now - target) / 1000));

  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;

  return { days, hours, minutes, seconds, totalSeconds: diff };
}

function getStatusBadge(totalSeconds: number) {
  const hours = totalSeconds / 3600;
  const days = hours / 24;

  if (days < 1) {
    return {
      text: "דגן בשיאו! 🔥",
      description: "ממש לאחרונה, המנוע עדיין חם!",
      badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
      icon: Flame,
    };
  }
  if (days < 4) {
    return {
      text: "לוהט מהתנור ⚡",
      description: "קצב רענן ומכובד ביותר.",
      badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      icon: Smile,
    };
  }
  if (days < 8) {
    return {
      text: "שגרה מבורכת 👍",
      description: "הכל תקין, הנתונים בטווח הנורמה.",
      badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      icon: Heart,
    };
  }
  if (days < 15) {
    return {
      text: "בצורת קלה 🏜️",
      description: "מתחילים להרגיש את היובש בשטח...",
      badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      icon: Clock,
    };
  }
  if (days < 30) {
    return {
      text: "געגועים עזים... ⏳",
      description: "דגן, העם מתגעגע לדיווח חדש.",
      badgeClass: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
      icon: Clock,
    };
  }
  return {
    text: "מצב חירום לאומי! 🆘",
    description: "חודש ומעלה! מישהו מוכן לקרוא לדגן?",
    badgeClass: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    icon: AlertTriangle,
  };
}

export default function LiveTimer({
  initialLatest,
  totalCount,
  onOpenCalendar,
  onSwitchToDagan,
}: LiveTimerProps) {
  const [latestEvent, setLatestEvent] = useState<SexEvent | null>(initialLatest);
  const [elapsed, setElapsed] = useState<ElapsedTime | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync when initialLatest prop changes
  useEffect(() => {
    setLatestEvent(initialLatest);
  }, [initialLatest]);

  // Real-time ticking every second
  useEffect(() => {
    if (!latestEvent) return;

    setElapsed(calculateElapsed(latestEvent.timestamp));

    const interval = setInterval(() => {
      setElapsed(calculateElapsed(latestEvent.timestamp));
    }, 1000);

    return () => clearInterval(interval);
  }, [latestEvent]);

  // Refresh latest event from server
  const refreshLatest = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/latest");
      const data = await res.json();
      if (data.latest) {
        setLatestEvent(data.latest);
      }
    } catch (err) {
      console.error("Failed to refresh latest event:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const status = elapsed ? getStatusBadge(elapsed.totalSeconds) : null;
  const StatusIcon = status?.icon;

  const formatDateHebrew = (iso: string) => {
    try {
      const date = new Date(iso);
      return date.toLocaleDateString("he-IL", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] px-4 py-8">
      <div className="w-full max-w-xl bg-white/85 dark:bg-zinc-900/85 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-zinc-200/80 dark:border-zinc-800 shadow-xl shadow-zinc-950/5 text-center">
        {/* Header Badge */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <button
            onClick={onSwitchToDagan}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 transition-colors py-1 px-3 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/40 cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            <span>אני דגן! (לדיווח)</span>
          </button>

          <button
            onClick={refreshLatest}
            title="רענן נתונים"
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-zinc-600 dark:text-zinc-400 mb-2">
          הזמן שעבר מאז שדגן עשה סקס לאחרונה:
        </h2>

        {latestEvent && elapsed ? (
          <>
            {/* Live Counter Display */}
            <div className="grid grid-cols-4 gap-2 sm:gap-4 my-8">
              {/* Days */}
              <div className="bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-800/80 dark:to-zinc-800/40 border border-zinc-200/70 dark:border-zinc-700/60 rounded-2xl p-3 sm:p-4 flex flex-col items-center shadow-xs">
                <span className="text-3xl sm:text-5xl font-black text-zinc-900 dark:text-zinc-50 font-mono tracking-tight">
                  {elapsed.days}
                </span>
                <span className="text-xs sm:text-sm font-bold text-zinc-500 dark:text-zinc-400 mt-1">
                  ימים
                </span>
              </div>

              {/* Hours */}
              <div className="bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-800/80 dark:to-zinc-800/40 border border-zinc-200/70 dark:border-zinc-700/60 rounded-2xl p-3 sm:p-4 flex flex-col items-center shadow-xs">
                <span className="text-3xl sm:text-5xl font-black text-zinc-900 dark:text-zinc-50 font-mono tracking-tight">
                  {String(elapsed.hours).padStart(2, "0")}
                </span>
                <span className="text-xs sm:text-sm font-bold text-zinc-500 dark:text-zinc-400 mt-1">
                  שעות
                </span>
              </div>

              {/* Minutes */}
              <div className="bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-800/80 dark:to-zinc-800/40 border border-zinc-200/70 dark:border-zinc-700/60 rounded-2xl p-3 sm:p-4 flex flex-col items-center shadow-xs">
                <span className="text-3xl sm:text-5xl font-black text-zinc-900 dark:text-zinc-50 font-mono tracking-tight">
                  {String(elapsed.minutes).padStart(2, "0")}
                </span>
                <span className="text-xs sm:text-sm font-bold text-zinc-500 dark:text-zinc-400 mt-1">
                  דקות
                </span>
              </div>

              {/* Seconds */}
              <div className="bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-800/80 dark:to-zinc-800/40 border border-zinc-200/70 dark:border-zinc-700/60 rounded-2xl p-3 sm:p-4 flex flex-col items-center shadow-xs">
                <span className="text-3xl sm:text-5xl font-black text-rose-600 dark:text-rose-400 font-mono tracking-tight">
                  {String(elapsed.seconds).padStart(2, "0")}
                </span>
                <span className="text-xs sm:text-sm font-bold text-zinc-500 dark:text-zinc-400 mt-1">
                  שניות
                </span>
              </div>
            </div>

            {/* Status Badge */}
            {status && (
              <div
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-sm sm:text-base font-bold mb-6 ${status.badgeClass}`}
              >
                {StatusIcon && <StatusIcon className="w-5 h-5 flex-shrink-0" />}
                <span>{status.text}</span>
                <span className="font-normal text-xs opacity-75 hidden sm:inline">
                  — {status.description}
                </span>
              </div>
            )}

            {/* Latest Details Card */}
            <div className="w-full bg-zinc-50/70 dark:bg-zinc-800/40 border border-zinc-200/50 dark:border-zinc-800 rounded-2xl p-4 mb-8 text-right space-y-2 text-xs sm:text-sm">
              <div className="text-zinc-500 dark:text-zinc-400 font-medium">
                📅 <strong className="text-zinc-800 dark:text-zinc-200 font-semibold">תאריך:</strong>{" "}
                {formatDateHebrew(latestEvent.timestamp)}
              </div>
              {latestEvent.durationMinutes || latestEvent.durationCategory ? (
                <div className="text-zinc-500 dark:text-zinc-400 font-medium">
                  ⏱️ <strong className="text-zinc-800 dark:text-zinc-200 font-semibold">משך:</strong>{" "}
                  {latestEvent.durationCategory || ""}{" "}
                  {latestEvent.durationMinutes ? `(${latestEvent.durationMinutes} דקות)` : ""}
                </div>
              ) : null}
              {latestEvent.location && (
                <div className="text-zinc-500 dark:text-zinc-400 font-medium">
                  📍 <strong className="text-zinc-800 dark:text-zinc-200 font-semibold">מיקום:</strong>{" "}
                  {latestEvent.location}
                </div>
              )}
              {latestEvent.notes && (
                <div className="text-zinc-500 dark:text-zinc-400 font-medium pt-1 border-t border-zinc-200/40 dark:border-zinc-700/40">
                  💬 <strong className="text-zinc-800 dark:text-zinc-200 font-semibold">הערות:</strong>{" "}
                  &ldquo;{latestEvent.notes}&rdquo;
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="py-12 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-500 mx-auto flex items-center justify-center mb-4">
              <Clock className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 mb-1">
              עדיין לא נרשמו דיווחים
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 max-w-sm mx-auto">
              השעון ממתין לדגן שיבוא וידווח על ההישג הראשון שלו!
            </p>
          </div>
        )}

        {/* Action Button: Open Calendar */}
        <button
          onClick={onOpenCalendar}
          className="w-full py-4 px-6 rounded-2xl font-bold text-base sm:text-lg text-zinc-800 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer shadow-sm"
        >
          <Calendar className="w-5 h-5 text-rose-500" />
          <span>פתח יומן אירועים 📅 ({totalCount})</span>
        </button>
      </div>
    </div>
  );
}
