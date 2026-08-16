import { useState, useEffect } from "react";
import { Plane, FileText, DollarSign, MapPin, Wifi, Coffee, Car, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../lib/api";

const VENUE_IMAGE = "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1920&q=80";

export default function Venue() {
  const [hotels, setHotels] = useState([]);
  const [hotelsLoading, setHotelsLoading] = useState(true);
  const [hotelsError, setHotelsError] = useState("");

  useEffect(() => {
    setHotelsLoading(true);
    api.get("/hotels")
      .then((res) => setHotels(res.data || []))
      .catch(() => setHotelsError("Unable to load hotels."))
      .finally(() => setHotelsLoading(false));
  }, []);

  const nearbyHotels = hotels.filter((hotel) => Number(hotel.distance_km) > 0);

  return (
    <div>
      {/* Header */}
      <div className="relative overflow-hidden" style={{ background: "var(--navy-gradient)", paddingTop: "6rem", paddingBottom: "3.5rem", marginTop: "-80px" }}>
        <div className="absolute inset-0 bg-center bg-cover opacity-20" style={{ backgroundImage: `url("${VENUE_IMAGE}")` }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(15,30,51,0.65), rgba(15,30,51,0.9))" }} />
        <div className="section-container text-center relative z-10 pt-6">
          <span className="section-label">AMC 2027</span>
          <h1 style={{ fontFamily: "Cinzel, serif" }} className="page-title text-white mb-3">Venue & Travel</h1>
          <div style={{ height: "3px", width: "48px", background: "var(--gold-gradient)", margin: "0 auto" }} className="rounded-full" />
          <p className="font-body text-white/60 text-sm mt-3">Harare, Zimbabwe &middot; March 2027</p>
        </div>
      </div>

      <div className="section-container max-w-6xl mx-auto py-16 px-4 md:px-6 lg:px-8">

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          {/* Main Venue */}
          <section className="rounded-[32px] border border-[#ebe4d7] bg-[linear-gradient(145deg,#ffffff_0%,#fcfbf8_100%)] p-5 sm:p-6 shadow-[0_24px_80px_rgba(15,30,51,0.08)]">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-body font-semibold uppercase tracking-[0.3em] text-[#c9a84c]">Conference Venue</p>
                <h2 style={{ fontFamily: "Cinzel, serif" }} className="text-xl sm:text-2xl font-bold text-navy mt-1 uppercase tracking-wide">Where the event comes to life</h2>
              </div>
              <div className="rounded-full border border-[#e7dfcf] bg-white/80 px-3 py-1.5 text-[11px] font-body font-semibold uppercase tracking-[0.2em] text-[#556172]">Harare • 2027</div>
            </div>

            <div className="group overflow-hidden rounded-[28px] bg-white" style={{ border: "1px solid rgba(232,224,208,0.8)", boxShadow: "0 24px 70px rgba(15,30,51,0.10)" }}>
              <div className="relative m-3 overflow-hidden rounded-[24px] h-72 sm:h-80 md:h-[26rem] sm:m-4">
                <img
                  src="/images/rainbow.jpg"
                  alt="Rainbow Towers Harare"
                  className="w-full h-full object-cover object-center transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(15,30,51,0.10) 0%, rgba(15,30,51,0.20) 30%, rgba(15,30,51,0.72) 100%)" }} />
                <div className="absolute inset-0" style={{ background: "radial-gradient(circle at top left, rgba(201,168,76,0.22), transparent 42%)" }} />
                <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur-md">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--color-gold)" }} />
                  <span className="text-[11px] font-body font-semibold uppercase tracking-[0.2em] text-white">Official Venue</span>
                </div>
                <div className="absolute bottom-4 right-4 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-body font-semibold uppercase tracking-[0.2em] text-navy shadow-sm">Premier destination</div>
              </div>

              <div className="px-6 pb-6 pt-3">
                <div className="rounded-[22px] border border-[#e7dfcf] bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(248,244,236,0.95))] p-5 shadow-[0_10px_30px_rgba(15,30,51,0.05)]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 style={{ fontFamily: "Cinzel, serif" }} className="font-bold text-navy text-xl leading-tight">Rainbow Towers Hotel & Conference Centre</h3>
                      <p className="font-body text-gray-500 text-sm mt-2 flex items-center gap-1.5">
                        <MapPin size={13} className="text-[#c9a84c]" />
                        Pennefather Avenue, Harare, Zimbabwe
                      </p>
                    </div>
                    <div className="rounded-full border border-[#e7dfcf] bg-white/70 px-3 py-1 text-[11px] font-body font-semibold uppercase tracking-[0.2em] text-[#4a5670]">
                      Premium venue
                    </div>
                  </div>

                  <p className="font-body text-gray-600 text-sm mt-4 leading-relaxed">
                    One of Harare's premier conference facilities, offering world-class meeting rooms, modern AV equipment, and exceptional hospitality services.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {[
                      { label: "Plenary Hall (600 cap)", Icon: Building2 },
                      { label: "Breakout Rooms", Icon: Building2 },
                      { label: "Business Centre", Icon: Wifi },
                      { label: "Restaurant & Bar", Icon: Coffee },
                      { label: "Gym & Pool", Icon: Car },
                    ].map(({ label, Icon }) => (
                      <span key={label} className="flex items-center gap-1.5 rounded-full border border-[#e7dfcf] bg-white px-3 py-1.5 text-[11px] font-body font-semibold tracking-wide text-[#23374d] shadow-sm">
                        <Icon size={11} className="text-[#c9a84c]" />{label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </section>

          {/* Accommodation */}
          <section className="space-y-6">
            <div className="rounded-[32px] border border-[#ebe4d7] bg-[linear-gradient(145deg,#ffffff_0%,#fcfbf8_100%)] p-5 sm:p-6 shadow-[0_20px_60px_rgba(15,30,51,0.06)]">
              <p className="text-[11px] font-body font-semibold uppercase tracking-[0.3em] text-[#c9a84c]">Accommodation</p>
              <h2 style={{ fontFamily: "Cinzel, serif" }} className="text-xl sm:text-2xl font-bold text-navy mt-1 uppercase tracking-wide">Stay close to the action</h2>

              <div className="mt-5 rounded-[24px] p-5" style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.14), rgba(201,168,76,0.04))", border: "1px solid rgba(201,168,76,0.25)" }}>
                <p className="font-body font-bold text-navy text-sm mb-1 uppercase tracking-wider">Conference Rate &mdash; Rainbow Towers</p>
                <p className="text-3xl font-bold text-navy font-heading mb-1">$95 <span className="text-base font-normal text-gray-500">USD / night</span></p>
                <p className="font-body text-sm text-gray-600">Book through your conference registration. Limited rooms available.</p>
              </div>
            </div>

            <div className="rounded-[32px] border border-[#ebe4d7] bg-[linear-gradient(145deg,#ffffff_0%,#fcfbf8_100%)] p-5 sm:p-6 shadow-[0_20px_60px_rgba(15,30,51,0.06)]">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h3 style={{ fontFamily: "Cinzel, serif" }} className="font-bold text-navy text-base uppercase tracking-wider">Nearby Hotels</h3>
                <span className="rounded-full bg-[#f6efe2] px-2.5 py-1 text-[11px] font-body font-semibold uppercase tracking-[0.2em] text-[#6b5b2d]">Curated picks</span>
              </div>
              <div className="space-y-3">
                {hotelsLoading && <p className="font-body text-gray-400 text-sm">Loading hotels...</p>}
                {hotelsError && <p className="font-body text-red-600 text-sm">{hotelsError}</p>}
                {!hotelsLoading && nearbyHotels.length === 0 && !hotelsError && (
                  <p className="font-body text-gray-400 text-sm">No nearby hotels available.</p>
                )}
                {nearbyHotels.slice(0, 4).map((h) => (
                  <div key={h.id} className="rounded-[20px] border border-[#ece4d4] bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-body font-bold text-navy text-sm">{h.name}</p>
                        <p className="font-body text-gray-500 text-xs mt-1">{"★".repeat(h.stars)} &middot; {h.distance_km} km from venue</p>
                      </div>
                      <span className="font-body font-bold text-sm flex-shrink-0" style={{ color: "var(--color-gold)" }}>${h.price_usd}/night</span>
                    </div>
                  </div>
                ))}
              </div>
              {hotels.length > 0 && (
                <div className="mt-5 text-center">
                  <Link to="/hotels" className="btn-outline text-sm py-2.5">View All Hotels</Link>
                </div>
              )}

              <div className="mt-4 rounded-[20px] border border-[#ece4d4] bg-[linear-gradient(135deg,#f8f4eb_0%,#ffffff_100%)] p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.25)" }}>
                    <MapPin size={16} className="text-[#c9a84c]" />
                  </div>
                  <div>
                    <p className="font-body font-semibold text-navy text-sm">Rainbow Towers Hotel, Pennefather Avenue, Harare, Zimbabwe</p>
                    <a href="https://maps.google.com/?q=Rainbow+Towers+Hotel+Harare" target="_blank" rel="noopener noreferrer"
                      className="text-xs font-body font-semibold hover:underline mt-1 inline-block" style={{ color: "var(--color-navy)" }}>
                      Open in Google Maps &rarr;
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Travel & Visa */}
        <section className="mt-6 rounded-[32px] border border-[#ebe4d7] bg-[linear-gradient(145deg,#ffffff_0%,#fcfbf8_100%)] p-5 sm:p-6 shadow-[0_20px_60px_rgba(15,30,51,0.06)]">
          <div className="mb-5">
            <p className="text-[11px] font-body font-semibold uppercase tracking-[0.3em] text-[#c9a84c]">Travel & Visa</p>
            <h2 style={{ fontFamily: "Cinzel, serif" }} className="text-xl sm:text-2xl font-bold text-navy mt-1 uppercase tracking-wide">Everything you need to arrive with ease</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {[
              {
                Icon: Plane, title: "Getting to Harare",
                content: "Robert Gabriel Mugabe International Airport (HRE) is the main gateway to Harare. Direct flights are available from Johannesburg, Nairobi, Addis Ababa, London, and Dubai. The airport is approximately 15 km from the conference venue.",
              },
              {
                Icon: FileText, title: "Visa Requirements",
                content: null,
                extra: (
                  <div>
                    <p className="font-body text-gray-600 text-sm leading-relaxed mb-3">Citizens of many African countries and some other nations can visit Zimbabwe visa-free or obtain a visa on arrival. An official visa support letter will be provided to registered delegates upon request.</p>
                    <p className="font-body text-sm font-semibold" style={{ color: "var(--color-navy)" }}>
                      To request a visa support letter, contact:{" "}
                      <a href="mailto:conference@africamethodistcouncil.org" className="underline hover:text-gold break-words">conference@africamethodistcouncil.org</a>
                    </p>
                  </div>
                ),
              },
              {
                Icon: DollarSign, title: "Currency",
                content: "Zimbabwe uses both the US Dollar (USD) and the Zimbabwe Gold (ZiG) currency. USD is widely accepted at hotels and conference facilities. ATMs are available at the airport and throughout the city.",
              },
            ].map(({ Icon, title, content, extra }) => (
              <div key={title} className="min-w-0 rounded-[24px] border border-[#ece4d4] bg-[linear-gradient(135deg,#ffffff_0%,#fbf8f0_100%)] p-5 sm:p-6 shadow-[0_8px_25px_rgba(15,30,51,0.04)]">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.25)" }}>
                  <Icon size={18} style={{ color: "var(--color-gold)" }} />
                </div>
                <h3 className="font-body font-bold text-navy mt-4 mb-2">{title}</h3>
                {content && <p className="font-body text-gray-600 text-sm leading-relaxed">{content}</p>}
                {extra}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
