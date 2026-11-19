/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter var",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },

      colors: {
        // Brand indigo per DESIGN.md (#4F46E5 at 600). Full ramp so hover,
        // active and tint states come from one coherent scale.
        primary: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },
        // Success green per DESIGN.md (#16A34A at 600).
        success: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
        },
        // Replaces Tailwind's default gray with a cooler, lower-chroma ramp.
        // Overriding the built-in name means every existing text-gray-*/
        // border-gray-* in the app picks this up with no call-site edits.
        gray: {
          25: "#fcfcfd",
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e7ebf0",
          300: "#d3dae3",
          400: "#9aa4b2",
          500: "#697586",
          600: "#4b5565",
          700: "#364152",
          800: "#202939",
          900: "#121926",
          950: "#0b0f19",
        },
      },

      // Tighter tracking as size increases — a strong perceived-quality cue
      // and the main reason default Tailwind headings read as generic.
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1.125rem" }],
        sm: ["0.875rem", { lineHeight: "1.3125rem" }],
        base: ["0.9375rem", { lineHeight: "1.4375rem" }],
        lg: ["1.0625rem", { lineHeight: "1.5rem", letterSpacing: "-0.011em" }],
        xl: ["1.1875rem", { lineHeight: "1.625rem", letterSpacing: "-0.014em" }],
        "2xl": ["1.4375rem", { lineHeight: "1.875rem", letterSpacing: "-0.019em" }],
        "3xl": ["1.75rem", { lineHeight: "2.1875rem", letterSpacing: "-0.021em" }],
        "4xl": ["2.1875rem", { lineHeight: "2.5rem", letterSpacing: "-0.024em" }],
        "5xl": ["2.75rem", { lineHeight: "3rem", letterSpacing: "-0.028em" }],
      },

      borderRadius: {
        md: "0.375rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
      },

      // Multi-layer shadows at low alpha. A single flat shadow is the other
      // big tell of an unstyled Tailwind app.
      boxShadow: {
        xs: "0 1px 2px 0 rgb(16 24 40 / 0.04)",
        sm: "0 1px 2px 0 rgb(16 24 40 / 0.04), 0 1px 3px 0 rgb(16 24 40 / 0.06)",
        DEFAULT: "0 2px 4px -1px rgb(16 24 40 / 0.04), 0 4px 8px -2px rgb(16 24 40 / 0.05)",
        md: "0 2px 4px -1px rgb(16 24 40 / 0.04), 0 4px 8px -2px rgb(16 24 40 / 0.05)",
        lg: "0 4px 6px -2px rgb(16 24 40 / 0.03), 0 12px 16px -4px rgb(16 24 40 / 0.07)",
        xl: "0 8px 8px -4px rgb(16 24 40 / 0.03), 0 20px 24px -4px rgb(16 24 40 / 0.08)",
        "2xl": "0 24px 48px -12px rgb(16 24 40 / 0.16)",
        // Hairline top highlight — makes filled buttons feel tactile.
        raised:
          "inset 0 1px 0 0 rgb(255 255 255 / 0.12), 0 1px 2px 0 rgb(16 24 40 / 0.10)",
        none: "none",
      },

      transitionTimingFunction: {
        out: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      transitionDuration: {
        150: "150ms",
      },

      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 200ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in-up": "fade-in-up 240ms cubic-bezier(0.16, 1, 0.3, 1) both",
      },
    },
  },
  plugins: [],
};
