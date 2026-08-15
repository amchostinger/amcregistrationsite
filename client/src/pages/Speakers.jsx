import { useState, useEffect, useMemo } from "react";
import { X, MapPin, Star, ArrowRight } from "lucide-react";
import api, { assetUrl } from "../lib/api";
import RichText from "../components/ui/RichText";

/**
 * The three headings participants are organised under. Order here is the order
 * the sections appear on the page; people are sorted by display_order within
 * each one.
 */
const SECTIONS = [
  { key: "speaker",   title: "Speakers",  blurb: "Bishops, prelates and distinguished guests presenting at the conference." },
  { key: "host",      title: "Host",      blurb: "The host church and local organising leadership." },
  { key: "secretary", title: "Secretary", blurb: "The conference secretariat." },
];

const SPEAKERS_HEADER = "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1920&q=80";

function getInitials(name) {
  return name.split(" ").filter((w) => /^[A-Z]/.test(w)).slice(-2).map((w) => w[0]).join("");
}

const AVATAR_COLORS = [
  "linear-gradient(135deg, #1a2f4e 0%, #243d66 100%)",
  "linear-gradient(135deg, #243d66 0%, #3d5a8a 100%)",
  "linear-gradient(135deg, #0f1e33 0%, #1a2f4e 100%)",
  "linear-gradient(135deg, #1e3a5f 0%, #2a4f80 100%)",
];

function SpeakerModal({ speaker, onClose }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handleKey); document.body.style.overflow = ""; };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(5,15,30,0.7)", backdropFilter: "blur(8px)" }}
      onClick={onClose}>
      {/* Column layout: fixed header, scrollable bio, so long biographies are
          always readable without the dialog growing past the viewport. */}
      <div className="bg-white rounded-2xl max-w-lg w-full relative overflow-hidden flex flex-col"
        style={{ boxShadow: "var(--shadow-xl)", maxHeight: "calc(100vh - 2rem)" }}
        onClick={(e) => e.stopPropagation()}>
        {/* Top band */}
        <div className="h-2 w-full flex-shrink-0" style={{ background: "var(--gold-gradient)" }} />

        <button onClick={onClose}
          className="absolute top-5 right-5 z-10 w-9 h-9 flex items-center justify-center rounded-xl bg-white/80 backdrop-blur hover:bg-gray-100 transition-colors text-gray-400">
          <X size={18} />
        </button>

        {/* Header — stays put while the bio scrolls */}
        <div className="px-8 pt-8 pb-5 flex-shrink-0">
          <div className="flex justify-center mb-5">
            {speaker.photo_url ? (
              <img src={assetUrl(speaker.photo_url)} alt={speaker.name} className="w-28 h-28 rounded-2xl object-cover object-top" />
            ) : (
              <div className="w-28 h-28 rounded-2xl flex items-center justify-center"
                style={{ background: AVATAR_COLORS[speaker.id % 4] }}>
                <span style={{ fontFamily: "Cinzel, serif" }} className="text-white text-3xl font-bold">{getInitials(speaker.name)}</span>
              </div>
            )}
          </div>
          {speaker.keynote && (
            <div className="text-center mb-3">
              <span className="inline-flex items-center gap-1 text-xs font-body font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                style={{ background: "rgba(201,168,76,0.15)", color: "var(--color-gold)", border: "1px solid rgba(201,168,76,0.3)" }}>
                <Star size={10} fill="currentColor" /> Keynote Speaker
              </span>
            </div>
          )}
          <p className="text-center text-xs font-body font-bold uppercase tracking-widest mb-1" style={{ color: "var(--color-gold)" }}>{speaker.designation}</p>
          <h2 style={{ fontFamily: "Cinzel, serif", color: "var(--color-navy)" }} className="text-2xl font-bold text-center mb-1">{speaker.name}</h2>
          <div className="flex items-center justify-center gap-1.5 font-body text-sm" style={{ color: "var(--color-muted)" }}>
            {speaker.church}
          </div>
          {speaker.country && (
            <div className="flex items-center justify-center gap-1 font-body text-xs mt-1" style={{ color: "var(--color-muted)" }}>
              <MapPin size={11} />{speaker.country}
            </div>
          )}
        </div>

        {/* Scrollable, fully-justified biography with the author's formatting */}
        {speaker.bio && (
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin px-8 pb-8"
            style={{ borderTop: "1px solid rgba(232,224,208,0.9)" }}>
            <RichText value={speaker.bio} className="pt-5" />
          </div>
        )}
      </div>
    </div>
  );
}

