// categories-config.js
// ============================================================
// Service catalog: main categories (icons on the home screen).
// Tapping a category goes straight to its itemized menu —
// grouped sections, each with individual services.
//
// Prices are NOT set here — they start blank ("Price on
// request") and get filled in directly in the app via the
// inline price field on each item. Set a number here only if
// you want a default to ship with.
// ============================================================

const icon = {
  hair: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><path d="M20 5 8.5 12 20 19"/><path d="M8.5 12 4 12"/></svg>`,
  skin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c3 3.5 6 7.2 6 10.5a6 6 0 1 1-12 0C6 10.2 9 6.5 12 3Z"/><path d="M12 21v-4"/></svg>`,
  grooming: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10c3-4 7-6 9-6M4 14c3 4 7 6 9 6"/><path d="M13 4 21 12 13 20"/></svg>`,
  hands: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 12V5a1.5 1.5 0 0 1 3 0v6M11 11V4a1.5 1.5 0 0 1 3 0v7M14 11.5V6a1.5 1.5 0 0 1 3 0v9c0 4-2.5 7-6 7s-6-2-7-5l-1.5-4A1.4 1.4 0 0 1 5 11a1.4 1.4 0 0 1 2 .3L8 13"/></svg>`,
  makeup: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h5l1 4-3.5 3.5V21h-2v-10.5L6 7l1-4h2Z"/></svg>`,
  body: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c-4 3-6 5-6 9a6 6 0 0 0 12 0c0-4-2-6-6-9Z"/><path d="M12 12c1.5 1.5 1.5 3.5 0 5"/></svg>`,
};

// mode: "home" | "salon" | "both" — controls which booking-location
// options show up for that item. Defaults to "both" if omitted.

export const categories = [
  {
    id: "hair",
    name: "Hair Services",
    icon: icon.hair,
    groups: [
      {
        name: "Hair Cut",
        items: [
          { id: "hair-cut", name: "Hair Cut", price: null },
          { id: "layer-cut", name: "Layer Cut", price: null },
          { id: "trims", name: "Trims", price: null },
          { id: "blow-drying", name: "Blow Drying", price: null },
          { id: "straightening", name: "Straightening", price: null },
          { id: "setting", name: "Setting", price: null },
          { id: "styling", name: "Styling", price: null },
        ],
      },
      {
        name: "Hair Colouring",
        items: [
          { id: "global-hair-colouring", name: "Global Hair Colouring", price: null, mode: "salon" },
          { id: "root-touch-ups", name: "Root Touch-Ups", price: null, mode: "salon" },
          { id: "highlights", name: "Highlights", price: null, mode: "salon" },
        ],
      },
      {
        name: "Hair Treatment",
        items: [
          { id: "hair-spa", name: "Hair Spa", price: null },
          { id: "deep-conditioning", name: "Deep Conditioning", price: null },
          { id: "keratin", name: "Keratin", price: null, mode: "salon" },
          { id: "smoothing", name: "Smoothing", price: null, mode: "salon" },
          { id: "rebonding", name: "Rebonding", price: null, mode: "salon" },
        ],
      },
    ],
  },
  {
    id: "skin",
    name: "Skincare & Facials",
    icon: icon.skin,
    groups: [
      {
        name: "Skincare & Facials",
        items: [
          { id: "clean-up", name: "Clean-up", price: null },
          { id: "de-tan", name: "De-tan Treatment", price: null },
          { id: "hydrating-facial", name: "Hydrating Facial", price: null },
          { id: "brightening-facial", name: "Brightening Facial", price: null },
          { id: "anti-aging-facial", name: "Anti-Aging Facial", price: null },
        ],
      },
    ],
  },
  {
    id: "grooming",
    name: "Grooming & Hair Removal",
    icon: icon.grooming,
    groups: [
      {
        name: "Grooming & Hair Removal",
        items: [
          { id: "eyebrow-threading", name: "Eyebrow Threading", price: null },
          { id: "upper-lip-waxing", name: "Upper Lip Waxing", price: null },
          { id: "full-body-waxing", name: "Full-Body Waxing", price: null },
        ],
      },
    ],
  },
  {
    id: "hands-feet",
    name: "Hands & Feet",
    icon: icon.hands,
    groups: [
      {
        name: "Hands & Feet",
        items: [
          { id: "manicure", name: "Manicure", price: null },
          { id: "pedicure", name: "Pedicure", price: null },
          { id: "gel-polish", name: "Gel Polish", price: null },
          { id: "hand-foot-spa", name: "Hand & Foot Spa", price: null },
        ],
      },
    ],
  },
  {
    id: "makeup",
    name: "Special Occasion Makeup",
    icon: icon.makeup,
    groups: [
      {
        name: "Special Occasion Makeup",
        items: [
          { id: "party-makeup", name: "Party Makeup", price: null },
          { id: "engagement-makeup", name: "Engagement Makeup", price: null },
          { id: "bridal-package", name: "Bridal Package", price: null },
        ],
      },
    ],
  },
  {
    id: "body",
    name: "Body Treatments",
    icon: icon.body,
    groups: [
      {
        name: "Body Treatments",
        items: [
          { id: "body-polishing", name: "Body Polishing", price: null, mode: "salon" },
          { id: "exfoliating-scrub", name: "Exfoliating Scrub", price: null, mode: "salon" },
          { id: "body-wrap", name: "Body Wrap", price: null, mode: "salon" },
        ],
      },
    ],
  },
];
