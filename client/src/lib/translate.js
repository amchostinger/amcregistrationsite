/**
 * lib/translate.js
 *
 * Thin wrapper around the Google Website Translator widget.
 *
 * We never show Google's own dropdown or banner (both are hidden in index.css).
 * Instead the widget is loaded into an off-screen host element and driven
 * entirely through the `googtrans` cookie, which is what the widget reads on
 * page load to decide the target language. That gives us:
 *
 *   - full-page translation, including content rendered from MySQL
 *     (speakers, programme, hotels, resources, awards) — nothing to maintain;
 *   - a choice that survives reloads and SPA route changes;
 *   - our own navbar UI instead of Google's unstyled <select>.
 *
 * Changing language sets the cookie and reloads. The reload is deliberate:
 * the widget rewrites text nodes in place, and letting React re-render over
 * a half-translated tree is how you get `removeChild` crashes.
 */

export const DEFAULT_LANGUAGE = 'en';

/**
 * Languages offered in the switcher.
 *
 * `code` values are Google Translate codes. Note `nr` is Google's
 * "Ndebele (South)" — Zimbabwean isiNdebele is Northern Ndebele, which Google
 * does not carry; the two are closely related but not identical. Any code
 * Google stops serving is dropped from the menu automatically by
 * `getAvailableLanguages()` rather than rendering a dead option.
 */
export const LANGUAGES = [
  { code: 'en', native: 'English',    label: 'English' },
  { code: 'fr', native: 'Français',   label: 'French' },
  { code: 'pt', native: 'Português',  label: 'Portuguese' },
  { code: 'sw', native: 'Kiswahili',  label: 'Swahili' },
  { code: 'sn', native: 'chiShona',   label: 'Shona' },
  { code: 'nr', native: 'isiNdebele', label: 'Ndebele' },
];

const COOKIE = 'googtrans';
const STORAGE_KEY = 'amc.language';
const HOST_ID = 'google_translate_host';
const SCRIPT_ID = 'google-translate-script';
const CALLBACK = '__amcTranslateInit';
const SCRIPT_SRC = `https://translate.google.com/translate_a/element.js?cb=${CALLBACK}`;

let loadPromise = null;

/* --- Cookie plumbing ---------------------------------------------- */

/**
 * The widget looks for `googtrans` on the exact host and on the dot-prefixed
 * registrable domain, and which one it finds first varies by deployment, so we
 * write every plausible variant and clear every variant on reset.
 */
function cookieScopes() {
  const host = window.location.hostname;
  const scopes = [''];
  // Bare hostnames (localhost, IPs) reject domain attributes — path-only is enough there.
  if (host.includes('.') && !/^[\d.]+$/.test(host)) {
    scopes.push(`;domain=${host}`, `;domain=.${host}`);
    const bare = host.replace(/^www\./, '');
    if (bare !== host) scopes.push(`;domain=.${bare}`);
  }
  return scopes;
}

function writeCookie(value) {
  const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
  for (const scope of cookieScopes()) {
    document.cookie = `${COOKIE}=${value};path=/;expires=${expires}${scope}`;
  }
}

function clearCookie() {
  for (const scope of cookieScopes()) {
    document.cookie = `${COOKIE}=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT${scope}`;
  }
}

/** Reads the target language out of a `/en/fr` style cookie value. */
function cookieLanguage() {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]*)`));
  if (!match) return null;
  const parts = decodeURIComponent(match[1]).split('/');
  return parts[2] || null;
}

/* --- Public API ---------------------------------------------------- */

/** The language the page is currently rendered in. */
export function getLanguage() {
  try {
    return cookieLanguage() || localStorage.getItem(STORAGE_KEY) || DEFAULT_LANGUAGE;
  } catch {
    return cookieLanguage() || DEFAULT_LANGUAGE;
  }
}

/** Switches language and reloads. No-op if already on `code`. */
export function setLanguage(code) {
  if (code === getLanguage()) return;
  try { localStorage.setItem(STORAGE_KEY, code); } catch { /* private mode */ }

  if (code === DEFAULT_LANGUAGE) {
    clearCookie();
  } else {
    writeCookie(`/${DEFAULT_LANGUAGE}/${code}`);
  }
  window.location.reload();
}

/** Resolves once Google's hidden <select> has a populated language list. */
function whenComboReady(timeout = 10000) {
  return new Promise((resolve) => {
    const started = Date.now();
    const tick = () => {
      const combo = document.querySelector('.goog-te-combo');
      if (combo && combo.options.length > 1) return resolve(combo);
      if (Date.now() - started > timeout) return resolve(null);
      setTimeout(tick, 150);
    };
    tick();
  });
}

/**
 * Loads the widget (once) and returns the subset of LANGUAGES that Google
 * actually serves, or `null` if the script was blocked or never answered —
 * in which case the caller should render no switcher at all.
 */
export function loadTranslator() {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve) => {
    if (!document.getElementById(HOST_ID)) {
      const host = document.createElement('div');
      host.id = HOST_ID;
      host.setAttribute('aria-hidden', 'true');
      document.body.appendChild(host);
    }

    window[CALLBACK] = () => {
      /* eslint-disable no-new */
      new window.google.translate.TranslateElement(
        {
          pageLanguage: DEFAULT_LANGUAGE,
          includedLanguages: LANGUAGES.map((l) => l.code).join(','),
          autoDisplay: false,
        },
        HOST_ID,
      );
      whenComboReady().then((combo) => {
        if (!combo) return resolve(null);
        const served = new Set(Array.from(combo.options, (o) => o.value));
        resolve(LANGUAGES.filter((l) => l.code === DEFAULT_LANGUAGE || served.has(l.code)));
      });
    };

    if (document.getElementById(SCRIPT_ID)) return;

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onerror = () => resolve(null);
    document.body.appendChild(script);
  });

  return loadPromise;
}
