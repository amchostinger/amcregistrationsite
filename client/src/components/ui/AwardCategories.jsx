/**
 * components/ui/AwardCategories.jsx
 * Awards section — the categories recognised at the General Conference.
 * Categories are managed from Admin → Awards; the section hides itself when
 * nothing has been published yet.
 */

import { useState, useEffect } from "react";
import { Award } from "lucide-react";
import api from "../../lib/api";

export default function AwardCategories({ showWhenEmpty = false }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/awards/categories")
      .then((res) => setCategories(res.data || []))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (!categories.length && !showWhenEmpty) return null;

  return (
    <section
      className="rounded-[2rem] p-5 sm:p-8 md:p-10 border"
      style={{
        background: "rgba(201,168,76,0.08)",
        borderColor: "rgba(201,168,76,0.2)",
        boxShadow: "var(--shadow-xs)",
      }}
    >
      <div className="flex items-center gap-3 mb-2">
        <Award size={20} style={{ color: "var(--color-gold)" }} />
        <h2
          style={{ fontFamily: "Cinzel, serif", color: "var(--color-navy)" }}
          className="text-xl font-bold uppercase tracking-widest"
        >
          Awards
        </h2>
      </div>
      <p className="font-body text-sm mb-6" style={{ color: "var(--color-muted)" }}>
        Categories recognised at the 3rd General Conference.
      </p>

      {!categories.length ? (
        <div
          className="rounded-2xl bg-white/70 p-8 text-center"
          style={{ border: "1px dashed rgba(201,168,76,0.4)" }}
        >
          <p className="font-body text-sm" style={{ color: "var(--color-muted)" }}>
            Award categories will be published once confirmed.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {categories.map((c) => (
            <div
              key={c.id}
              className="rounded-2xl bg-white p-5 sm:p-6"
              style={{ border: "1px solid rgba(232,224,208,0.9)", boxShadow: "var(--shadow-card)" }}
            >
              <h3
                style={{ fontFamily: "Cinzel, serif", color: "var(--color-navy)" }}
                className="text-sm font-bold uppercase tracking-wide mb-2"
              >
                {c.title}
              </h3>
              {c.description && (
                <p className="font-body text-sm leading-relaxed mb-3" style={{ color: "var(--color-muted)" }}>
                  {c.description}
                </p>
              )}
              {c.criteria && (
                <>
                  <p
                    className="font-body text-[10px] font-bold uppercase tracking-widest mb-1"
                    style={{ color: "var(--color-gold)" }}
                  >
                    Criteria
                  </p>
                  <p className="font-body text-xs leading-relaxed" style={{ color: "var(--color-muted)" }}>
                    {c.criteria}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
