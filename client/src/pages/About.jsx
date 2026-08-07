import { Link } from "react-router-dom";
import { MapPin, Plane, Navigation, Hotel, BookOpen, Users2, Mic2, Handshake, Award, Vote, Ribbon, Flag, Globe, Church } from "lucide-react";

const ABOUT_HEADER = "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1920&q=80";

const ABOUT_GALLERY = [
  { src: "/images/confr.jpeg", title: "Worship and devotion", desc: "A sacred space for prayer, reflection and fellowship." },
  { src: "/images/leaders.jpeg", title: "Shared leadership", desc: "Bishops, pastors and delegates gathering in purpose." },
  { src: "/images/church1.jpeg", title: "Conference energy", desc: "A vibrant atmosphere of conversation, learning and unity." },
];

const EXPECT_ITEMS = [
  { Icon: Church,    title: "Worship & Devotion",   desc: "Morning devotions, Holy Communion services, and evening worship." },
  { Icon: BookOpen,  title: "Plenary & Business",   desc: "Plenary sessions for all delegates and separate business meetings." },
  { Icon: Mic2,      title: "Keynote Addresses",    desc: "Distinguished speakers from across the global Methodist community." },
  { Icon: Handshake, title: "Fellowship",           desc: "Connect with brothers and sisters from 30+ nations." },
  { Icon: Award,     title: "Award Ceremonies",     desc: "Recognising distinguished service to the AMC." },
  { Icon: Vote,      title: "Elections",            desc: "Election of Council officers and committee members." },
];

const DRESS_ITEMS = [
  { Icon: Ribbon, color: "#1a1a1a", bg: "bg-gray-50", border: "border-gray-200", day: "Thursday - International Women's Day", dress: "All delegates wear BLACK" },
  { Icon: Flag,   color: "#2563eb", bg: "bg-blue-50", border: "border-blue-200",  day: "Friday - Celebration of Diversity",    dress: "Wear church material/logo" },
  { Icon: Globe,  color: "#059669", bg: "bg-green-50", border: "border-green-200", day: "Saturday - African Culture Celebration", dress: "Wear traditional attire of your country. Excursion after lunch" },
  { Icon: Church, color: "#7c3aed", bg: "bg-purple-50", border: "border-purple-200", day: "Sunday - Church Services", dress: "Wear church uniforms. Services around Harare" },
];

const PARTNERS = [
  { name: "Harare Hospitality Group", type: "Accommodation Partner", description: "Supporting delegate stays and welcome services during the conference week.", accent: "#1a2f4e" },
  { name: "Grace Transit Network", type: "Transport Partner", description: "Providing shuttle coordination and mobility support from the airport and hotels.", accent: "#c9a84c" },
  { name: "The Lantern Media", type: "Broadcast Partner", description: "Helping share the conference story through digital coverage and live updates.", accent: "#7c3aed" },
];

