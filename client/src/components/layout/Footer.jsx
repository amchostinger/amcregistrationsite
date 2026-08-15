/**
 * components/layout/Footer.jsx
 */

import { Link } from "react-router-dom";
import { Mail, Globe, MapPin, ArrowUpRight, Heart } from "lucide-react";
import BrandMark from "./BrandMark";

const LINKS = [
  { to: "/about",    label: "About the Conference" },
  { to: "/schedule", label: "Program Schedule" },
  { to: "/speakers", label: "Speakers" },
  { to: "/resources", label: "Resources" },
  { to: "/hotels",   label: "Hotels" },
  { to: "/venue",    label: "Venue & Travel" },
  { to: "/register", label: "Register Now" },
];

export default function Footer() {
  return (
    <footer style={{ backgroundColor: "var(--color-navy)" }} className="text-white">
      {/* Gold top border */}
      <div style={{ height: "3px", background: "var(--gold-gradient)" }} />

      <div className="section-container py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">

          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-5">
              <BrandMark size={48} textClass="text-sm" />
              <div>
                <div style={{ fontFamily: "Cinzel, serif" }} className="text-white text-sm font-semibold tracking-wide uppercase">Africa Methodist Council</div>
                <div className="text-gold text-[11px] tracking-wider mt-0.5 font-body">3rd General Conference 2027</div>
              </div>
            </div>
            <p
              style={{ fontFamily: "Cormorant Garamond, serif" }}
              className="text-white/60 text-base italic leading-relaxed mb-4"
            >
              "Equipped to transform Africa's sociopolitical and economic landscape"
            </p>
            <div className="flex items-center gap-2 text-white/50 text-sm font-body">
              <MapPin size={14} className="flex-shrink-0 text-gold/70" />
              <span>March 9–14, 2027 · Harare, Zimbabwe</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ fontFamily: "Cinzel, serif" }} className="text-gold text-xs font-bold mb-5 uppercase tracking-widest">Quick Links</h4>
            <ul className="space-y-2.5 text-sm text-white/60 font-body">
              {LINKS.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="hover:text-gold transition-colors duration-150 inline-flex items-center gap-1.5 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-gold/40 group-hover:bg-gold transition-colors flex-shrink-0" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ fontFamily: "Cinzel, serif" }} className="text-gold text-xs font-bold mb-5 uppercase tracking-widest">Contact</h4>
            <div className="space-y-3 font-body">
              <p className="text-white/60 text-sm leading-relaxed">General Secretariat, Africa Methodist Council</p>
              <a
                href="mailto:conference@africamethodistcouncil.org"
                className="flex items-center gap-2 text-white/60 hover:text-gold transition-colors text-sm group"
              >
                <Mail size={14} className="text-gold/60 group-hover:text-gold transition-colors flex-shrink-0" />
                conference@africamethodistcouncil.org
              </a>
              <a
                href="https://africamethodistcouncil.org"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-white/60 hover:text-gold transition-colors text-sm group"
              >
                <Globe size={14} className="text-gold/60 group-hover:text-gold transition-colors flex-shrink-0" />
                africamethodistcouncil.org
                <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            </div>
          </div>
        </div>

        <div
          className="border-t mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}
        >
          <p className="text-xs text-white/35 font-body">
            &copy; 2027 Africa Methodist Council. All rights reserved. Official conference registration site.
          </p>
          <p className="text-xs text-white/25 font-body flex items-center gap-1.5">
            Made with <Heart size={10} className="text-red-400/60" fill="currentColor" /> by KC Media_Zim
          </p>
        </div>
      </div>
    </footer>
  );
}