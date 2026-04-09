import React from "react";

// Subtle grain layer for premium feel.
export const Noise = ({ className = "" }) => {
  return (
    <div
      aria-hidden="true"
      className={
        "pointer-events-none absolute inset-0 z-0 opacity-[0.18] mix-blend-overlay " +
        className
      }
      style={{
        backgroundImage:
          "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"240\" height=\"240\"><filter id=\"n\"><feTurbulence type=\"fractalNoise\" baseFrequency=\"0.9\" numOctaves=\"3\" stitchTiles=\"stitch\"/></filter><rect width=\"240\" height=\"240\" filter=\"url(%23n)\" opacity=\"0.35\"/></svg>')",
      }}
    />
  );
};
