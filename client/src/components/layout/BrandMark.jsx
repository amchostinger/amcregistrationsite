/**
 * components/layout/BrandMark.jsx
 * The Africa Methodist Council roundel, used as the brand mark in the navbar
 * and footer. Falls back to the "AMC" lettermark if the logo file is missing so
 * the header never renders a broken image.
 */

import { useState } from "react";

const LOGO_SRC = "/images/amc-logo.png";

export default function BrandMark({ size = 40, textClass = "text-xs", className = "", style = {} }) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={`rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        border: "2px solid var(--color-gold)",
        // #dedede is the artwork's own ground, so the square image blends into
        // the round frame with no visible seam.
        background: failed ? "rgba(201,168,76,0.12)" : "#dedede",
        ...style,
      }}
    >
      {failed ? (
        <span
          style={{ fontFamily: "Cinzel, serif" }}
          className={`text-gold font-bold tracking-wider ${textClass}`}
        >
          AMC
        </span>
      ) : (
        // Contained, never cropped — the council's name runs around the rim of
        // the roundel, so any overflow crop would cut the lettering off.
        <img
          src={LOGO_SRC}
          alt="Africa Methodist Council"
          className="w-full h-full object-contain"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