function SpeakerCard({ speaker, onClick }) {
  const colorIdx = speaker.id % 4;
  return (
    <button onClick={onClick} className="group w-full text-center bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
      style={{ border: "1px solid rgba(232,224,208,0.8)", boxShadow: "var(--shadow-card)" }}>
      {/* Fixed 4:5 portrait frame — every card is the same size and the photo
          fills it exactly, whatever dimensions were uploaded. */}
      <div className="relative overflow-hidden w-full aspect-[4/5] flex items-center justify-center"
        style={{ background: AVATAR_COLORS[colorIdx] }}>
        {speaker.photo_url ? (
          <img src={assetUrl(speaker.photo_url)} alt={speaker.name}
            className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <span style={{ fontFamily: "Cinzel, serif" }} className="text-white text-4xl font-bold opacity-80">{getInitials(speaker.name)}</span>
        )}
        {speaker.keynote && (
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1 text-[10px] font-body font-bold uppercase tracking-widest px-2 py-0.5 rounded-full text-navy" style={{ background: "var(--color-gold)" }}>
              <Star size={8} fill="currentColor" /> Keynote
            </span>
          </div>
        )}
      </div>
      <div className="p-5">
        <p className="text-[10px] font-body font-bold uppercase tracking-widest mb-1" style={{ color: "var(--color-gold)" }}>{speaker.designation}</p>
        <h3 style={{ fontFamily: "Cinzel, serif", color: "var(--color-navy)" }} className="text-sm font-bold mb-1 leading-snug group-hover:text-gold transition-colors">{speaker.name}</h3>
        <p className="font-body text-xs mb-0.5" style={{ color: "var(--color-muted)" }}>{speaker.church}</p>
        {speaker.country && <p className="font-body text-xs flex items-center justify-center gap-1" style={{ color: "var(--color-muted)" }}><MapPin size={9} />{speaker.country}</p>}
        <div className="flex items-center justify-center gap-1 mt-3 text-xs font-body font-semibold" style={{ color: "var(--color-gold)" }}>
          View Bio <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </button>
  );
}

export default function Speakers() {
  const [speakers, setSpeakers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    api.get("/speakers")
      .then((res) => setSpeakers(res.data || []))
      .catch(() => setError("Unable to load speakers. Please check the server is running."))
      .finally(() => setLoading(false));
  }, []);

  // Anyone whose category is missing or unrecognised falls back to "Speakers",
  // so a new record never disappears from the page.
  const sections = useMemo(() => {
    const known = SECTIONS.map((s) => s.key);
    return SECTIONS
      .map((s) => ({
        ...s,
        people: speakers.filter((p) =>
          s.key === "speaker" ? !known.includes(p.category) || p.category === "speaker" : p.category === s.key
        ),
      }))
      .filter((s) => s.people.length);
  }, [speakers]);

  return (
    <div className="min-h-screen" style={{ background: "var(--color-cream)" }}>
      {/* Header */}
      <div className="relative overflow-hidden" style={{ background: "var(--navy-gradient)", paddingTop: "6rem", paddingBottom: "3.5rem", marginTop: "-80px" }}>
        <div className="absolute inset-0 bg-center bg-cover opacity-15" style={{ backgroundImage: `url("${SPEAKERS_HEADER}")` }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(15,30,51,0.6), rgba(15,30,51,0.9))" }} />
        <div className="section-container text-center relative z-10 pt-6">
          <span className="section-label">AMC 2027</span>
          <h1 style={{ fontFamily: "Cinzel, serif" }} className="text-4xl lg:text-5xl font-bold text-white uppercase tracking-widest mb-3">Featured Speakers</h1>
          <div style={{ height: "3px", width: "48px", background: "var(--gold-gradient)", margin: "0 auto" }} className="rounded-full" />
          <p className="font-body text-white/60 text-sm mt-3">Bishops, Prelates & Distinguished Guests</p>
        </div>
      </div>

      <div className="section-container py-14">
        <p className="text-center font-body leading-relaxed mb-12 max-w-2xl mx-auto" style={{ color: "var(--color-muted)" }}>
          The AMC 2027 Conference will feature distinguished bishops and scholars from across the Africa Methodist Council. Click any card to read a full biography.
        </p>

        {error && (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="font-body text-sm font-semibold text-red-700">Unable to Load Speakers</p>
            <p className="font-body text-xs text-red-600 mt-1">{error}</p>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-16 gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--color-gold)", borderTopColor: "transparent" }} />
            <span className="font-body text-sm text-gray-400">Loading speakers...</span>
          </div>
        )}

        {!loading && speakers.length === 0 && !error && (
          <div className="text-center py-16 rounded-2xl bg-white" style={{ border: "1px solid rgba(232,224,208,0.8)" }}>
            <p className="font-body text-gray-400 text-sm">Speaker profiles will be published soon. Check back for updates.</p>
          </div>
        )}

        {/* Three columns at desktop width, so the running order reads as the
            rows it was planned in. */}
        {sections.map(({ key, title, blurb, people }) => (
          <section key={key} className="mb-14 last:mb-0">
            <div className="flex items-center gap-4 mb-2">
              <h2 style={{ fontFamily: "Cinzel, serif", color: "var(--color-navy)" }} className="text-lg font-bold uppercase tracking-widest whitespace-nowrap">
                {title}
              </h2>
              <span className="flex-1 h-px" style={{ background: "rgba(201,168,76,0.35)" }} />
            </div>
            <p className="font-body text-xs mb-6" style={{ color: "var(--color-muted)" }}>{blurb}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {people.map((s) => (
                <SpeakerCard key={s.id} speaker={s} onClick={() => setSelected(s)} />
              ))}
            </div>
          </section>
        ))}

        <p className="text-center font-body text-xs mt-12" style={{ color: "var(--color-muted)" }}>
          * Full speaker list will be confirmed closer to the conference.
        </p>
      </div>

      {selected && <SpeakerModal speaker={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
