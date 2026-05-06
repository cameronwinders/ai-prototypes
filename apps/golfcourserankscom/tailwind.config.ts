import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "var(--ink)",
        "ink-soft": "var(--ink-soft)",
        muted: "var(--muted)",
        pine: "var(--pine)",
        "pine-soft": "var(--pine-soft)",
        "pine-deep": "var(--pine-deep)",
        sand: "var(--sand)",
        "sand-soft": "var(--sand-soft)",
        linen: "var(--linen)",
        "linen-warm": "var(--linen-warm)",
        "linen-mid": "var(--linen-mid)",
        line: "var(--line)",
        "warning-ink": "var(--warning-ink)",
        "warning-bg": "var(--warning-bg)",
        "warning-line": "var(--warning-line)"
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"]
      },
      borderRadius: {
        xs: "var(--radius-xs)",
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)"
      },
      boxShadow: {
        chip: "var(--shadow-chip)",
        header: "var(--shadow-header)",
        panel: "var(--shadow-panel)",
        active: "var(--shadow-active)"
      }
    }
  }
};

export default config;
