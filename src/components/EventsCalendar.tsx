"use client";

import { useState, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  ArrowRight,
  Clock,
  MapPin,
  FileText,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { SexEvent } from "@/lib/db";

interface EventsCalendarProps {
  events: SexEvent[];
  onBack: () => void;
}

const HEBREW_MONTHS = [
  "ינואר",
  "פברואר",
  "מרץ",
  "אפריל",
  "מאי",
  "יוני",
  "יולי",
  "אוגוסט",
  "ספטמבר",
  "אוקטובר",
  "נובמבר",
  "דצמבר",
];

const WEEKDAYS = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

export default function EventsCalendar({ events, onBack }: EventsCalendarProps) {
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);

  // Month navigation in calendar
  const [viewDate, setViewDate] = useState(() => {
    if (events.length > 0) {
      return new Date(events[0].timestamp);
    }
    return new Date();
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // Map events to date string "YYYY-MM-DD"
  const eventsByDate = useMemo(() => {
    const map = new Map<string, SexEvent[]>();
    for (const event of events) {
      const d = new Date(event.timestamp);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;
      const list = map.get(key) || [];
      list.push(event);
      map.set(key, list);
    }
    return map;
  }, [events]);

  // Calendar days grid calculation
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: { day: number; dateKey: string; hasEvents: boolean; count: number }[] = [];

    // Empty cells before first day
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ day: 0, dateKey: "", hasEvents: false, count: 0 });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayEvents = eventsByDate.get(dateKey) || [];
      days.push({
        day: d,
        dateKey,
        hasEvents: dayEvents.length > 0,
        count: dayEvents.length,
      });
    }

    return days;
  }, [year, month, eventsByDate]);

  const prevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
    setSelectedDateFilter(null);
  };

  const nextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
    setSelectedDateFilter(null);
  };

  const filteredEvents = useMemo(() => {
    if (!selectedDateFilter) return events;
    return events.filter((e) => {
      const d = new Date(e.timestamp);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;
      return key === selectedDateFilter;
    });
  }, [events, selectedDateFilter]);

  const formatDateHebrew = (iso: string) => {
    try {
      const date = new Date(iso);
      return date.toLocaleDateString("he-IL", {
        weekday: "short",
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-[85vh] px-4 py-8 w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-6 pb-4 border-b border-zinc-200/80 dark:border-zinc-800">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>חזרה לשעון</span>
        </button>

        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-rose-500" />
          <h1 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50">
            יומן אירועים 📅
          </h1>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/70 dark:border-zinc-800 rounded-2xl p-3 text-center shadow-xs">
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
            {events.length}
          </div>
          <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            סה״כ אירועים
          </div>
        </div>

        <div className="bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/70 dark:border-zinc-800 rounded-2xl p-3 text-center shadow-xs">
          <div className="text-2xl font-black text-zinc-800 dark:text-zinc-200">
            {
              events.filter((e) => {
                const d = new Date(e.timestamp);
                const now = new Date();
                return (
                  d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
                );
              }).length
            }
          </div>
          <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            אירועים החודש
          </div>
        </div>

        <div className="bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/70 dark:border-zinc-800 rounded-2xl p-3 text-center shadow-xs col-span-2 sm:col-span-1">
          <div className="text-2xl font-black text-amber-500">
            {events.length > 0 ? "פעיל 🔥" : "טרם החל"}
          </div>
          <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            סטטוס כללי
          </div>
        </div>
      </div>

      {/* Monthly Interactive Calendar Card */}
      <div className="w-full bg-white/85 dark:bg-zinc-900/85 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-zinc-200/80 dark:border-zinc-800 shadow-xl shadow-zinc-950/5 mb-8">
        {/* Month Navigator */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {HEBREW_MONTHS[month]} {year}
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={nextMonth}
              title="חודש הבא"
              className="p-1.5 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={prevMonth}
              title="חודש קודם"
              className="p-1.5 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {WEEKDAYS.map((dayName, idx) => (
            <div
              key={idx}
              className="text-xs font-bold text-zinc-400 dark:text-zinc-500 py-1"
            >
              {dayName}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {calendarDays.map((cell, idx) => {
            if (cell.day === 0) {
              return <div key={idx} className="aspect-square" />;
            }

            const isSelected = selectedDateFilter === cell.dateKey;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  if (cell.hasEvents) {
                    setSelectedDateFilter(isSelected ? null : cell.dateKey);
                  }
                }}
                disabled={!cell.hasEvents}
                className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                  cell.hasEvents
                    ? isSelected
                      ? "bg-rose-500 text-white font-bold shadow-md shadow-rose-500/30 scale-105"
                      : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-900/60 hover:scale-105"
                    : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-default"
                }`}
              >
                <span className="text-xs sm:text-sm">{cell.day}</span>
                {cell.hasEvents && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                      isSelected ? "bg-white" : "bg-rose-500 animate-pulse"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {selectedDateFilter && (
          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-rose-600 dark:text-rose-400 font-semibold">
            <span>מציג אירועים מיום: {selectedDateFilter}</span>
            <button
              onClick={() => setSelectedDateFilter(null)}
              className="underline cursor-pointer hover:text-rose-700"
            >
              הצג את כל האירועים
            </button>
          </div>
        )}
      </div>

      {/* Events List */}
      <div className="w-full space-y-3">
        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>פירוט האירועים</span>
          <span className="text-xs text-zinc-400 font-normal">
            ({filteredEvents.length} אירועים)
          </span>
        </h3>

        {filteredEvents.length === 0 ? (
          <div className="bg-white/60 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl p-8 text-center text-zinc-400 text-sm">
            לא נמצאו אירועים מתאימים
          </div>
        ) : (
          filteredEvents.map((event) => (
            <div
              key={event.id}
              className="w-full bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/70 dark:border-zinc-800 rounded-2xl p-4 shadow-xs hover:border-rose-200 dark:hover:border-rose-900/50 transition-all text-right space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300">
                  {formatDateHebrew(event.timestamp)}
                </span>
                {event.durationCategory && (
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-lg">
                    {event.durationCategory}
                  </span>
                )}
              </div>

              {event.durationMinutes && (
                <div className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  <span>משך: {event.durationMinutes} דקות</span>
                </div>
              )}

              {event.location && (
                <div className="text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                  <span>מיקום: {event.location}</span>
                </div>
              )}

              {event.notes && (
                <div className="text-xs text-zinc-700 dark:text-zinc-300 pt-1.5 border-t border-zinc-100 dark:border-zinc-800 flex items-start gap-1.5 leading-relaxed font-medium">
                  <FileText className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0 mt-0.5" />
                  <span>&ldquo;{event.notes}&rdquo;</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
