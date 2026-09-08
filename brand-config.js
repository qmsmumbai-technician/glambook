// brand-config.js
// ============================================================
// THIS IS THE ONLY FILE YOU EDIT TO RESKIN FOR A NEW PARLOUR.
// Change these values, swap the Firebase project in
// firebase-config.js, update manifest.json + icons, and you
// have a new client's app from the same codebase.
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
  // ADMIN ACCESS — enter this phone + PIN on the Sign In screen
  // to reach the Admin Panel instead of the customer view.
  // Keep `phone` here DIFFERENT from contactPhone above, since
  // contactPhone is shown publicly in the header.
  //
  // firebaseEmail/firebasePassword must match a real user you
  // created in Firebase Console → Authentication → Users — the
  // PIN below is just a friendlier front door; Firestore's actual
  // security still runs on that Firebase login underneath.
  //
  // Note: since this whole app is plain client-side code, someone
  // technical enough to view page source could find this PIN. It
  // keeps ordinary customers out, but isn't a strong lock.
  // ============================================================
  adminAccess: {
    phone: "9999999999",
    pin: "1234",
    firebaseEmail: "owner@example.com",
    firebasePassword: "REPLACE_WITH_REAL_PASSWORD",
  },

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
