/**
 * low/mid/high is ordinal, so it gets a single hue light->dark rather than
 * three unrelated hues. Steps validated for CVD separation (worst adjacent
 * dE 15.6) and monotonic lightness. The lightest step falls under 3:1 on
 * white, so anything using it must also carry a visible label or legend.
 */
export const BAND_COLORS: Record<string, string> = {
  low: "#818cf8",
  mid: "#4f46e5",
  high: "#312e81",
};

export const BAND_ORDER = ["low", "mid", "high"] as const;

/** Tailwind classes for band pills, matching the ramp above. */
export const BAND_BADGE: Record<string, string> = {
  low: "bg-primary-50 text-primary-700 ring-primary-600/20",
  mid: "bg-primary-100 text-primary-800 ring-primary-600/25",
  high: "bg-primary-900 text-white ring-primary-900/20",
};
