"use client";

import { useState, useEffect, useCallback } from "react";
import Gatekeeper from "@/components/Gatekeeper";
import DaganReportForm from "@/components/DaganReportForm";
import LiveTimer from "@/components/LiveTimer";
import EventsCalendar from "@/components/EventsCalendar";
import { SexEvent } from "@/lib/db";
import { Flame, ShieldCheck, Heart } from "lucide-react";

type ViewState = "gate" | "report" | "timer" | "calendar";

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewState>("gate");
  const [latestEvent, setLatestEvent] = useState<SexEvent | null>(null);
  const [allEvents, setAllEvents] = useState<SexEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial data
  const loadData = useCallback(async () => {
    try {
      const [latestRes, eventsRes] = await Promise.all([
        fetch("/api/latest"),
        fetch("/api/events"),
      ]);

      const latestData = await latestRes.json();
      const eventsData = await eventsRes.json();

      if (latestData.latest) {
        setLatestEvent(latestData.latest);
      }
      if (eventsData.events) {
        setAllEvents(eventsData.events);
      }
    } catch (err) {
      console.error("Failed to fetch initial events:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Gatekeeper choice
  const handleGateSelect = (isDagan: boolean) => {
    if (isDagan) {
      setCurrentView("report");
    } else {
      setCurrentView("timer");
    }
  };

  // Handle successful report
  const handleReportSuccess = async () => {
    await loadData();
    setCurrentView("timer");
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-x-hidden">
      {/* Decorative background glows */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-rose-400/15 dark:bg-rose-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 bg-pink-400/15 dark:bg-pink-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-amber-400/10 dark:bg-amber-600/5 rounded-full blur-3xl" />
      </div>

      {/* Top Header */}
      <header className="w-full max-w-2xl mx-auto px-4 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-zinc-900 dark:text-zinc-50 leading-tight">
              מונה הסקס של דגן
            </h1>
            <p className="text-[11px] font-mono text-zinc-400 tracking-wider">
              dagan-sex-counter.com
            </p>
          </div>
        </div>

        {currentView !== "gate" && (
          <button
            onClick={() => setCurrentView("gate")}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl text-zinc-600 dark:text-zinc-300 bg-white/70 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            החלף משתמש 🔄
          </button>
        )}
      </header>

      {/* Main Content View */}
      <main className="flex-1 w-full max-w-2xl mx-auto flex flex-col justify-center">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-3 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
            <span className="text-sm font-medium text-zinc-400">
              טוען נתונים...
            </span>
          </div>
        ) : (
          <>
            {currentView === "gate" && (
              <Gatekeeper onSelect={handleGateSelect} />
            )}

            {currentView === "report" && (
              <DaganReportForm
                onSuccess={handleReportSuccess}
                onBack={() => setCurrentView("timer")}
              />
            )}

            {currentView === "timer" && (
              <LiveTimer
                initialLatest={latestEvent}
                totalCount={allEvents.length}
                onOpenCalendar={() => setCurrentView("calendar")}
                onSwitchToDagan={() => setCurrentView("report")}
              />
            )}

            {currentView === "calendar" && (
              <EventsCalendar
                events={allEvents}
                onBack={() => setCurrentView("timer")}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-2xl mx-auto px-4 py-6 text-center text-xs text-zinc-600 dark:text-zinc-300 border-t border-zinc-200/60 dark:border-zinc-800/60 mt-8">
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <span>נבנה באהבה גדולה עבור דגן</span>
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
        </div>
        <p className="opacity-75">
          מוגן ע״י מערכת בדיקת בוטים ומגבלת 30 דקות בין דיווחים
        </p>
      </footer>
    </div>
  );
}
