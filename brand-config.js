// brand-config.js
// ============================================================
// THIS IS THE ONLY FILE YOU EDIT TO RESKIN FOR A NEW PARLOUR.
// Change these values, update manifest.json + icons, and you
// have a new client's app from the same codebase. No cloud
// backend to set up — everything runs locally on the device.
// ============================================================

export const brand = {
  // Shown in the header, browser tab, and "Add to Home Screen" prompt.
  appName: "Abode Digital Technology",
  appNameAccent: "Technology",   // the part of appName styled in the accent color, e.g. "Abode Digital" + "Technology"

  // Path/URL to the parlour's logo — square image works best. Leave blank
  // to fall back to a plain initial badge.
  logoUrl: "logo.png",

  tagline: "Making Life Easier",
  subTagline: "Book a service at the salon, or have us come to you.",

  // Contact shown in the footer — replace with the parlour's own.
  contactPhone: "9860046593",
  contactAddress: "",

  // ============================================================
  // APP PIN — required every time the app is opened, since this
  // is a private tool for you only (client details, bills, etc.
  // aren't meant to be seen by anyone who picks up the phone).
  // ============================================================
  appPin: "1234",

  // How many days between backups before the app shows a reminder
  // banner on the home screen. Tap "Back up now" right there to clear it.
  backupReminderDays: 3,

  // ============================================================
  // CLOUD SYNC (optional) — lets you use the app from more than
  // one device, one after another (not at the same time). Syncing
  // sends/pulls the WHOLE snapshot each time — whichever device
  // synced last "wins". See README for how to set up the Google
  // Apps Script this connects to. Leave url blank to disable —
  // the app works fully offline either way.
  // ============================================================
  sync: {
    url: "",     // your deployed Apps Script Web App URL
    secret: "",  // must match the SECRET value inside that script
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
