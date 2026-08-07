import { Link } from "react-router-dom";
import { Calendar, Mic2, Hotel, PenLine, Users, Globe, Star, Clock, ArrowRight, ChevronDown, BookOpen, Award, Handshake, Music } from "lucide-react";
import CountdownTimer from "../components/ui/CountdownTimer";

const HERO_IMAGE = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1920&q=80";

const QUICK_LINKS = [
  { to: "/schedule", Icon: Calendar,  title: "Full Schedule",  desc: "Browse all sessions, speakers & events across 6 days." },
  { to: "/speakers", Icon: Mic2,      title: "Speakers",       desc: "Meet the bishops, theologians and scholars presenting." },
  { to: "/hotels",   Icon: Hotel,     title: "Hotel Packages", desc: "Reserve your accommodation at partner hotels." },
  { to: "/register", Icon: PenLine,   title: "Register Now",   desc: "Secure your delegate, observer, or guest place today." },
];
const STATS = [
  { value: "40+", label: "Member Churches",     Icon: Star },
  { value: "30+", label: "Nations Represented", Icon: Globe },
  { value: "300+",label: "Expected Delegates",  Icon: Users },
  { value: "6",   label: "Days of Conference",  Icon: Clock },
];
const FEATURE_IMAGES = [
  { src: "/images/rainbow.jpg", title: "Partner Hotels", desc: "Book your stay with trusted partner hotels, minutes from the venue.", to: "/hotels" },
  { src: "/images/leaders.jpeg", title: "Conference Fellowship", desc: "Engage with church leaders, theologians and delegates from across Africa.", to: "/about" },
  { src: "/images/flyer.png", title: "Event Programme", desc: "Explore the schedule, venue logistics and regional hospitality.", to: "/schedule" },
];
const MOMENT_IMAGES = [
  { src: "/images/confr.jpeg", title: "Prayer & Worship", desc: "Moments of devotion and spiritual renewal in fellowship." },
  { src: "/images/church1.jpeg", title: "Global Voices", desc: "Leaders and delegates from across the continent and diaspora." },
  { src: "/images/con27.jpeg", title: "Community Celebration", desc: "A joyful blend of worship, culture and hospitality." },
];
const EXPECT_ITEMS = [
  { Icon: BookOpen,  title: "Worship & Devotion",    desc: "Morning devotions, Holy Communion services, and evening worship throughout the week." },
  { Icon: Users,     title: "Plenary & Business",    desc: "Plenary sessions for all delegates and business committee meetings." },
  { Icon: Mic2,      title: "Keynote Addresses",     desc: "Distinguished speakers from across the global Methodist community." },
  { Icon: Handshake, title: "Fellowship",            desc: "Connect with brothers and sisters from 30+ nations." },
  { Icon: Award,     title: "Award Ceremonies",      desc: "Recognising distinguished service to the AMC community." },
  { Icon: Music,     title: "Cultural Celebrations", desc: "African cultural evenings and musical presentations from member churches." },
];

