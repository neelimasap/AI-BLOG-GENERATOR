import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-body)', 'Be Vietnam Pro', 'system-ui', 'sans-serif'],
        heading: ['var(--font-headline)', 'Plus Jakarta Sans', 'sans-serif'],
        headline: ['var(--font-headline)', 'Plus Jakarta Sans', 'sans-serif'],
        body: ['var(--font-body)', 'Be Vietnam Pro', 'system-ui', 'sans-serif'],
        label: ['var(--font-body)', 'Be Vietnam Pro', 'system-ui', 'sans-serif'],
      },
      colors: {
        // shadcn/ui HSL token system
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Material Design token palette (flat hex values)
        "primary-container": "#ffae7e",
        "on-primary": "#fff7f5",
        "on-primary-container": "#652c00",
        "on-primary-fixed": "#451c00",
        "primary-fixed": "#ffae7e",
        "inverse-primary": "#ff7b04",
        "secondary-dim": "#3b4aa9",
        "on-secondary": "#ffffff",
        "on-secondary-fixed": "#253495",
        "secondary-fixed-dim": "#cdd1ff",
        "on-secondary-container": "#3948a8",
        "tertiary": "#096119",
        "tertiary-dim": "#096119",
        "on-tertiary": "#eaffe2",
        "tertiary-fixed": "#9df197",
        "on-tertiary-fixed": "#00460e",
        "on-tertiary-fixed-variant": "#12661e",
        "surface": "#fff9e9",
        "on-surface": "#383309",
        "on-surface-variant": "#676032",
        "surface-container": "#f8efc0",
        "surface-container-high": "#f3e9b5",
        "surface-container-low": "#fdf3cc",
        "surface-container-lowest": "#ffffff",
        "inverse-surface": "#110e00",
        "error-container": "#fa7150",
        "error-dim": "#821a01",
        "on-error": "#fff7f6",
      },
      borderRadius: {
        DEFAULT: "1rem",
        xl: "3rem",
        lg: "2rem",
        md: "1rem",
        sm: "calc(1rem - 4px)",
        full: "9999px",
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;
