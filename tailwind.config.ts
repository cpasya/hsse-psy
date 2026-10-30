import type { Config } from "tailwindcss";
// TailAdmin Free tokens adapted from its Tailwind 4 theme to the HSSE Tailwind 3 stack.
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "var(--canvas)",
        surface: "var(--surface)",
        foreground: "var(--foreground)",
        muted: "var(--muted)",
        border: "var(--border)",
        primary: { DEFAULT: "#465fff", foreground: "#ffffff" },
        brand: {
          50: "#ecf3ff",
          100: "#dde9ff",
          500: "#465fff",
          600: "#3641f5",
          950: "#161950",
        },
        danger: "var(--danger)",
        success: "var(--success)",
        warning: "var(--warning)",
        info: "var(--info)",
      },
      borderRadius: { xl: "12px", "2xl": "16px" },
      fontFamily: { sans: ["Arial", "Helvetica", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
} satisfies Config;
