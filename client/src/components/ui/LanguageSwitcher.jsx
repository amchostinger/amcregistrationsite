/**
 * components/ui/LanguageSwitcher.jsx
 *
 * Site language picker. Renders nothing until Google's translate widget has
 * confirmed which languages it actually serves, and nothing at all if the
 * script is blocked — better no control than one that silently does nothing.
 *
 * Marked `notranslate` so the widget does not translate the language names
 * themselves ("Français" must stay "Français" in every language).
 *
 * variant="nav"    — gold-on-navy dropdown for the desktop navbar.
 * variant="drawer" — flat pill list for the mobile drawer, which clips
 *                    absolutely-positioned panels.
 */

import { useEffect, useRef, useState } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { loadTranslator, getLanguage, setLanguage } from '../../lib/translate';

export default function LanguageSwitcher({ variant = 'nav' }) {
  const [languages, setLanguages] = useState(null);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(getLanguage);
  const ref = useRef(null);

  useEffect(() => {
    let alive = true;
    loadTranslator().then((available) => {
      if (!alive) return;
      setLanguages(available);
      setCurrent(getLanguage());
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (!languages || languages.length < 2) return null;

  const active = languages.find((lang) => lang.code === current) ?? languages[0];

  const choose = (code) => {
    setOpen(false);
    setLanguage(code); // reloads the page
  };

  /* --- Mobile drawer: flat list, no popover ----------------------- */
  if (variant === 'drawer') {
    return (
      <div className="notranslate pt-3" translate="no">
        <p className="flex items-center gap-2 px-4 pb-2 font-body text-[11px] uppercase tracking-[0.2em] text-white/40">
          <Globe size={13} />
          Language
        </p>
        <div className="flex flex-wrap gap-2 px-4">
          {languages.map((lang) => {
            const isActive = lang.code === active.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => choose(lang.code)}
                lang={lang.code}
                className={`rounded-xl px-3.5 py-2 font-body text-sm font-semibold transition-all duration-150 ${
                  isActive ? 'text-gold bg-white/10' : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
                style={isActive ? { border: '1px solid rgba(201,168,76,0.35)' } : { border: '1px solid rgba(255,255,255,0.08)' }}
              >
                {lang.native}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  /* --- Desktop navbar: dropdown ----------------------------------- */
  return (
    <div ref={ref} className="notranslate relative" translate="no">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Change language — currently ${active.label}`}
        className="flex items-center gap-1.5 rounded-lg px-3 py-2 font-body text-[13px] font-semibold tracking-wide text-white/75 transition-all duration-200 hover:bg-white/10 hover:text-white"
        style={open ? { background: 'rgba(255,255,255,0.1)', color: '#fff' } : undefined}
      >
        <Globe size={15} strokeWidth={2} />
        <span className="hidden xl:inline">{active.native}</span>
        <span className="xl:hidden uppercase">{active.code}</span>
        <ChevronDown
          size={13}
          strokeWidth={2.5}
          className="transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'none' }}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-xl py-1.5 shadow-xl"
          style={{
            background: 'rgba(10,20,38,0.98)',
            border: '1px solid rgba(201,168,76,0.2)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <p className="px-4 pb-1.5 pt-1 font-body text-[10px] uppercase tracking-[0.2em] text-white/35">
            Translate this site
          </p>
          {languages.map((lang) => {
            const isActive = lang.code === active.code;
            return (
              <button
                key={lang.code}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => choose(lang.code)}
                lang={lang.code}
                className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left font-body text-sm transition-colors duration-150 ${
                  isActive ? 'text-gold' : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span>
                  {lang.native}
                  {lang.native !== lang.label && (
                    <span className="ml-2 text-[11px] text-white/30">{lang.label}</span>
                  )}
                </span>
                {isActive && <Check size={14} strokeWidth={3} />}
              </button>
            );
          })}
          <p className="mt-1 border-t px-4 pb-1 pt-2 font-body text-[10px] leading-relaxed text-white/30" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
            Machine translation by Google. English remains the official text.
          </p>
        </div>
      )}
    </div>
  );
}
