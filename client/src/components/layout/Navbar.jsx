/**
 * components/layout/Navbar.jsx
 * Transparent to solid navy on scroll. Mobile hamburger drawer.
 */

import { useState, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X, ArrowRight } from "lucide-react";

const NAV_LINKS = [
  { to: "/",         label: "Home",     exact: true },
  { to: "/about",    label: "About" },
  { to: "/schedule", label: "Schedule" },
  { to: "/speakers", label: "Speakers" },
  { to: "/venue",    label: "Venue" },
  { to: "/hotels",   label: "Hotels" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isHome = pathname === "/";
  const solid = scrolled || !isHome || open;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        solid ? "shadow-xl backdrop-blur-sm" : ""
      }`}
      style={{
        background: solid ? "rgba(15,30,51,0.97)" : "transparent",
        borderBottom: solid ? "1px solid rgba(201,168,76,0.15)" : "none",
      }}
    >
      <div className="section-container">
        <div className="flex items-center justify-between h-16 lg:h-[72px]">

          {/* Brand */}
          <Link to="/" className="flex items-center gap-3 group flex-shrink-0">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 group-hover:scale-105"
              style={{ border: "2px solid var(--color-gold)", background: "rgba(201,168,76,0.12)" }}
            >
              <span style={{ fontFamily: "Cinzel, serif" }} className="text-gold font-bold text-xs tracking-wider">AMC</span>
            </div>
            <div className="hidden sm:block">
              <div style={{ fontFamily: "Cinzel, serif" }} className="text-white text-[11px] font-semibold tracking-widest uppercase leading-none">Africa Methodist Council</div>
              <div className="text-gold text-[10px] tracking-[0.2em] mt-0.5 font-body">Conference 2027</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-0.5">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.exact}
                className={({ isActive }) =>
                  `relative px-4 py-2 text-[13px] font-semibold font-body tracking-wide transition-all duration-200 rounded-lg ${
                    isActive
                      ? "text-gold bg-white/5"
                      : "text-white/75 hover:text-white hover:bg-white/8"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {link.label}
                    {isActive && (
                      <span
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full"
                        style={{ background: "var(--color-gold)" }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* Register CTA + hamburger */}
          <div className="flex items-center gap-3">
            <Link
              to="/register"
              className="hidden sm:inline-flex items-center gap-2 font-body font-bold text-[13px] px-5 py-2.5 rounded-xl transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: "var(--gold-gradient)",
                color: "var(--color-navy)",
                boxShadow: "0 2px 12px rgba(201,168,76,0.35)",
              }}
            >
              Register Now
              <ArrowRight size={14} strokeWidth={2.5} />
            </Link>

            {/* Hamburger */}
            <button
              className="lg:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      <div
        className={`lg:hidden overflow-hidden transition-all duration-300 ${open ? "max-h-screen opacity-100" : "max-h-0 opacity-0"}`}
        style={{ borderTop: open ? "1px solid rgba(255,255,255,0.08)" : "none" }}
      >
        <div className="px-4 pb-6 pt-3 space-y-1" style={{ background: "rgba(10,20,38,0.98)" }}>
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.exact}
              className={({ isActive }) =>
                `flex items-center justify-between py-3 px-4 rounded-xl text-base font-semibold font-body transition-all duration-150 ${
                  isActive ? "text-gold bg-white/8" : "text-white/75 hover:text-white hover:bg-white/5"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {link.label}
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-gold" />}
                </>
              )}
            </NavLink>
          ))}
          <div className="pt-3">
            <Link
              to="/register"
              className="flex items-center justify-center gap-2 font-body font-bold py-3.5 rounded-xl transition-all duration-200"
              style={{ background: "var(--gold-gradient)", color: "var(--color-navy)", boxShadow: "0 2px 12px rgba(201,168,76,0.3)" }}
            >
              Register Now
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}