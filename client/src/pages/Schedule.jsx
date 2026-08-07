import { useState, useEffect, useMemo } from "react";
import { Mic2, MapPin, Radio, Shirt, Clock3 } from "lucide-react";
import api from "../lib/api";

const DAYS = [
  { iso: "2027-03-09", label: "Tue 9 Mar",  title: "Arrival & Opening",          dressCode: null },
  { iso: "2027-03-10", label: "Wed 10 Mar", title: "Business Day I",             dressCode: null },
  { iso: "2027-03-11", label: "Thu 11 Mar", title: "Women's Day",                dressCode: "All delegates wear BLACK" },
  { iso: "2027-03-12", label: "Fri 12 Mar", title: "Celebration of Diversity",   dressCode: "Wear church material/logo" },
  { iso: "2027-03-13", label: "Sat 13 Mar", title: "African Culture Celebration",dressCode: "Wear traditional attire of your country. Excursion after lunch" },
  { iso: "2027-03-14", label: "Sun 14 Mar", title: "Church Services",            dressCode: "Wear church uniforms. Services around Harare" },
];

const TYPE_META = {
  worship:   { label: "Worship",   dot: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe", text: "#1e40af" },
  keynote:   { label: "Keynote",   dot: "#c9a84c", bg: "#fdf8ec", border: "#f1da97", text: "#92400e" },
  general:   { label: "Business",  dot: "#1a2f4e", bg: "#f0f4f9", border: "#c7d5e8", text: "#1a2f4e" },
  social:    { label: "Social",    dot: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe", text: "#5b21b6" },
  break:     { label: "Break",     dot: "#9ca3af", bg: "#f9fafb", border: "#e5e7eb", text: "#6b7280" },
  logistics: { label: "Logistics", dot: "#9ca3af", bg: "#f9fafb", border: "#e5e7eb", text: "#6b7280" },
};

function isHappeningNow(isoDate, timeStr, endStr) {
  const now = new Date();
  const base = new Date(isoDate);
  const [sh, sm] = timeStr.split(":").map(Number);
  const start = new Date(base.getFullYear(), base.getMonth(), base.getDate(), sh, sm);
  if (!endStr) return false;
  const [eh, em] = endStr.split(":").map(Number);
  const end = new Date(base.getFullYear(), base.getMonth(), base.getDate(), eh, em);
  return now >= start && now <= end;
}

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseSessionWindow(isoDate, session) {
  const base = new Date(isoDate);
  const startTime = session.time || session.start_time || "";
  const endTime = session.end || session.end_time || null;
  const [sh, sm] = startTime.split(":").map(Number);
  const start = startTime ? new Date(base.getFullYear(), base.getMonth(), base.getDate(), sh || 0, sm || 0) : null;
  let end = null;
  if (endTime) {
    const [eh, em] = endTime.split(":").map(Number);
    end = new Date(base.getFullYear(), base.getMonth(), base.getDate(), eh || 0, em || 0);
  }
  return { start, end, startTime, endTime };
}

function getCountdownParts(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { hours, minutes, seconds };
}

function formatCountdown(ms) {
  const { hours, minutes, seconds } = getCountdownParts(ms);
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function SessionCard({ session, isoDate }) {
  const meta = TYPE_META[session.type] || TYPE_META.general;
  const live = isHappeningNow(isoDate, session.time || session.start_time, session.end || session.end_time);
  const startT = session.time || (session.start_time ? session.start_time.slice(0,5) : "");
  const endT   = session.end  || (session.end_time   ? session.end_time.slice(0,5)   : "");
  const timeStr = endT ? `${startT} – ${endT}` : startT;

  return (
    <div className="flex gap-4 group mb-3">
      <div className="flex flex-col items-center pt-1.5 flex-shrink-0">
        <div
          className="w-3 h-3 rounded-full border-2 border-white flex-shrink-0 transition-all"
          style={{ backgroundColor: live ? "#c9a84c" : meta.dot, boxShadow: live ? "0 0 0 3px rgba(201,168,76,0.3)" : "none" }}
        />
        <div className="w-px flex-1 mt-1 opacity-30" style={{ background: meta.dot }} />
      </div>
      <div
        className="mb-1 flex-1 p-4 rounded-xl border transition-all duration-200 hover:-translate-y-0.5"
        style={{
          background: live ? "rgba(201,168,76,0.06)" : meta.bg,
          borderColor: live ? "#c9a84c" : meta.border,
          boxShadow: live ? "0 4px 16px rgba(201,168,76,0.12)" : "none",
        }}
      >
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              {live && (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-body font-bold uppercase tracking-widest text-navy px-2.5 py-0.5 rounded-full" style={{ background: "var(--color-gold)" }}>
                  <Radio size={9} className="animate-pulse" />Live
                </span>
              )}
              <span className="text-[10px] font-body font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full"
                style={{ background: meta.bg, color: meta.text, border: `1px solid ${meta.border}` }}>
                {meta.label}
              </span>
            </div>
            <p className="font-body font-semibold text-sm leading-snug" style={{ color: live ? "#1a2f4e" : meta.text }}>
              {session.title}
            </p>
            {(session.speaker || session.description) && (
              <p className="text-xs font-body mt-1 flex items-center gap-1" style={{ color: "var(--color-muted)" }}>
                <Mic2 size={10} className="flex-shrink-0" />
                {session.speaker || session.description}
              </p>
            )}
            {session.room && (
              <p className="text-xs font-body mt-0.5 flex items-center gap-1" style={{ color: "var(--color-muted)" }}>
                <MapPin size={10} className="flex-shrink-0" />{session.room}
              </p>
            )}
          </div>
          <span className="font-body text-xs font-semibold flex-shrink-0 pt-0.5 whitespace-nowrap" style={{ color: "var(--color-muted)" }}>
            {timeStr}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Schedule() {
  const today = todayIso();
  const defaultDay = DAYS.find((d) => d.iso === today) ? today : DAYS[0].iso;
  const [activeDay, setActiveDay] = useState(defaultDay);
  const [sessions, setSessions] = useState(null);
  const [liveSession, setLiveSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    setLoading(true);
    setError("");
    api.get(`/schedule?date=${activeDay}`)
      .then((res) => { setSessions(res.data || []); })
      .catch(() => { setSessions([]); setError("Unable to load schedule. Please check the server is running."); })
      .finally(() => setLoading(false));
  }, [activeDay]);

  useEffect(() => {
    api.get("/schedule/live").then((res) => setLiveSession(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const displaySessions = sessions ?? [];
  const activeDayMeta = DAYS.find((d) => d.iso === activeDay);

  const currentProgramme = useMemo(() => {
    const items = displaySessions
      .map((session) => ({ ...session, ...parseSessionWindow(activeDay, session) }))
      .filter((item) => item.start)
      .sort((a, b) => a.start - b.start);

    const current = items.find((item) => item.end && now >= item.start && now <= item.end) || null;
    const next = items.find((item) => item.start && item.start > now) || null;

    if (current) {
      return {
        mode: "current",
        session: current,
        countdownText: current.end ? `Ends ${current.end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : "Now underway",
      };
    }

    if (next) {
      const diff = next.start - now;
      return {
        mode: "next",
        session: next,
        countdownText: formatCountdown(diff),
      };
    }

    return { mode: "done", session: null, countdownText: "Programme complete" };
  }, [activeDay, displaySessions, now]);

  return (
    <div className="min-h-screen" style={{ background: "var(--color-cream)" }}>
      {/* Header */}
      <div className="relative overflow-hidden" style={{ background: "var(--navy-gradient)", paddingTop: "6rem", paddingBottom: "3.5rem", marginTop: "-80px" }}>
        <div className="section-container text-center relative z-10 pt-6">
          <span className="section-label">AMC 2027</span>
          <h1 style={{ fontFamily: "Cinzel, serif" }} className="text-4xl lg:text-5xl font-bold text-white uppercase tracking-widest mb-3">Conference Schedule</h1>
          <div style={{ height: "3px", width: "48px", background: "var(--gold-gradient)", margin: "0 auto" }} className="rounded-full" />
          <p className="font-body text-white/60 text-sm mt-3">March 9–14, 2027 · Harare, Zimbabwe</p>
        </div>
      </div>

      {/* Live banner */}
      {(liveSession || currentProgramme.session) && (
        <div style={{ background: "var(--color-gold)" }}>
          <div className="section-container py-3 flex items-center gap-3">
            <Radio size={14} className="text-navy animate-pulse flex-shrink-0" />
            <p className="font-body text-sm font-bold text-navy">
              {currentProgramme.mode === "current"
                ? `We are currently here on the programme: ${currentProgramme.session?.title || liveSession?.title || ""}`
                : currentProgramme.mode === "next"
                  ? `Next on the programme: ${currentProgramme.session?.title || liveSession?.title || ""}`
                  : "The programme for today is complete."}
            </p>
          </div>
        </div>
      )}

      <div className="section-container py-10">
        {/* Day Tabs */}
        <div className="sticky top-[72px] z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 mb-8"
          style={{ background: "var(--color-cream)", borderBottom: "1px solid var(--color-cream-dark)" }}>
          <div className="flex overflow-x-auto gap-2 pb-1" style={{ scrollbarWidth: "none" }}>
            {DAYS.map((day) => (
              <button key={day.iso} onClick={() => setActiveDay(day.iso)}
                className="flex-shrink-0 px-4 py-2.5 rounded-xl font-body text-xs font-bold tracking-wide transition-all duration-150 whitespace-nowrap"
                style={activeDay === day.iso
                  ? { background: "var(--color-navy)", color: "white", boxShadow: "0 2px 8px rgba(26,47,78,0.25)" }
                  : { background: "white", color: "var(--color-navy)", border: "1px solid rgba(26,47,78,0.15)" }
                }>
                {day.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="font-body text-sm font-semibold text-red-700">Unable to Load Schedule</p>
            <p className="font-body text-xs text-red-600 mt-1">{error}</p>
          </div>
        )}

        {currentProgramme.session && (
          <div className="mb-8 rounded-[1.75rem] border p-5 md:p-6" style={{ background: "rgba(26,47,78,0.04)", borderColor: "rgba(26,47,78,0.12)" }}>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <p className="section-label text-left mb-2">Programme Pulse</p>
                <h3 style={{ fontFamily: "Cinzel, serif" }} className="text-xl font-bold text-navy uppercase tracking-wide">
                  {currentProgramme.mode === "current" ? "We are currently here" : "Next up"}
                </h3>
                <p className="font-body text-sm text-gray-700 mt-2 leading-relaxed">
                  {currentProgramme.session.title}
                </p>
                {currentProgramme.session.room && (
                  <p className="font-body text-sm text-gray-500 mt-1">{currentProgramme.session.room}</p>
                )}
              </div>
              <div className="rounded-2xl border px-4 py-4 min-w-[180px]" style={{ background: "white", borderColor: "rgba(201,168,76,0.22)" }}>
                <div className="flex items-center gap-2 text-navy mb-2">
                  <Clock3 size={15} />
                  <span className="font-body text-xs font-semibold uppercase tracking-[0.2em]">Countdown</span>
                </div>
                <p className="text-2xl font-bold text-navy">{currentProgramme.countdownText}</p>
                <p className="font-body text-xs text-gray-500 mt-1">
                  {currentProgramme.mode === "current" ? "until this programme item closes" : "until the next programme item begins"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Day heading */}
        <div className="mb-8">
          <h2 style={{ fontFamily: "Cinzel, serif", color: "var(--color-navy)" }} className="text-xl font-bold uppercase tracking-wider">
            {activeDayMeta?.title ?? ""}
          </h2>
          <div className="mt-2" style={{ width: 32, height: 2, background: "var(--gold-gradient)", borderRadius: 2 }} />
          {activeDayMeta?.dressCode && (
            <div className="mt-4 p-4 rounded-xl flex items-center gap-3" style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)" }}>
              <Shirt size={16} style={{ color: "var(--color-gold)", flexShrink: 0 }} />
              <p className="font-body text-sm font-semibold" style={{ color: "var(--color-navy)" }}>{activeDayMeta.dressCode}</p>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mb-8 p-4 rounded-xl bg-white" style={{ border: "1px solid rgba(232,224,208,0.8)" }}>
          {Object.entries(TYPE_META).filter(([k]) => k !== "logistics").map(([key, meta]) => (
            <span key={key} className="flex items-center gap-1.5 text-xs font-body font-medium" style={{ color: "var(--color-muted)" }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.dot }} />
              {meta.label}
            </span>
          ))}
        </div>

        {/* Timeline */}
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--color-gold)", borderTopColor: "transparent" }} />
            <span className="font-body text-sm" style={{ color: "var(--color-muted)" }}>Loading schedule...</span>
          </div>
        ) : displaySessions.length === 0 && !error ? (
          <div className="text-center py-16 rounded-2xl bg-white" style={{ border: "1px solid rgba(232,224,208,0.8)" }}>
            <p className="font-body text-gray-400 text-sm">No sessions scheduled for this day.</p>
          </div>
        ) : (
          <div className="pl-2">
            {displaySessions.map((session, i) => (
              <SessionCard key={i} session={session} isoDate={activeDay} />
            ))}
          </div>
        )}

        <p className="text-xs font-body text-center mt-8" style={{ color: "var(--color-muted)" }}>
          * Schedule is subject to change. Check back for updates.
        </p>
      </div>
    </div>
  );
}
