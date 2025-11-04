/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}", // Added this line to include theme-config.ts
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
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
        twilight: {
          DEFAULT: "#3A2E5D",
          dark: "#2E2D4B",
        },
        burgundy: {
          DEFAULT: "#7A2F3D",
          light: "#8B3E4D",
        },
        gold: {
          DEFAULT: "#D4AF37",
          light: "#F5E3B3",
        },
        ivory: {
          DEFAULT: "#FAF8F4",
          dark: "#FDFCF9",
        },
        charcoal: "#2C2C2C",
        pearl: "#F2F2F2",
        // Updated color names to match Tailwind CSS v3.0+
        sky: {}, // Renamed from lightBlue
        stone: {}, // Renamed from warmGray
        neutral: {}, // Renamed from trueGray
        gray: {}, // Renamed from coolGray
        slate: {}, // Renamed from blueGray
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "fade-in": {
          from: { opacity: 0, transform: "translateY(10px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
        "slide-in": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        // Add new keyframes for student portal
        spin: {
          from: { transform: "rotate(45deg)" },
          to: { transform: "rotate(405deg)" },
        },
        circlebounce: {
          "0%, 100%": { transform: "translateY(0) scale(1)" },
          "50%": { transform: "translateY(-20px) scale(1.1)" },
        },
        bounce: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-15px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        shimmer: "shimmer 2s infinite",
        // Add new animations for student portal
        spin: "spin 15s linear infinite",
        circlebounce: "circlebounce 2.6s ease-in-out infinite",
        bounce: "bounce 2s infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
  future: {
    // This silences the renamed color warnings
    hoverOnlyWhenSupported: true,
  },
  corePlugins: {
    // Disable the deprecated color names
    preflight: true,
  },
}
