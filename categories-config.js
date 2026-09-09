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
//
// A category can optionally have an "image" field — a square
// photo used on both the home screen tile (with the name
// overlaid at the bottom) and as a banner at the top of that
// category's own screen. Omit it for categories that don't
// have one yet; they just fall back to the plain icon tile.
// ============================================================

const icon = {
  hair: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><path d="M20 5 8.5 12 20 19"/><path d="M8.5 12 4 12"/></svg>`,
  skin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c3 3.5 6 7.2 6 10.5a6 6 0 1 1-12 0C6 10.2 9 6.5 12 3Z"/><path d="M12 21v-4"/></svg>`,
  grooming: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10c3-4 7-6 9-6M4 14c3 4 7 6 9 6"/><path d="M13 4 21 12 13 20"/></svg>`,
  hands: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 12V5a1.5 1.5 0 0 1 3 0v6M11 11V4a1.5 1.5 0 0 1 3 0v7M14 11.5V6a1.5 1.5 0 0 1 3 0v9c0 4-2.5 7-6 7s-6-2-7-5l-1.5-4A1.4 1.4 0 0 1 5 11a1.4 1.4 0 0 1 2 .3L8 13"/></svg>`,
  makeup: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h5l1 4-3.5 3.5V21h-2v-10.5L6 7l1-4h2Z"/></svg>`,
  body: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c-4 3-6 5-6 9a6 6 0 0 0 12 0c0-4-2-6-6-9Z"/><path d="M12 12c1.5 1.5 1.5 3.5 0 5"/></svg>`,
  mahendi: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11Z"/><path d="M9 14c1 1 2 1 3 0s2-1 3 0"/><circle cx="12" cy="10" r="0.6" fill="currentColor" stroke="none"/></svg>`,
};

// mode: "home" | "salon" | "both" — controls which booking-location
// options show up for that item. Defaults to "both" if omitted.
//
// A group's "name" can be left as "" (empty string) for items that
// sit directly under the category with no sub-heading of their own —
// e.g. Hands & Feet has "Manicure" and "Pedicure" as bare items, with
// only "Body Treatment" as an actual named group underneath.

export const categories = [
  {
    id: "hair",
    name: "Hair Services",
    icon: icon.hair,
    image: "category-hair.jpg",
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
    image: "category-skin.jpg",
    groups: [
      {
        name: "Facial & Clean-ups",
        items: [
          { id: "fruit-facial", name: "Fruit Facial", price: null },
          { id: "anti-de-tan-treatment", name: "Anti/De-Tan Treatment", price: null },
        ],
      },
      {
        name: "Luxury Skin Rituals like O3+",
        items: [
          { id: "hydra-hydration", name: "Hydra/Hydration", price: null, mode: "salon" },
          { id: "brightening", name: "Brightening", price: null, mode: "salon" },
          { id: "anti-aging", name: "Anti-Aging", price: null, mode: "salon" },
        ],
      },
      {
        name: "Bleaching",
        items: [
          { id: "bleach-face", name: "Face", price: null },
          { id: "bleach-neck", name: "Neck", price: null },
          { id: "bleach-full-body", name: "Full Body", price: null },
        ],
      },
    ],
  },
  {
    id: "grooming",
    name: "Grooming & Hair Removal",
    icon: icon.grooming,
    image: "category-grooming.jpg",
    groups: [
      {
        name: "Threading",
        items: [
          { id: "threading-eyebrow", name: "Eyebrow", price: null },
          { id: "threading-upper-lip", name: "Upper Lip", price: null },
        ],
      },
      {
        name: "Waxing",
        items: [
          { id: "wax-honey", name: "Honey Wax", price: null },
          { id: "wax-rica-roll", name: "Rice & Roll", price: null },
          { id: "wax-sugar", name: "Sugar", price: null },
        ],
      },
    ],
  },
  {
    id: "hands-feet",
    name: "Hands & Feet",
    icon: icon.hands,
    image: "category-hands-feet.jpg",
    groups: [
      {
        name: "",
        items: [
          { id: "manicure", name: "Manicure", price: null },
          { id: "pedicure", name: "Pedicure", price: null },
        ],
      },
      {
        name: "Body Treatment",
        items: [
          { id: "gel-polish-spa", name: "Gel Polish Spa", price: null },
          { id: "relaxing-hand-foot-spa", name: "Relaxing Hand & Foot Spa", price: null },
        ],
      },
    ],
  },
  {
    id: "makeup",
    name: "Special Occasion Makeup",
    icon: icon.makeup,
    image: "category-makeup.jpg",
    groups: [
      {
        name: "Makeup & Special Package",
        items: [
          { id: "party-makeup", name: "Party Makeup", price: null },
          { id: "engagement-looks", name: "Engagement Looks", price: null },
          { id: "makeup-hair-styling", name: "Hair Styling", price: null },
        ],
      },
      {
        name: "Bridal Services",
        items: [
          { id: "pre-bridal-skin-prep", name: "Pre Bridal Skin Preparation", price: null },
          { id: "saree-draping", name: "Saree Draping", price: null },
          { id: "complete-bridal-makeup-hair", name: "Complete Bridal Makeup & Hair Styling", price: null },
          { id: "bridal-exfoliating-scrubs", name: "Exfoliating Scrubs", price: null },
        ],
      },
    ],
  },
  {
    id: "body",
    name: "Body Treatments",
    icon: icon.body,
    image: "category-body.jpg",
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
  {
    id: "mahendi",
    name: "Mahendi",
    icon: icon.mahendi,
    groups: [
      {
        name: "",
        items: [
          { id: "bridal-mahendi", name: "Bridal Mahendi", price: null },
          { id: "party-mahendi", name: "Party Mahendi", price: null },
          { id: "simple-mahendi", name: "Simple Mahendi", price: null },
          { id: "arabic-mahendi", name: "Arabic Mahendi", price: null },
          { id: "kids-mahendi", name: "Kids Mahendi", price: null },
        ],
      },
    ],
  },
];

// Academy isn't part of the categories list above (it's a separate
// Panel screen, not a bookable service category) — its home-tile
// and banner photo live here separately.
export const academyImage = "category-academy.jpg";
