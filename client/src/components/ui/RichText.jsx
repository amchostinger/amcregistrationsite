/**
 * components/ui/RichText.jsx
 * Renders a stored bio (editor HTML or legacy plain text) with the same
 * formatting the author saw in the admin editor. Content is sanitised here
 * as well as on save — never trust what came back from the database.
 */

import { useMemo } from 'react';
import { toSafeHtml } from '../../lib/richText';

export default function RichText({ value, className = '', style }) {
  const html = useMemo(() => toSafeHtml(value), [value]);
  if (!html) return null;

  return (
    <div
      className={`rich-text ${className}`.trim()}
      style={style}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
