import { useState, useEffect } from "react";
import { X, MapPin, Wifi, Coffee, Car, Dumbbell, CheckCircle, Info, AlertTriangle } from "lucide-react";
import api from "../lib/api";

const HOTEL_IMAGES = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80",
  "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600&q=80",
  "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=600&q=80",
  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&q=80",
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&q=80",
  "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600&q=80",
  "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=600&q=80",
];

// Local photos for our partner hotels, matched on the hotel name.
const LOCAL_HOTEL_IMAGES = [
  { match: /rainbow/i,             src: "/images/rainbow_hotel.jpg" },
  { match: /island/i,              src: "/images/island_hotel.jpg" },
  { match: /kentucky/i,            src: "/images/kentucky.webp" },
];

function hotelImage(hotel, imgIndex) {
  if (hotel.photo_url) return hotel.photo_url;
  const local = LOCAL_HOTEL_IMAGES.find((entry) => entry.match.test(hotel.name || ""));
  return local ? local.src : HOTEL_IMAGES[imgIndex % HOTEL_IMAGES.length];
}

const NIGHTS = 5;

function normalizeWebsiteUrl(url) {
  if (!url) return '';
  const trimmed = String(url).trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

const AMENITY_ICONS = {
  "WiFi": Wifi, "Pool": Coffee, "Gym": Dumbbell, "Restaurant": Coffee,
  "Parking": Car, "Shuttle": Car, "Business Centre": Wifi, "Spa": Coffee,
};

function Stars({ n }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className={`w-3.5 h-3.5 ${i < n ? "text-gold" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.951a1 1 0 00.95.69h4.15c.969 0 1.371 1.24.588 1.81l-3.36 2.44a1 1 0 00-.364 1.118l1.287 3.952c.3.921-.755 1.688-1.54 1.118l-3.36-2.44a1 1 0 00-1.175 0l-3.36 2.44c-.784.57-1.838-.197-1.539-1.118l1.287-3.952a1 1 0 00-.364-1.118L2.075 9.378c-.783-.57-.38-1.81.588-1.81h4.15a1 1 0 00.95-.69l1.286-3.951z" />
        </svg>
      ))}
    </span>
  );
}

function ReserveModal({ hotel, onClose, onSuccess }) {
  const [form, setForm] = useState({ name: "", email: "", rooms: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const totalCost = form.rooms * hotel.price_usd * NIGHTS;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) { setError("Please fill in your name and email."); return; }
    setLoading(true); setError("");
    try {
      const res = await api.post("/hotels/reserve", { hotel_id: hotel.id, guest_name: form.name.trim(), guest_email: form.email.trim().toLowerCase(), rooms: form.rooms, nights: NIGHTS });
      onSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Reservation failed. Please try again.");
    } finally { setLoading(false); }
  };

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handler); document.body.style.overflow = ""; };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(5,15,30,0.7)", backdropFilter: "blur(8px)" }}
      onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full relative overflow-hidden"
        style={{ boxShadow: "var(--shadow-xl)" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="h-2 w-full" style={{ background: "var(--gold-gradient)" }} />
        <div className="p-7">
          <button onClick={onClose} className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors text-gray-400"><X size={18} /></button>
          <h2 style={{ fontFamily: "Cinzel, serif", color: "var(--color-navy)" }} className="text-xl font-bold mb-0.5">Reserve Room</h2>
          <p className="font-body text-sm mb-6" style={{ color: "var(--color-muted)" }}>{hotel.name}</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="form-label">Full Name</label><input type="text" className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your full name" required /></div>
            <div><label className="form-label">Email Address</label><input type="email" className="form-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="your@email.com" required /></div>
            <div><label className="form-label">Rooms</label>
              <select className="form-input" value={form.rooms} onChange={(e) => setForm({ ...form, rooms: parseInt(e.target.value, 10) })}>
                {[1,2,3,4].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="rounded-xl p-4" style={{ background: "var(--color-cream-dark)" }}>
              <div className="flex justify-between font-body text-sm mb-1">
                <span style={{ color: "var(--color-muted)" }}>${hotel.price_usd} &times; {form.rooms} room{form.rooms > 1 ? "s" : ""} &times; {NIGHTS} nights</span>
                <span className="font-bold" style={{ color: "var(--color-navy)" }}>${totalCost.toFixed(2)}</span>
              </div>
              <p className="text-xs font-body" style={{ color: "var(--color-muted)" }}>Check-in: 9 Mar &middot; Check-out: 14 Mar 2027</p>
              <p className="text-xs font-body mt-1 font-semibold" style={{ color: "var(--color-gold)" }}>Reservation held for 2 hours &mdash; confirm after registration payment.</p>
            </div>
            {error && <p className="font-body text-xs text-red-600">{error}</p>}
            <button type="submit" className="btn-gold w-full" disabled={loading}>{loading ? "Reserving..." : "Confirm Reservation"}</button>
          </form>
        </div>
      </div>
    </div>
  );
}

function SuccessBanner({ booking, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(5,15,30,0.7)", backdropFilter: "blur(8px)" }}>
      <div className="bg-white rounded-2xl max-w-sm w-full p-8 text-center" style={{ boxShadow: "var(--shadow-xl)" }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(5,150,105,0.1)" }}>
          <CheckCircle size={32} className="text-emerald-600" />
        </div>
        <h2 style={{ fontFamily: "Cinzel, serif", color: "var(--color-navy)" }} className="text-xl font-bold mb-2">Reserved!</h2>
        <p className="font-body text-sm mb-5" style={{ color: "var(--color-muted)" }}>
          Booking #{booking.booking_id} &middot; ${booking.total_usd?.toFixed(2)}<br />
          Held for 2 hours. Complete your registration to confirm.
        </p>
        <button className="btn-primary w-full" onClick={onClose}>Done</button>
      </div>
    </div>
  );
}

function HotelCard({ hotel, onReserve, imgIndex }) {
  const pct = hotel.total_rooms > 0 ? Math.round((hotel.available_rooms / hotel.total_rooms) * 100) : 0;
  const status = hotel.available_rooms === 0 ? "sold-out" : pct < 25 ? "low" : "available";
  const statusLabel = { "sold-out": "Sold Out", low: "Few Left", available: "Available" }[status];
  const statusColor = { "sold-out": "#ef4444", low: "#f59e0b", available: "#22c55e" }[status];
  const imgSrc = hotelImage(hotel, imgIndex);
  const amenities = Array.isArray(hotel.amenities) ? hotel.amenities : (typeof hotel.amenities === "string" ? JSON.parse(hotel.amenities || "[]") : []);
  const websiteUrl = normalizeWebsiteUrl(hotel.website_url);

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col bg-white transition-all duration-300 hover:-translate-y-1"
      style={{ border: "1px solid rgba(232,224,208,0.8)", boxShadow: "var(--shadow-card)" }}>
      <div className="relative overflow-hidden h-44">
        <img src={imgSrc} alt={hotel.name} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" loading="lazy"
          onError={(e) => { e.target.src = HOTEL_IMAGES[0]; }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(15,30,51,0.5), transparent)" }} />
        <div className="absolute top-3 left-3 flex gap-2">
          {hotel.distance_km === 0 && (
            <span className="text-[10px] font-body font-bold uppercase tracking-widest px-2.5 py-1 rounded-full text-navy" style={{ background: "var(--color-gold)" }}>Official Venue</span>
          )}
        </div>
        <div className="absolute top-3 right-3">
          <span className="text-[10px] font-body font-bold uppercase tracking-widest px-2.5 py-1 rounded-full text-white" style={{ background: statusColor }}>
            {statusLabel}
          </span>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <Stars n={hotel.stars} />
            <h3 className="font-body font-bold text-navy text-base mt-1 leading-snug">{hotel.name}</h3>
            {hotel.address && (
              <p className="flex items-center gap-1 font-body text-xs text-gray-500 mt-0.5"><MapPin size={10} />{hotel.address}</p>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-body font-bold text-lg leading-none" style={{ color: "var(--color-navy)" }}>${hotel.price_usd}</p>
            <p className="font-body text-xs text-gray-400">/night</p>
          </div>
        </div>

        {hotel.distance_km > 0 && (
          <p className="font-body text-xs text-gray-500 mb-2">{hotel.distance_km} km from conference venue</p>
        )}

        {hotel.description && (
          <p className="font-body text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2">{hotel.description}</p>
        )}

        {websiteUrl && (
          <a
            href={websiteUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold mb-3 transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: "rgba(201,168,76,0.14)", color: "var(--color-navy)", border: "1px solid rgba(201,168,76,0.35)" }}
          >
            <span>Visit website</span>
            <span className="text-[11px]">↗</span>
          </a>
        )}

        {amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {amenities.slice(0, 4).map((a) => (
              <span key={a} className="text-[10px] font-body px-2 py-0.5 rounded-full"
                style={{ background: "rgba(26,47,78,0.06)", color: "var(--color-navy)" }}>{a}</span>
            ))}
            {amenities.length > 4 && (
              <span className="text-[10px] font-body px-2 py-0.5 rounded-full" style={{ background: "rgba(26,47,78,0.06)", color: "var(--color-muted)" }}>+{amenities.length - 4}</span>
            )}
          </div>
        )}

        <div className="mt-auto">
          <div className="flex justify-between items-center text-xs font-body mb-3">
            <span className="text-gray-500">{hotel.available_rooms} of {hotel.total_rooms} rooms available</span>
            <span className="font-semibold" style={{ color: "var(--color-gold)" }}>${hotel.price_usd * NIGHTS}/5 nights</span>
          </div>
          {hotel.available_rooms > 0 && (
            <div className="h-1.5 rounded-full mb-4 overflow-hidden" style={{ background: "rgba(26,47,78,0.08)" }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: pct < 25 ? "#f59e0b" : "var(--color-gold)" }} />
            </div>
          )}
          <button
            onClick={() => onReserve(hotel)}
            disabled={hotel.available_rooms === 0}
            className="w-full py-3 rounded-xl font-body font-bold text-sm transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            style={hotel.available_rooms > 0
              ? { background: "var(--gold-gradient)", color: "var(--color-navy)", boxShadow: "0 2px 12px rgba(201,168,76,0.3)" }
              : { background: "#f3f4f6", color: "#9ca3af" }
            }>
            {hotel.available_rooms === 0 ? "Sold Out" : "Reserve Room"}
          </button>
        </div>
      </div>
    </div>
  );
}

function groupHotels(hotels) {
  const groups = new Map();
  hotels.forEach((hotel) => {
    const key = `${hotel.name}::${hotel.address}::${hotel.distance_km}`;
    const existing = groups.get(key);
    const variant = { ...hotel };
    if (existing) {
      existing.variants.push(variant);
      existing.total_rooms += hotel.total_rooms || 0;
      existing.available_rooms += hotel.available_rooms || 0;
    } else {
      groups.set(key, {
        groupKey: key,
        name: hotel.name,
        stars: hotel.stars,
        address: hotel.address,
        distance_km: hotel.distance_km,
        description: hotel.description,
        photo_url: hotel.photo_url,
        website_url: hotel.website_url,
        total_rooms: hotel.total_rooms || 0,
        available_rooms: hotel.available_rooms || 0,
        variants: [variant],
      });
    }
  });
  return Array.from(groups.values());
}

function GroupedHotelCard({ group, onReserve, imgIndex }) {
  const imgSrc = hotelImage(group, imgIndex);
  const lowAvailability = group.total_rooms > 0 ? Math.round((group.available_rooms / group.total_rooms) * 100) < 25 : false;
  const groupAvailable = group.available_rooms > 0;
  const websiteUrl = normalizeWebsiteUrl(group.website_url);
  const [selectedVariantId, setSelectedVariantId] = useState(group.variants[0]?.id ?? null);
  const selectedVariant = group.variants.find((hotel) => hotel.id === selectedVariantId) || group.variants[0];

  return (
    <div className="rounded-2xl overflow-hidden bg-white transition-all duration-300 hover:-translate-y-1"
      style={{ border: "1px solid rgba(232,224,208,0.8)", boxShadow: "var(--shadow-card)" }}>
      <div className="relative overflow-hidden h-44">
        <img src={imgSrc} alt={group.name} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" loading="lazy"
          onError={(e) => { e.target.src = HOTEL_IMAGES[0]; }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(15,30,51,0.5), transparent)" }} />
        <div className="absolute top-3 left-3 flex gap-2">
          {group.distance_km === 0 && (
            <span className="text-[10px] font-body font-bold uppercase tracking-widest px-2.5 py-1 rounded-full text-navy" style={{ background: "var(--color-gold)" }}>Official Venue</span>
          )}
        </div>
        <div className="absolute top-3 right-3">
          <span className="text-[10px] font-body font-bold uppercase tracking-widest px-2.5 py-1 rounded-full text-white"
            style={{ background: groupAvailable ? (lowAvailability ? "#f59e0b" : "#22c55e") : "#ef4444" }}>
            {groupAvailable ? (lowAvailability ? "Few Left" : "Available") : "Sold Out"}
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <Stars n={group.stars} />
            <h3 className="font-body font-bold text-navy text-base mt-1 leading-snug">{group.name}</h3>
            {group.address && (
              <p className="flex items-center gap-1 font-body text-xs text-gray-500 mt-0.5"><MapPin size={10} />{group.address}</p>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-gray-500">{group.variants.length} room types</p>
            <p className="font-body text-xs text-gray-500">{group.available_rooms} of {group.total_rooms} rooms</p>
          </div>
        </div>

        {group.distance_km > 0 && (
          <p className="font-body text-xs text-gray-500 mb-3">{group.distance_km} km from conference venue</p>
        )}

        {group.description && (
          <p className="font-body text-xs text-gray-500 leading-relaxed mb-4 line-clamp-2">{group.description}</p>
        )}

        {websiteUrl && (
          <a
            href={websiteUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold mb-4 transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: "rgba(201,168,76,0.14)", color: "var(--color-navy)", border: "1px solid rgba(201,168,76,0.35)" }}
          >
            <span>Visit website</span>
            <span className="text-[11px]">↗</span>
          </a>
        )}

        <div className="space-y-3">
          <label className="block text-[11px] font-body font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--color-muted)" }}>
            Select room type
          </label>
          <select
            value={selectedVariant?.id ?? ""}
            onChange={(event) => setSelectedVariantId(Number(event.target.value))}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 font-body text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/40"
          >
            {group.variants.map((hotel) => (
              <option key={hotel.id} value={hotel.id}>
                {hotel.room_type}
              </option>
            ))}
          </select>

          {selectedVariant && (
            <div className="rounded-2xl border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-body font-semibold text-sm text-navy">{selectedVariant.room_type}</p>
                  <p className="font-body text-xs text-gray-500 mt-1">${selectedVariant.price_usd} / night · ${selectedVariant.price_usd * NIGHTS}/5 nights</p>
                  <p className="font-body text-xs text-gray-500 mt-1">{selectedVariant.available_rooms} rooms available</p>
                </div>
                <button
                  onClick={() => onReserve(selectedVariant)}
                  disabled={selectedVariant.available_rooms === 0}
                  className="w-full max-w-[140px] py-3 rounded-xl font-body font-bold text-sm transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  style={selectedVariant.available_rooms > 0
                    ? { background: "var(--gold-gradient)", color: "var(--color-navy)", boxShadow: "0 2px 12px rgba(201,168,76,0.3)" }
                    : { background: "#f3f4f6", color: "#9ca3af" }
                  }>
                  {selectedVariant.available_rooms === 0 ? "Sold Out" : "Reserve Room"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Hotels() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [successBooking, setSuccessBooking] = useState(null);
  const groupedHotels = groupHotels(hotels);

  useEffect(() => {
    setLoading(true);
    api.get("/hotels")
      .then((res) => setHotels(res.data || []))
      .catch(() => setError("Unable to load hotels. Please check the server is running."))
      .finally(() => setLoading(false));
  }, []);

  const handleSuccess = (booking) => { setSelectedHotel(null); setSuccessBooking(booking); };

  return (
    <div className="min-h-screen" style={{ background: "var(--color-cream)" }}>
      {/* Header */}
      <div className="relative overflow-hidden" style={{ background: "var(--navy-gradient)", paddingTop: "6rem", paddingBottom: "3.5rem", marginTop: "-80px" }}>
        <div className="absolute inset-0 bg-center bg-cover opacity-15" style={{ backgroundImage: "url(\"https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&q=80\")" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(15,30,51,0.7), rgba(15,30,51,0.9))" }} />
        <div className="section-container text-center relative z-10 pt-6">
          <span className="section-label">AMC 2027</span>
          <h1 style={{ fontFamily: "Cinzel, serif" }} className="text-4xl lg:text-5xl font-bold text-white uppercase tracking-widest mb-3">Partner Hotels</h1>
          <div style={{ height: "3px", width: "48px", background: "var(--gold-gradient)", margin: "0 auto" }} className="rounded-full" />
          <p className="font-body text-white/60 text-sm mt-3">Accommodation options near the conference venue</p>
        </div>
      </div>

      <div className="section-container py-14">
        {/* Info banner */}
        <div className="rounded-2xl p-5 mb-10 flex items-start gap-4" style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.25)" }}>
          <Info size={18} style={{ color: "var(--color-gold)", flexShrink: 0, marginTop: 2 }} />
          <p className="font-body text-sm" style={{ color: "var(--color-navy)" }}>
            Hotel reservations are held for <strong>2 hours</strong> while you complete registration. Prices shown are per room per night.
            Conference dates: <strong>9&ndash;14 March 2027</strong> (5 nights).
          </p>
        </div>

        {error && (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
            <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div><p className="font-body text-sm font-semibold text-red-700">Unable to Load Hotels</p><p className="font-body text-xs text-red-600 mt-1">{error}</p></div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-16 gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--color-gold)", borderTopColor: "transparent" }} />
            <span className="font-body text-sm text-gray-400">Loading hotels...</span>
          </div>
        )}

        {!loading && hotels.length === 0 && !error && (
          <div className="text-center py-16 rounded-2xl bg-white" style={{ border: "1px solid rgba(232,224,208,0.8)" }}>
            <p className="font-body text-gray-400 text-sm">No hotel listings available at this time.</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {groupedHotels.map((group, i) => (
            <GroupedHotelCard key={group.groupKey} group={group} onReserve={setSelectedHotel} imgIndex={i} />
          ))}
        </div>
      </div>

      {selectedHotel && <ReserveModal hotel={selectedHotel} onClose={() => setSelectedHotel(null)} onSuccess={handleSuccess} />}
      {successBooking && <SuccessBanner booking={successBooking} onClose={() => setSuccessBooking(null)} />}
    </div>
  );
}
