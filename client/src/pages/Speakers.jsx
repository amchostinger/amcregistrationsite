import { useState, useEffect, useMemo } from "react";
import { X, MapPin, Star, ArrowRight, Search } from "lucide-react";
import api, { assetUrl } from "../lib/api";
import RichText from "../components/ui/RichText";
import { SPEAKER_SECTIONS, SECTION_KEYS } from "../lib/speakerSections";

/** Every section uses this one grid, so card size never varies between them. */
const GRID = "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5";

const SPEAKERS_HEADER = "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1920&q=80";

function getInitials(name) {
  const caps = name.split(" ").filter((w) => /^[A-Z]/.test(w));
  return (caps.length ? caps : name.split(" ")).slice(-2).map((w) => w[0]).join("");
}

/** Placeholder people are stored as a name and nothing else. */
function hasProfile(speaker) {
  return Boolean(speaker.bio?.trim());
}

const AVATAR_COLORS = [
  "linear-gradient(135deg, #1a2f4e 0%, #243d66 100%)",
  "linear-gradient(135deg, #243d66 0%, #3d5a8a 100%)",
  "linear-gradient(135deg, #0f1e33 0%, #1a2f4e 100%)",
  "linear-gradient(135deg, #1e3a5f 0%, #2a4f80 100%)",
];

function SpeakerModal({ speaker, showKeynoteBadge, onClose }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handleKey); document.body.style.overflow = ""; };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      style={{ background: "rgba(5,15,30,0.7)", backdropFilter: "blur(8px)" }}
      onClick={onClose}>
      {/* Column layout: fixed header, scrollable bio, so long biographies are
          always readable without the dialog growing past the viewport. */}
      <div className="bg-white rounded-2xl max-w-lg w-full relative overflow-hidden flex flex-col"
        style={{ boxShadow: "var(--shadow-xl)", maxHeight: "calc(100vh - 1.5rem)" }}
        onClick={(e) => e.stopPropagation()}>
        {/* Top band */}
        <div className="h-2 w-full flex-shrink-0" style={{ background: "var(--gold-gradient)" }} />

        <button onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 z-10 w-9 h-9 flex items-center justify-center rounded-xl bg-white/80 backdrop-blur hover:bg-gray-100 transition-colors text-gray-400">
          <X size={18} />
        </button>

        {/* Header — stays put while the bio scrolls */}
        <div className="px-5 sm:px-8 pt-8 pb-5 flex-shrink-0">
          <div className="flex justify-center mb-5">
            {speaker.photo_url ? (
              <img src={assetUrl(speaker.photo_url)} alt={speaker.name} className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover object-top" />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl flex items-center justify-center"
                style={{ background: AVATAR_COLORS[speaker.id % 4] }}>
                <span style={{ fontFamily: "Cinzel, serif" }} className="text-white text-3xl font-bold">{getInitials(speaker.name)}</span>
              </div>
            )}
          </div>
          {showKeynoteBadge && speaker.keynote && (
            <div className="text-center mb-3">
              <span className="inline-flex items-center gap-1 text-xs font-body font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                style={{ background: "rgba(201,168,76,0.15)", color: "var(--color-gold)", border: "1px solid rgba(201,168,76,0.3)" }}>
                <Star size={10} fill="currentColor" /> Keynote Speaker
              </span>
            </div>
          )}
          {speaker.designation && (
            <p className="text-center text-xs font-body font-bold uppercase tracking-widest mb-1" style={{ color: "var(--color-gold)" }}>{speaker.designation}</p>
          )}
          <h2 style={{ fontFamily: "Cinzel, serif", color: "var(--color-navy)" }} className="text-xl sm:text-2xl font-bold text-center mb-1 break-words">{speaker.name}</h2>
          {speaker.church && (
            <div className="flex items-center justify-center gap-1.5 font-body text-sm text-center" style={{ color: "var(--color-muted)" }}>
              {speaker.church}
            </div>
          )}
          {speaker.country && (
            <div className="flex items-center justify-center gap-1 font-body text-xs mt-1" style={{ color: "var(--color-muted)" }}>
              <MapPin size={11} />{speaker.country}
            </div>
          )}
        </div>

        {/* Scrollable, fully-justified biography with the author's formatting */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin px-5 sm:px-8 pb-8"
          style={{ borderTop: "1px solid rgba(232,224,208,0.9)" }}>
          {hasProfile(speaker)
            ? <RichText value={speaker.bio} className="pt-5" />
            : <p className="pt-5 font-body text-sm text-center" style={{ color: "var(--color-muted)" }}>Biography coming soon.</p>}
        </div>
      </div>
    </div>
  );
}

