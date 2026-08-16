/**
 * pages/Resources.jsx
 * Conference resources — presentations, keynote materials and other documents
 * shared by guest speakers.
 */

import { useState, useEffect, useMemo } from "react";
import { FileText, Download, ExternalLink, User } from "lucide-react";
import api, { assetUrl } from "../lib/api";

const RESOURCES_HEADER = "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1920&q=80";

const CATEGORY_ORDER = ["Keynote Material", "Presentation", "Document", "Report", "Other"];

function formatSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileExtension(url) {
  const match = /\.([a-z0-9]{2,5})(?:\?|$)/i.exec(url || "");
  return match ? match[1].toUpperCase() : "";
}

function ResourceCard({ resource }) {
  const href = resource.file_url ? assetUrl(resource.file_url) : resource.external_url;
  const isExternal = !resource.file_url && !!resource.external_url;
  const ext = fileExtension(resource.file_url || resource.external_url);

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      {...(resource.file_url ? { download: "" } : {})}
      className="group flex gap-4 bg-white rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1"
      style={{ border: "1px solid rgba(232,224,208,0.8)", boxShadow: "var(--shadow-card)" }}
    >
      <div
        className="w-12 h-12 rounded-xl flex-shrink-0 flex flex-col items-center justify-center"
        style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)" }}
      >
        <FileText size={18} style={{ color: "var(--color-gold)" }} />
        {ext && (
          <span className="text-[8px] font-body font-bold tracking-wide mt-0.5" style={{ color: "var(--color-gold)" }}>
            {ext}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h3
          style={{ fontFamily: "Cinzel, serif", color: "var(--color-navy)" }}
          className="text-sm font-bold leading-snug mb-1 group-hover:text-gold transition-colors"
        >
          {resource.title}
        </h3>

        {resource.speaker_name && (
          <p className="font-body text-xs flex items-center gap-1 mb-1.5" style={{ color: "var(--color-muted)" }}>
            <User size={10} /> {resource.speaker_name}
          </p>
        )}

        {resource.description && (
          <p className="font-body text-xs leading-relaxed mb-2" style={{ color: "var(--color-muted)" }}>
            {resource.description}
          </p>
        )}

        <span
          className="inline-flex items-center gap-1 text-xs font-body font-semibold"
          style={{ color: "var(--color-gold)" }}
        >
          {isExternal ? <>Open link <ExternalLink size={11} /></> : <>Download <Download size={11} /></>}
          {resource.file_size ? (
            <span className="font-normal" style={{ color: "var(--color-muted)" }}>· {formatSize(resource.file_size)}</span>
          ) : null}
        </span>
      </div>
    </a>
  );
}

export default function Resources() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    api.get("/resources")
      .then((res) => setResources(res.data || []))
      .catch(() => setError("Unable to load resources. Please check the server is running."))
      .finally(() => setLoading(false));
  }, []);

  // Group into the fixed category order, dropping any group with no entries.
  const groups = useMemo(() => {
    const seen = [...new Set(resources.map((r) => r.category))];
    const ordered = [
      ...CATEGORY_ORDER.filter((c) => seen.includes(c)),
      ...seen.filter((c) => !CATEGORY_ORDER.includes(c)),
    ];
    return ordered.map((category) => ({
      category,
      items: resources.filter((r) => r.category === category),
    }));
  }, [resources]);

  return (
    <div className="min-h-screen" style={{ background: "var(--color-cream)" }}>
      {/* Header */}
      <div className="relative overflow-hidden" style={{ background: "var(--navy-gradient)", paddingTop: "6rem", paddingBottom: "3.5rem", marginTop: "-80px" }}>
        <div className="absolute inset-0 bg-center bg-cover opacity-15" style={{ backgroundImage: `url("${RESOURCES_HEADER}")` }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(15,30,51,0.6), rgba(15,30,51,0.9))" }} />
        <div className="section-container text-center relative z-10 pt-6">
          <span className="section-label">AMC 2027</span>
          <h1 style={{ fontFamily: "Cinzel, serif" }} className="page-title text-white mb-3">Resources</h1>
          <div style={{ height: "3px", width: "48px", background: "var(--gold-gradient)", margin: "0 auto" }} className="rounded-full" />
          <p className="font-body text-white/60 text-sm mt-3">Presentations, Keynote Materials & Documents</p>
        </div>
      </div>

      <div className="section-container py-14">
        <p className="text-center font-body leading-relaxed mb-12 max-w-2xl mx-auto" style={{ color: "var(--color-muted)" }}>
          This section hosts conference resources, presentations, keynote materials and other documents
          shared by guest speakers. Materials are published as they are received.
        </p>

        {error && (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="font-body text-sm font-semibold text-red-700">Unable to Load Resources</p>
            <p className="font-body text-xs text-red-600 mt-1">{error}</p>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-16 gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--color-gold)", borderTopColor: "transparent" }} />
            <span className="font-body text-sm text-gray-400">Loading resources...</span>
          </div>
        )}

        {!loading && !resources.length && !error && (
          <div className="text-center py-16 rounded-2xl bg-white" style={{ border: "1px solid rgba(232,224,208,0.8)" }}>
            <FileText size={28} className="mx-auto mb-3" style={{ color: "rgba(201,168,76,0.5)" }} />
            <p className="font-body text-gray-400 text-sm">
              Conference materials will be published here as speakers share them. Please check back.
            </p>
          </div>
        )}

        {groups.map(({ category, items }) => (
          <section key={category} className="mb-12">
            <div className="flex items-center gap-4 mb-6">
              <h2 style={{ fontFamily: "Cinzel, serif", color: "var(--color-navy)" }} className="text-lg font-bold uppercase tracking-widest whitespace-nowrap">
                {category}
              </h2>
              <span className="flex-1 h-px" style={{ background: "rgba(201,168,76,0.35)" }} />
              <span className="font-body text-xs" style={{ color: "var(--color-muted)" }}>{items.length}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {items.map((r) => <ResourceCard key={r.id} resource={r} />)}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