export default function About() {
  return (
    <div>
      {/* Page Header */}
      <div className="relative overflow-hidden" style={{ background: "var(--navy-gradient)", paddingTop: "6rem", paddingBottom: "4rem", marginTop: "-80px" }}>
        <div className="absolute inset-0 bg-center bg-cover opacity-20" style={{ backgroundImage: `url("${ABOUT_HEADER}")` }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(15,30,51,0.7), rgba(15,30,51,0.85))" }} />
        <div className="section-container text-center relative z-10 pt-8">
          <span className="section-label">AMC 2027</span>
          <h1 style={{ fontFamily: "Cinzel, serif" }} className="text-4xl lg:text-5xl font-bold text-white uppercase tracking-widest mb-4">About the Conference</h1>
          <div style={{ height: "3px", width: "48px", background: "var(--gold-gradient)", margin: "0 auto" }} className="rounded-full" />
          <p className="font-body text-white/60 text-sm mt-4">3rd General Conference · March 9–14, 2027 · Harare, Zimbabwe</p>
        </div>
      </div>

      <div className="section-container max-w-4xl mx-auto py-16 space-y-14">

        {/* Conference Overview */}
        <section className="rounded-[2rem] p-8 md:p-10 border" style={{ background: "rgba(26,47,78,0.03)", borderColor: "rgba(26,47,78,0.12)", boxShadow: "var(--shadow-xs)" }}>
          <h2 style={{ fontFamily: "Cinzel, serif" }} className="text-2xl font-bold text-navy mb-5 uppercase tracking-wide">The 3rd General Conference</h2>
          <div className="space-y-4 font-body text-gray-600 leading-relaxed">
            <p>The Africa Methodist Council (AMC) 3rd General Conference is the supreme governing body of the Africa Methodist Council, bringing together bishops, presiding prelates, delegates, and invited guests from member churches across Africa and the diaspora.</p>
            <p>Since its inception in 1986, the Africa Methodist Council became fully active in 2015 with the Heads of Conference Summit held in Kumasi, Ghana. The first General Conference was held in 2019 in Kenya, and the second was held in Cotonou, Benin in March 2023.</p>
            <p>The Third General Conference will be held from <strong className="text-navy">Tuesday 9 to Sunday 14 March 2027</strong> at <strong className="text-navy">Rainbow Towers</strong>, a 5-star hotel in Harare, Zimbabwe, and will be hosted by the Methodist Church in Zimbabwe.</p>
          </div>
        </section>

        {/* Gallery & Experience */}
        <section className="rounded-[2rem] p-6 md:p-8 bg-white" style={{ border: "1px solid rgba(232,224,208,0.8)", boxShadow: "var(--shadow-card)" }}>
          <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-8 items-center">
            <div className="animate-fade-up">
              <p className="section-label text-left">Gathering in Harare</p>
              <h3 style={{ fontFamily: "Cinzel, serif" }} className="text-xl font-bold text-navy mb-4 uppercase tracking-wide">A conference shaped by worship, fellowship and vision</h3>
              <p className="font-body text-gray-600 leading-relaxed mb-5">The 3rd General Conference will bring together leaders, delegates and partners in a setting designed for meaningful conversation, worship and strategic planning.</p>
              <div className="flex flex-wrap gap-3">
                <span className="badge badge-gold">6 days</span>
                <span className="badge badge-navy">30+ nations</span>
                <span className="badge badge-success">Spiritual focus</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-up">
              {ABOUT_GALLERY.map((item, index) => (
                <div key={item.title} className="group overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 shadow-sm hover:-translate-y-1 transition-all duration-300" style={{ animationDelay: `${index * 120}ms` }}>
                  <img src={item.src} alt={item.title} className="h-36 w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                  <div className="p-3">
                    <h4 className="font-body font-semibold text-sm text-navy">{item.title}</h4>
                    <p className="font-body text-xs text-gray-500 mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Location & Venue */}
        <section className="rounded-[2rem] p-8 md:p-10 bg-white" style={{ border: "1px solid rgba(232,224,208,0.8)", boxShadow: "var(--shadow-card)", background: "linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(245,238,220,0.75) 100%)" }}>
          <h3 style={{ fontFamily: "Cinzel, serif" }} className="text-xl font-bold text-navy mb-6 uppercase tracking-wide">Location & Logistics</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { Icon: Hotel,      label: "Venue",              value: "Rainbow Towers, Harare, Zimbabwe" },
              { Icon: Plane,      label: "Distance from Airport", value: "14 km / 23–30 minutes from Robert Mugabe International Airport" },
              { Icon: Navigation, label: "Transport",          value: "All local transport provided by the Methodist Church in Zimbabwe" },
              { Icon: MapPin,     label: "Accommodation",      value: null },
            ].map(({ Icon, label, value }) => (
              <div key={label} className="flex gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.25)" }}>
                  <Icon size={16} style={{ color: "var(--color-gold)" }} />
                </div>
                <div>
                  <p className="font-body font-semibold text-navy text-sm">{label}</p>
                  {value ? (
                    <p className="font-body text-gray-600 text-sm mt-0.5">{value}</p>
                  ) : (
                    <Link to="/hotels" className="font-body text-sm font-semibold hover:text-gold transition-colors" style={{ color: "var(--color-navy)" }}>View accommodation options</Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Theme */}
        <section className="rounded-2xl p-8 text-white relative overflow-hidden" style={{ background: "var(--navy-gradient)" }}>
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-5" style={{ background: "var(--gold-gradient)", transform: "translate(30%, -30%)" }} />
          <p className="text-xs font-body font-bold uppercase tracking-widest mb-2" style={{ color: "var(--color-gold)" }}>Conference Theme</p>
          <h2 style={{ fontFamily: "Cinzel, serif" }} className="text-2xl lg:text-3xl font-bold mb-3 leading-snug">"Equipped to transform Africa's sociopolitical and economic landscape"</h2>
          <p className="text-white/60 text-sm mb-5 font-body">— Isaiah 61:1</p>
          <blockquote className="border-l-2 pl-5 italic text-white/75 text-base leading-relaxed font-body" style={{ borderColor: "var(--color-gold)" }}>
            "The Spirit of the Sovereign Lord is on me,
    because the Lord has anointed me
    to proclaim good news to the poor.
He has sent me to bind up the brokenhearted, to proclaim freedom for the captives and release from darkness for the prisoners.."
          </blockquote>
        </section>

        {/* Cost & Registration */}
        <section className="rounded-[2rem] p-8 md:p-10 border" style={{ background: "rgba(201,168,76,0.08)", borderColor: "rgba(201,168,76,0.2)", boxShadow: "var(--shadow-xs)" }}>
          <h2 style={{ fontFamily: "Cinzel, serif" }} className="text-2xl font-bold text-navy mb-6 uppercase tracking-wide">Cost & Registration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-2xl p-6" style={{ background: "rgba(26,47,78,0.05)", border: "1px solid rgba(26,47,78,0.15)" }}>
              <p className="font-body font-semibold text-navy text-sm mb-2 uppercase tracking-wider">Conference Fee</p>
              <p className="text-3xl font-bold text-navy font-heading mb-1">USD 400.00</p>
              <p className="font-body text-gray-500 text-sm">Covers lunch, dinner, and conference package</p>
            </div>
            <div className="rounded-2xl p-6" style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)" }}>
              <p className="font-body font-semibold text-navy text-sm mb-3 uppercase tracking-wider">Paid Separately</p>
              <ul className="space-y-2 font-body text-sm text-gray-600">
                {["Bed & Breakfast accommodation", "Airfares and travel"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "var(--color-gold)" }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Delegate Categories */}
        <section className="rounded-[2rem] p-8 md:p-10 bg-white" style={{ border: "1px solid rgba(232,224,208,0.8)", boxShadow: "var(--shadow-card)" }}>
          <h2 style={{ fontFamily: "Cinzel, serif" }} className="text-2xl font-bold text-navy mb-6 uppercase tracking-wide">Delegate Categories</h2>
          <p className="font-body text-gray-600 mb-6">Conference attendees are divided into three categories:</p>
          <div className="space-y-4">
            {[
              { color: "var(--color-navy)", label: "Category 1: Delegates", content: (
                <div>
                  <p className="font-body text-sm text-gray-600 mb-2">Each Conference will be represented by six delegates:</p>
                  <ul className="space-y-1 font-body text-sm text-gray-500">
                    {["The head of Conference (Bishop/Presiding Bishop/Presiding Prelate/Prelate)", "The Lay President/Lay Leaders", "General Secretary/Conference Secretary/Administrative Bishop", "One woman, One youth, One man"].map(item => (
                      <li key={item} className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 bg-navy" />{item}</li>
                    ))}
                  </ul>
                  <p className="font-body text-sm text-gray-600 mb-2">Registration fee: USD 400.00</p>
                </div>
              )},
              { color: "var(--color-gold)", label: "Category 2: Observers", content: <p className="font-body text-sm text-gray-600">Any Methodist from the African continent or anywhere in the world who wishes to be part of the Methodist fellowship in Africa. Registration fee: USD 400.00</p> },
              { color: "#7c3aed", label: "Category 3: Guests", content: <p className="font-body text-sm text-gray-600">Delegates with special invitation from the Africa Methodist Council. Registration fee: USD 400.00</p> },
            ].map(({ color, label, content }) => (
              <div key={label} className="rounded-2xl p-6 bg-white" style={{ border: "1px solid rgba(232,224,208,0.8)", borderLeft: `4px solid ${color}`, boxShadow: "var(--shadow-xs)" }}>
                <h3 className="font-heading font-bold text-navy mb-3">{label}</h3>
                {content}
              </div>
            ))}
          </div>
        </section>

        {/* What to Expect */}
        <section className="rounded-[2rem] p-8 md:p-10 border" style={{ background: "rgba(26,47,78,0.04)", borderColor: "rgba(26,47,78,0.12)", boxShadow: "var(--shadow-xs)" }}>
          <h2 style={{ fontFamily: "Cinzel, serif" }} className="text-2xl font-bold text-navy mb-6 uppercase tracking-wide">What to Expect</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {EXPECT_ITEMS.map(({ Icon, title, desc }) => (
              <div key={title} className="flex gap-4 p-5 rounded-2xl bg-white hover:shadow-md transition-all duration-200 group"
                style={{ border: "1px solid rgba(232,224,208,0.8)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors group-hover:bg-navy"
                  style={{ background: "rgba(26,47,78,0.08)" }}>
                  <Icon size={18} style={{ color: "var(--color-navy)" }} />
                </div>
                <div>
                  <h3 className="font-body font-bold text-navy text-sm mb-1">{title}</h3>
                  <p className="font-body text-gray-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Dress Codes */}
        <section className="rounded-[2rem] p-8 md:p-10 border" style={{ background: "rgba(124,58,237,0.05)", borderColor: "rgba(124,58,237,0.15)", boxShadow: "var(--shadow-xs)" }}>
          <h2 style={{ fontFamily: "Cinzel, serif" }} className="text-2xl font-bold text-navy mb-6 uppercase tracking-wide">Special Events & Dress Themes</h2>
          <div className="space-y-3">
            {DRESS_ITEMS.map(({ Icon, color, bg, border, day, dress }) => (
              <div key={day} className={`flex gap-4 p-5 rounded-2xl ${bg} border ${border}`}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <div>
                  <p className="font-body font-bold text-navy text-sm">{day}</p>
                  <p className="font-body text-gray-600 text-sm mt-0.5">{dress}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Partners */}
        <section className="rounded-[2rem] p-8 md:p-10 border overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(255,250,240,1) 0%, rgba(240,232,208,0.75) 100%)", borderColor: "rgba(201,168,76,0.22)", boxShadow: "var(--shadow-card)" }}>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
            <div>
              <p className="section-label text-left">Conference Partners</p>
              <h2 style={{ fontFamily: "Cinzel, serif" }} className="text-2xl font-bold text-navy uppercase tracking-wide">Trusted partners for a memorable gathering</h2>
            </div>
            <p className="font-body text-sm text-gray-600 max-w-xl">These are placeholder partner cards for now and can be replaced with actual sponsors, hosts and service providers once confirmed.</p>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-white/70 bg-white/70 py-3">
            <div className="marquee-track flex w-max items-stretch gap-4" style={{ animation: "marquee 20s linear infinite" }}>
              {[...PARTNERS, ...PARTNERS].map((partner, index) => (
                <div key={`${partner.name}-${index}`} className="min-w-[220px] rounded-2xl border bg-white p-4 shadow-sm">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white mb-3" style={{ background: partner.accent }}>
                    {partner.name.split(" ").map((word) => word[0]).join("").slice(0, 2)}
                  </div>
                  <p className="font-body font-semibold text-sm text-navy mb-1">{partner.name}</p>
                  <p className="font-body text-[11px] uppercase tracking-[0.2em] mb-2" style={{ color: partner.accent }}>{partner.type}</p>
                  <p className="font-body text-xs text-gray-600 leading-relaxed">{partner.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Programme Schedule */}
        <section className="rounded-[2rem] p-8 md:p-10 text-white relative overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(26,47,78,0.95) 0%, rgba(13,28,47,1) 100%)", boxShadow: "var(--shadow-card)" }}>
          <h2 style={{ fontFamily: "Cinzel, serif" }} className="text-2xl font-bold mb-4 uppercase tracking-wide">Programme Schedule</h2>
          <p className="font-body text-white/90 mb-6 leading-relaxed">
            The official programme starts at <strong className="text-gold">08:30 hrs on Wednesday, March 10, 2027</strong>. The conference will feature both plenary sessions and separate sessions including business meetings and presentations.
          </p>
          <div className="rounded-2xl p-6 text-white mb-6" style={{ background: "var(--navy-gradient)" }}>
            <p className="font-body font-semibold mb-3 text-white/80 text-sm uppercase tracking-wider">Conferences are times for:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {["Fellowship and spiritual enrichment", "Theological engagement and worship", "Learning through workshops and seminars", "Community outreach and excursions", "Decision-making and appointing leaders", "Celebrating special events and shared mission"].map(item => (
                <div key={item} className="flex items-center gap-2 font-body text-sm text-white/70">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "var(--color-gold)" }} />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <Link to="/schedule" className="btn-primary">View Full Schedule</Link>
        </section>
      </div>
    </div>
  );
}