function SpeakerCard({ speaker, showKeynoteBadge, onClick }) {
  const colorIdx = speaker.id % 4;
  // flex-col matters: a bare <button> centres its content box, which leaves a
  // gap above the portrait whenever a neighbouring card in the row is taller.
  return (
    <button onClick={onClick} className="group w-full h-full flex flex-col text-center bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
      style={{ border: "1px solid rgba(232,224,208,0.8)", boxShadow: "var(--shadow-card)" }}>
      {/* Fixed 4:5 portrait frame — every card is the same size and the photo
          fills it exactly, whatever dimensions were uploaded. */}
      <div className="relative overflow-hidden w-full aspect-[4/5] flex-shrink-0 flex items-center justify-center"
        style={{ background: AVATAR_COLORS[colorIdx] }}>
        {speaker.photo_url ? (
          <img src={assetUrl(speaker.photo_url)} alt={speaker.name}
            className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <span style={{ fontFamily: "Cinzel, serif" }} className="text-white text-3xl sm:text-4xl font-bold opacity-80">{getInitials(speaker.name)}</span>
        )}
        {showKeynoteBadge && speaker.keynote && (
          <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3">
            <span className="inline-flex items-center gap-1 text-[10px] font-body font-bold uppercase tracking-widest px-2 py-0.5 rounded-full text-navy" style={{ background: "var(--color-gold)" }}>
              <Star size={8} fill="currentColor" /> Keynote
            </span>
          </div>
        )}
      </div>
      <div className="p-3 sm:p-3.5">
        {speaker.designation && (
          <p className="text-[9px] font-body font-bold uppercase tracking-widest mb-1 leading-tight" style={{ color: "var(--color-gold)" }}>{speaker.designation}</p>
        )}
        <h3 style={{ fontFamily: "Cinzel, serif", color: "var(--color-navy)" }} className="text-[11px] sm:text-xs font-bold mb-1 leading-snug break-words group-hover:text-gold transition-colors">{speaker.name}</h3>
        {speaker.church && <p className="font-body text-[11px] mb-0.5 leading-snug" style={{ color: "var(--color-muted)" }}>{speaker.church}</p>}
        {speaker.country && <p className="font-body text-[11px] flex items-center justify-center gap-1" style={{ color: "var(--color-muted)" }}><MapPin size={9} />{speaker.country}</p>}
        <div className="flex items-center justify-center gap-1 mt-2 text-[11px] font-body font-semibold" style={{ color: "var(--color-gold)" }}>
          {hasProfile(speaker)
            ? <>View Bio <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" /></>
            : <span style={{ color: "var(--color-muted)" }}>Profile coming soon</span>}
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
  const [search, setSearch] = useState("");
  const [section, setSection] = useState("");

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
    const term = search.trim().toLowerCase();
    const matches = (p) =>
      !term ||
      [p.name, p.designation, p.church, p.country].some((f) => (f || "").toLowerCase().includes(term));

    return SPEAKER_SECTIONS
      .filter((s) => !section || s.key === section)
      .map((s) => ({
        ...s,
        people: speakers.filter((p) =>
          (s.key === "speaker" ? !SECTION_KEYS.includes(p.category) || p.category === "speaker" : p.category === s.key)
          && matches(p)
        ),
      }))
      .filter((s) => s.people.length);
  }, [speakers, search, section]);

  const resultCount = sections.reduce((n, s) => n + s.people.length, 0);
  const filtering = Boolean(search.trim() || section);

  return (
    <div className="min-h-screen" style={{ background: "var(--color-cream)" }}>
      {/* Header */}
      <div className="relative overflow-hidden" style={{ background: "var(--navy-gradient)", paddingTop: "6rem", paddingBottom: "3.5rem", marginTop: "-80px" }}>
        <div className="absolute inset-0 bg-center bg-cover opacity-15" style={{ backgroundImage: `url("${SPEAKERS_HEADER}")` }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(15,30,51,0.6), rgba(15,30,51,0.9))" }} />
        <div className="section-container text-center relative z-10 pt-6">
          <span className="section-label">AMC 2027</span>
          <h1 style={{ fontFamily: "Cinzel, serif" }} className="page-title text-white mb-3">Featured Speakers</h1>
          <div style={{ height: "3px", width: "48px", background: "var(--gold-gradient)", margin: "0 auto" }} className="rounded-full" />
          <p className="font-body text-white/60 text-sm mt-3">Bishops, Prelates &amp; Distinguished Guests</p>
        </div>
      </div>

      <div className="section-container py-10 sm:py-14">
        <p className="text-center font-body text-sm sm:text-base leading-relaxed mb-8 max-w-2xl mx-auto" style={{ color: "var(--color-muted)" }}>
          The AMC 2027 Conference will feature distinguished bishops and scholars from across the Africa Methodist Council. Tap any card to read a full biography.
        </p>

        {/* Search + section filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-10 max-w-3xl mx-auto">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--color-muted)" }} />
            <input
              type="search"
              className="form-input pl-10"
              placeholder="Search by name, church or country…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-input sm:w-56"
            value={section}
            onChange={(e) => setSection(e.target.value)}
            aria-label="Filter by section"
          >
            <option value="">All sections</option>
            {SPEAKER_SECTIONS.map((s) => <option key={s.key} value={s.key}>{s.title}</option>)}
          </select>
          {filtering && (
            <button
              type="button"
              className="btn-outline py-3 px-5 text-sm whitespace-nowrap"
              onClick={() => { setSearch(""); setSection(""); }}
            >
              Clear
            </button>
          )}
        </div>

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

        {!loading && speakers.length > 0 && resultCount === 0 && (
          <div className="text-center py-16 rounded-2xl bg-white" style={{ border: "1px solid rgba(232,224,208,0.8)" }}>
            <p className="font-body text-gray-400 text-sm">No one matches that search.</p>
          </div>
        )}

        {sections.map(({ key, title, blurb, people }) => (
          <section key={key} className="mb-12 sm:mb-14 last:mb-0">
            <div className="flex items-center gap-3 sm:gap-4 mb-2">
              <h2 style={{ fontFamily: "Cinzel, serif", color: "var(--color-navy)" }} className="text-base sm:text-lg font-bold uppercase tracking-wider sm:tracking-widest">
                {title}
              </h2>
              <span className="flex-1 h-px" style={{ background: "rgba(201,168,76,0.35)" }} />
            </div>
            <p className="font-body text-xs mb-5 sm:mb-6" style={{ color: "var(--color-muted)" }}>{blurb}</p>

            <div className={GRID}>
              {people.map((s) => (
                <SpeakerCard
                  key={s.id}
                  speaker={s}
                  showKeynoteBadge={key !== "keynote"}
                  onClick={() => setSelected({ ...s, __section: key })}
                />
              ))}
            </div>
          </section>
        ))}

        <p className="text-center font-body text-xs mt-12" style={{ color: "var(--color-muted)" }}>
          * Full speaker list will be confirmed closer to the conference.
        </p>
      </div>

      {selected && (
        <SpeakerModal
          speaker={selected}
          showKeynoteBadge={selected.__section !== "keynote"}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
