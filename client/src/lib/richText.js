/**
 * lib/richText.js
 * Helpers for the formatted (rich text) fields such as speaker bios.
 *
 * Bios are stored in the database as a small, restricted subset of HTML.
 * Everything written by the editor and everything rendered on the public site
 * passes through sanitizeHtml() so a stored value can never inject script,
 * styles, iframes, event handlers or javascript: URLs.
 */

// Tags an author may produce with the toolbar (plus the ones browsers emit
// for the same intent, e.g. <b>/<i> instead of <strong>/<em>).
const ALLOWED_TAGS = new Set([
  'P', 'BR', 'DIV',
  'STRONG', 'B', 'EM', 'I', 'U', 'S', 'STRIKE', 'DEL',
  'UL', 'OL', 'LI',
  'H3', 'H4',
  'BLOCKQUOTE',
  'A',
  'SPAN',
]);

// Tags whose content is dropped entirely rather than unwrapped.
const DROP_WITH_CONTENT = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'LINK', 'META']);

const TAG_ALIASES = { B: 'strong', I: 'em', STRIKE: 's', DEL: 's', DIV: 'p' };

function isSafeHref(href) {
  const value = String(href || '').trim();
  return /^(https?:\/\/|mailto:|tel:|\/|#)/i.test(value);
}

/**
 * Strip everything outside the allowed subset.
 * Disallowed elements are unwrapped (their text is kept) unless they are in
 * DROP_WITH_CONTENT. All attributes are removed except href on links.
 * @param {string} html
 * @returns {string} safe HTML
 */
export function sanitizeHtml(html) {
  if (!html) return '';
  if (typeof window === 'undefined' || !window.DOMParser) return '';

  const doc = new DOMParser().parseFromString(`<div id="rt-root">${html}</div>`, 'text/html');
  const root = doc.getElementById('rt-root');
  if (!root) return '';

  const walk = (node) => {
    // Iterate over a copy — the list mutates as we unwrap/remove children.
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) return;
      if (child.nodeType !== Node.ELEMENT_NODE) {
        child.remove(); // comments, processing instructions, …
        return;
      }

      const tag = child.tagName.toUpperCase();

      if (DROP_WITH_CONTENT.has(tag)) {
        child.remove();
        return;
      }

      if (!ALLOWED_TAGS.has(tag)) {
        // Unwrap: keep the text, discard the element.
        walk(child);
        child.replaceWith(...child.childNodes);
        return;
      }

      // Strip every attribute, then restore the few we permit.
      const href = tag === 'A' ? child.getAttribute('href') : null;
      [...child.attributes].forEach((attr) => child.removeAttribute(attr.name));
      if (tag === 'A') {
        if (isSafeHref(href)) {
          child.setAttribute('href', href.trim());
          child.setAttribute('target', '_blank');
          child.setAttribute('rel', 'noopener noreferrer');
        } else {
          walk(child);
          child.replaceWith(...child.childNodes);
          return;
        }
      }

      walk(child);

      // Normalise browser-specific tags to a single canonical form.
      const canonical = TAG_ALIASES[tag];
      if (canonical) {
        const replacement = doc.createElement(canonical);
        [...child.attributes].forEach((attr) => replacement.setAttribute(attr.name, attr.value));
        replacement.append(...child.childNodes);
        child.replaceWith(replacement);
      }
    });
  };

  walk(root);
  return root.innerHTML.trim();
}

/**
 * True when a stored value already contains markup produced by the editor.
 * Legacy bios were saved as plain text with newlines.
 */
export function looksLikeHtml(value) {
  return /<(p|br|ul|ol|li|strong|b|em|i|u|h3|h4|blockquote|a|s|div)\b[^>]*>/i.test(value || '');
}

/**
 * Convert legacy plain-text (blank-line separated) into paragraphs so old and
 * new bios render identically.
 */
export function plainTextToHtml(value) {
  if (!value) return '';
  const escape = (s) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  return String(value)
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${escape(block).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

/**
 * Single entry point used by every renderer: accepts either a legacy
 * plain-text bio or editor HTML and returns safe HTML.
 */
export function toSafeHtml(value) {
  if (!value) return '';
  return sanitizeHtml(looksLikeHtml(value) ? value : plainTextToHtml(value));
}

/** Plain-text preview (e.g. for table cells) from either format. */
export function toPlainText(value) {
  if (!value) return '';
  if (!looksLikeHtml(value)) return String(value);
  if (typeof window === 'undefined' || !window.DOMParser) return '';
  const doc = new DOMParser().parseFromString(sanitizeHtml(value), 'text/html');
  return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
}