export default function Home() {
  return (
    <>
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-center bg-cover" style={{ backgroundImage: `url("${HERO_IMAGE}")` }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, rgba(5,15,30,0.82) 0%, rgba(15,28,55,0.9) 50%, rgba(5,15,30,0.88) 100%)" }} />
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-0 left-1/4 w-px h-full" style={{ background: "linear-gradient(to bottom, transparent, rgba(201,168,76,0.6), transparent)" }} />
          <div className="absolute top-0 right-1/4 w-px h-full" style={{ background: "linear-gradient(to bottom, transparent, rgba(201,168,76,0.3), transparent)" }} />
        </div>
        <div className="section-container relative z-10 py-32 text-center">
          <a href="https://africamethodistcouncil.org" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-body font-semibold text-white/60 hover:text-white transition-all duration-200 mb-10 group"
            style={{ border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)", backdropFilter: "blur(8px)" }}>
            Official site: africamethodistcouncil.org
            <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
          </a>
          <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-7 animate-float"
            style={{ border: "2px solid var(--color-gold)", background: "rgba(201,168,76,0.1)", boxShadow: "0 0 40px rgba(201,168,76,0.18), inset 0 0 20px rgba(201,168,76,0.06)" }}>
            <span style={{ fontFamily: "Cinzel, serif" }} className="text-gold font-bold text-lg tracking-widest">AMC</span>
          </div>
          <p className="text-xs font-body font-bold uppercase tracking-[0.3em] mb-4 animate-fade-up" style={{ color: "var(--color-gold)" }}>
            Africa Methodist Council &middot; 3rd General Conference
          </p>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-white leading-tight tracking-wide mb-5 animate-fade-up"
            style={{ fontFamily: "Cinzel, serif" }}>
            AMC Conference<br />
            <span className="inline-block" style={{ color: "#f2d37a", textShadow: "0 0 24px rgba(242, 211, 122, 0.35)", display: "inline-block" }}>2027</span>
          </h1>
          <p className="text-white/70 text-2xl lg:text-3xl italic mb-2 animate-fade-up" style={{ fontFamily: "Cormorant Garamond, serif" }}>
            "Equipped to transform Africa's sociopolitical and economic landscape"
          </p>
          <p className="font-body font-semibold text-sm mb-14 animate-fade-up" style={{ color: "var(--color-gold)" }}>
            March 9&ndash;14, 2027 &middot; Harare, Zimbabwe
          </p>
          <div className="mb-14 animate-fade-up"><CountdownTimer /></div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up">
            <Link to="/register" className="inline-flex items-center justify-center gap-2 text-base px-10 py-4 rounded-xl font-body font-bold transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: "var(--gold-gradient)", color: "var(--color-navy)", boxShadow: "0 4px 20px rgba(201,168,76,0.4)" }}>
              Register Now <ArrowRight size={18} />
            </Link>
            <Link to="/schedule" className="inline-flex items-center justify-center gap-2 text-base px-10 py-4 rounded-xl font-body font-semibold transition-all duration-200 hover:bg-white/10"
              style={{ border: "2px solid rgba(255,255,255,0.3)", color: "white" }}>
              <Calendar size={16} /> View Schedule
            </Link>
          </div>
        </div>
        <div className="absolute bottom-8 left-0 right-0 flex justify-center animate-bounce">
          <ChevronDown size={24} color="rgba(255,255,255,0.35)" />
        </div>
      </section>

      <section className="py-0" style={{ background: "var(--color-navy)" }}>
        <div className="section-container">
          <div className="grid grid-cols-2 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="flex flex-col items-center justify-center py-8 px-4 text-center gap-2 group hover:bg-white/4 transition-colors border-r border-b sm:border-b-0 border-white/8 last:border-r-0">
                <s.Icon size={20} className="text-gold/60 group-hover:text-gold transition-colors" />
                <div style={{ fontFamily: "Cinzel, serif", color: "var(--color-gold)" }} className="text-3xl font-bold">{s.value}</div>
                <div className="font-body text-xs text-white/50 uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24" style={{ background: "var(--color-cream)" }}>
        <div className="section-container">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <span className="section-label">Conference Highlights</span>
            <h2 className="section-heading">Experience AMC 2027</h2>
            <span className="gold-rule" />
            <p className="font-body text-gray-500 mt-2 leading-relaxed">Partner hotels, plenary sessions and networking spaces designed to support the AMC 2027 community.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {FEATURE_IMAGES.map((f) => (
              <Link key={f.title} to={f.to} className="group rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 bg-white animate-fade-up"
                style={{ boxShadow: "var(--shadow-card)", border: "1px solid rgba(232,224,208,0.8)" }}>
                <div className="relative overflow-hidden h-52">
                  <img src={f.src} alt={f.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                  <div className="absolute inset-0 bg-navy/20 group-hover:bg-navy/10 transition-colors" />
                </div>
                <div className="p-5">
                  <h3 className="font-body font-bold text-base mb-1.5" style={{ color: "var(--color-navy)" }}>{f.title}</h3>
                  <p className="font-body text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                  <div className="flex items-center gap-1 mt-3 text-xs font-body font-semibold" style={{ color: "var(--color-gold)" }}>
                    Learn more <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24" style={{ background: "var(--color-cream-dark)" }}>
        <div className="section-container">
          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-8 items-center">
            <div className="relative overflow-hidden rounded-[2rem] min-h-[430px] animate-fade-up" style={{ boxShadow: "var(--shadow-card)" }}>
              <img src="/images/conf.jpeg" alt="Conference worship and fellowship" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(125deg, rgba(5,15,30,0.82) 0%, rgba(5,15,30,0.38) 55%, rgba(201,168,76,0.2) 100%)" }} />
              <div className="relative z-10 flex h-full flex-col justify-end p-8 text-white">
                <span className="badge badge-gold mb-4 w-fit">A vibrant gathering</span>
                <h3 style={{ fontFamily: "Cinzel, serif" }} className="text-3xl font-bold mb-3">Worship, fellowship and purpose in every moment</h3>
                <p className="font-body text-sm text-white/80 max-w-xl">From morning devotion to evening celebration, AMC 2027 is designed to be inspiring, welcoming and deeply connected to the global church.</p>
              </div>
            </div>
            <div className="space-y-4">
              {MOMENT_IMAGES.map((item, index) => (
                <div key={item.title} className="group rounded-2xl overflow-hidden border border-white/70 bg-white p-3 shadow-sm hover:-translate-y-1 transition-all duration-300 animate-fade-up" style={{ animationDelay: `${index * 120}ms` }}>
                  <div className="flex gap-4 items-center">
                    <img src={item.src} alt={item.title} className="h-24 w-24 rounded-xl object-cover flex-shrink-0 transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                    <div>
                      <h4 className="font-body font-bold text-base mb-1" style={{ color: "var(--color-navy)" }}>{item.title}</h4>
                      <p className="font-body text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 relative overflow-hidden" style={{ background: "var(--navy-gradient)" }}>
        <div className="section-container max-w-3xl mx-auto text-center relative z-10">
          <span className="section-label" style={{ color: "rgba(201,168,76,0.8)" }}>Conference Theme</span>
          <h2 style={{ fontFamily: "Cinzel, serif" }} className="text-2xl font-bold text-white uppercase tracking-widest mb-6">The Theme</h2>
          <div style={{ height: "2px", width: "48px", background: "var(--gold-gradient)", margin: "0 auto 2rem" }} className="rounded-full" />
          <blockquote style={{ fontFamily: "Cormorant Garamond, serif", color: "white" }} className="text-3xl lg:text-4xl italic font-medium mb-4 leading-relaxed">
            "Equipped to transform,<br />Africa's sociopolitical and economic landscape"
          </blockquote>
          <p className="font-body font-semibold text-sm mb-8" style={{ color: "var(--color-gold)" }}>Isaiah 61:1</p>
          <p className="font-body text-white/65 leading-relaxed text-base">
            The 3rd General Conference gathers bishops, clergy, and lay delegates from across the continent and diaspora to discern the Church&apos;s calling.
          </p>
        </div>
      </section>

      <section className="py-24" style={{ background: "var(--color-cream-dark)" }}>
        <div className="section-container">
          <div className="max-w-xl mx-auto text-center mb-14">
            <span className="section-label">Navigation</span>
            <h2 className="section-heading">Quick Access</h2>
            <span className="gold-rule" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {QUICK_LINKS.map(({ to, Icon, title, desc }) => (
              <Link key={to} to={to} className="group bg-white rounded-2xl p-6 flex flex-col gap-4 transition-all duration-300 hover:-translate-y-1"
                style={{ border: "1px solid rgba(232,224,208,0.8)", boxShadow: "var(--shadow-card)" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-110"
                  style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.25)" }}>
                  <Icon size={22} style={{ color: "var(--color-gold)" }} />
                </div>
                <div>
                  <h3 className="font-body font-bold text-base mb-1" style={{ color: "var(--color-navy)" }}>{title}</h3>
                  <p className="font-body text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-body font-semibold mt-auto pt-1" style={{ color: "var(--color-gold)" }}>
                  Explore <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 relative overflow-hidden" style={{ background: "var(--color-cream)" }}>
        <div className="absolute inset-0 bg-center bg-cover" style={{ backgroundImage: "url('/images/rainbow_towers.jpg')" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(5,15,30,0.92) 0%, rgba(5,15,30,0.72) 100%)" }} />
        <div className="section-container relative z-10">
          <div className="max-w-xl mx-auto text-center mb-14">
            <span className="section-label" style={{ color: "rgba(201,168,76,0.8)" }}>Programme</span>
            <h2 className="section-heading text-white">What to Expect</h2>
            <span className="gold-rule" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {EXPECT_ITEMS.map(({ Icon, title, desc }) => (
              <div key={title} className="flex gap-4 p-5 rounded-2xl bg-white/10 backdrop-blur-sm transition-all duration-200 hover:shadow-md group"
                style={{ border: "1px solid rgba(255,255,255,0.14)" }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors group-hover:bg-gold/20"
                  style={{ background: "rgba(201,168,76,0.12)" }}>
                  <Icon size={20} className="transition-colors" style={{ color: "var(--color-gold)" }} />
                </div>
                <div>
                  <h3 className="font-body font-bold text-sm mb-1 text-white">{title}</h3>
                  <p className="font-body text-xs text-white/70 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 relative overflow-hidden" style={{ background: "var(--navy-gradient)" }}>
        <div className="section-container text-center relative z-10">
          <h2 style={{ fontFamily: "Cinzel, serif" }} className="text-3xl lg:text-4xl font-bold text-white uppercase tracking-widest mb-4">Join Us in Harare</h2>
          <p style={{ fontFamily: "Cormorant Garamond, serif" }} className="text-white/70 text-xl italic mb-8">
            March 9&ndash;14, 2027 &middot; Rainbow Towers Hotel &amp; Conference Centre
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="inline-flex items-center justify-center gap-2 text-base px-10 py-4 rounded-xl font-body font-bold transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: "var(--gold-gradient)", color: "var(--color-navy)", boxShadow: "0 4px 20px rgba(201,168,76,0.4)" }}>
              Register Now <ArrowRight size={18} />
            </Link>
            <Link to="/about" className="inline-flex items-center justify-center gap-2 text-base px-10 py-4 rounded-xl font-body font-semibold transition-all duration-200 hover:bg-white/10"
              style={{ border: "2px solid rgba(255,255,255,0.3)", color: "white" }}>
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}