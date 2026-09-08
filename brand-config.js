// brand-config.js
// ============================================================
// THIS IS THE ONLY FILE YOU EDIT TO RESKIN FOR A NEW PARLOUR.
// Change these values, update manifest.json + icons, and you
// have a new client's app from the same codebase. No cloud
// backend to set up — everything runs locally on the device.
// ============================================================

export const brand = {
  // Shown in the header, browser tab, and "Add to Home Screen" prompt.
  appName: "GlamBook",
  appNameAccent: "Book",   // the part of appName styled in the accent color, e.g. "Glam" + "Book"

  // Path/URL to the parlour's logo — square image works best. Leave blank
  // to fall back to a plain initial badge.
  logoUrl: "",

  tagline: "Look your best, on your terms.",
  subTagline: "Book a service at the salon, or have us come to you.",

  // Contact shown in the footer — replace with the parlour's own.
  contactPhone: "",
  contactAddress: "",

  // ============================================================
  // APP PIN — required every time the app is opened, since this
  // is a private tool for you only (client details, bills, etc.
  // aren't meant to be seen by anyone who picks up the phone).
  // ============================================================
  appPin: "1234",

  colors: {
    primary: "#2E1520",     // header, headings, primary UI
    primaryLight: "#4A2536",
    background: "#FBF6F1",  // page background
    accent: "#C77B87",      // buttons, active states
    accentDark: "#A85F6B",
    highlight: "#B08D57",   // rules, small decorative touches
    ink: "#241318",         // body text
    muted: "#8A7278",
    border: "#E7DCD5",
  },

  fonts: {
    display: "'Playfair Display', Georgia, serif",
    body: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    // Google Fonts URL — update if you change the fonts above.
    googleFontsUrl: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&family=Inter:wght@400;500;600&display=swap",
  },
};
