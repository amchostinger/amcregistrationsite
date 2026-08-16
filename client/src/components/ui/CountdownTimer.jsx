import { useState, useEffect } from "react";

const CONFERENCE_DATE = new Date("2027-03-09T09:00:00+02:00");

function getTimeLeft() {
  const diff = CONFERENCE_DATE - Date.now();
  if (diff <= 0) return null;
  return {
    days:    Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours:   Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function Unit({ value, label }) {
  return (
    <div className="flex flex-col items-center gap-2 min-w-0">
      {/* Full-width inside its grid cell on phones; fixed width once the row
          has space for the separators from `sm` up. */}
      <div
        className="relative w-full sm:w-auto sm:min-w-[88px] text-center px-1.5 sm:px-4 py-3 sm:py-4 rounded-xl sm:rounded-2xl overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(201,168,76,0.3)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.1)",
        }}
      >
        {/* Subtle top highlight */}
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "rgba(201,168,76,0.4)" }} />
        <span
          style={{ fontFamily: "Cinzel, serif" }}
          className="text-[2rem] sm:text-6xl font-bold text-white leading-none tracking-wide tabular-nums"
        >
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="text-[10px] font-body font-bold uppercase tracking-[0.2em]" style={{ color: "var(--color-gold)" }}>
        {label}
      </span>
    </div>
  );
}

function Separator() {
  return (
    <div className="hidden sm:flex flex-col gap-2 mb-6 pb-1">
      <div className="w-1 h-1 rounded-full" style={{ background: "rgba(201,168,76,0.5)" }} />
      <div className="w-1 h-1 rounded-full" style={{ background: "rgba(201,168,76,0.5)" }} />
    </div>
  );
}

export default function CountdownTimer() {
  const [time, setTime] = useState(getTimeLeft);

  useEffect(() => {
    const id = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!time) {
    return (
      <div style={{ fontFamily: "Cinzel, serif" }} className="text-gold text-xl sm:text-2xl font-bold tracking-widest uppercase text-center">
        The Conference is Underway!
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2 sm:flex sm:justify-center sm:items-end sm:gap-5">
      <Unit value={time.days}    label="Days" />
      <Separator />
      <Unit value={time.hours}   label="Hours" />
      <Separator />
      <Unit value={time.minutes} label="Mins" />
      <Separator />
      <Unit value={time.seconds} label="Secs" />
    </div>
  );
}
