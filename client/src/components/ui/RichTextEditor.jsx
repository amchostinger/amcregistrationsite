/**
 * components/ui/RichTextEditor.jsx
 * Lightweight formatting editor for long-form fields (speaker bios).
 *
 * Deliberately dependency-free: a contenteditable surface plus a small
 * toolbar. Output is sanitised on every change so what is stored is exactly
 * the restricted HTML subset that <RichText> renders on the public site.
 */

import { useRef, useEffect, useCallback } from 'react';
import {
  Bold, Italic, Underline, List, ListOrdered,
  Heading, Quote, Link2, Eraser,
} from 'lucide-react';
import { sanitizeHtml, looksLikeHtml, plainTextToHtml } from '../../lib/richText';

const TOOLS = [
  { cmd: 'bold', icon: Bold, title: 'Bold (Ctrl+B)' },
  { cmd: 'italic', icon: Italic, title: 'Italic (Ctrl+I)' },
  { cmd: 'underline', icon: Underline, title: 'Underline (Ctrl+U)' },
  { sep: true },
  { cmd: 'insertUnorderedList', icon: List, title: 'Bulleted list' },
  { cmd: 'insertOrderedList', icon: ListOrdered, title: 'Numbered list' },
  { sep: true },
  { cmd: 'formatBlock', arg: '<h4>', icon: Heading, title: 'Sub-heading' },
  { cmd: 'formatBlock', arg: '<blockquote>', icon: Quote, title: 'Quote' },
  { cmd: 'createLink', icon: Link2, title: 'Insert link' },
  { sep: true },
  { cmd: 'removeFormat', icon: Eraser, title: 'Clear formatting' },
];

export default function RichTextEditor({ value, onChange, placeholder = '', minHeight = 180 }) {
  const ref = useRef(null);
  // Tracks the HTML we last pushed up, so re-renders don't reset the caret.
  const lastEmitted = useRef(null);

  // Sync inbound value only when it differs from what this editor produced.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const incoming = value || '';
    if (incoming === lastEmitted.current) return;
    const html = sanitizeHtml(looksLikeHtml(incoming) ? incoming : plainTextToHtml(incoming));
    if (el.innerHTML !== html) el.innerHTML = html;
    lastEmitted.current = incoming;
  }, [value]);

  const emit = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const html = sanitizeHtml(el.innerHTML);
    lastEmitted.current = html;
    onChange(html);
  }, [onChange]);

  const exec = (tool) => (e) => {
    e.preventDefault(); // keep the selection inside the editor
    ref.current?.focus();

    if (tool.cmd === 'createLink') {
      const url = window.prompt('Link URL', 'https://');
      if (!url) return;
      document.execCommand('createLink', false, url);
    } else {
      document.execCommand(tool.cmd, false, tool.arg);
    }
    emit();
  };

  // Paste as plain text so Word/Google Docs markup never enters the field.
  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    emit();
  };

  const isEmpty = !value || !sanitizeHtml(value).replace(/<[^>]*>|&nbsp;|\s/g, '');

  return (
    <div className="rich-editor">
      <div className="rich-editor-toolbar">
        {TOOLS.map((tool, i) =>
          tool.sep ? (
            <span key={`sep-${i}`} className="rich-editor-sep" />
          ) : (
            <button
              key={`${tool.cmd}-${tool.arg || ''}`}
              type="button"
              title={tool.title}
              onMouseDown={exec(tool)}
              className="rich-editor-btn"
            >
              <tool.icon size={14} />
            </button>
          )
        )}
      </div>

      <div className="relative">
        {isEmpty && placeholder && (
          <span className="rich-editor-placeholder">{placeholder}</span>
        )}
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          className="rich-editor-surface rich-text"
          style={{ minHeight }}
          onInput={emit}
          onBlur={emit}
          onPaste={handlePaste}
        />
      </div>

      <p className="rich-editor-hint">
        Use the toolbar for <strong>bold</strong>, bullets and headings — the public speaker
        page renders the exact same formatting.
      </p>
    </div>
  );
}
