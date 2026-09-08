// categories-config.js
// ============================================================
// This is where the service catalog lives: main categories
// (shown as icons on the home screen) and the sub-services
// under each (shown when a category is tapped).
//
// Add price/duration once you've finalized them — leave price
// as null and it'll show "Price on request" instead of ₹0.
// ============================================================

const icon = {
  hair: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><path d="M20 5 8.5 12 20 19"/><path d="M8.5 12 4 12"/></svg>`,
  skin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c3 3.5 6 7.2 6 10.5a6 6 0 1 1-12 0C6 10.2 9 6.5 12 3Z"/><path d="M12 21v-4"/></svg>`,
  grooming: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10c3-4 7-6 9-6M4 14c3 4 7 6 9 6"/><path d="M13 4 21 12 13 20"/></svg>`,
  hands: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 12V5a1.5 1.5 0 0 1 3 0v6M11 11V4a1.5 1.5 0 0 1 3 0v7M14 11.5V6a1.5 1.5 0 0 1 3 0v9c0 4-2.5 7-6 7s-6-2-7-5l-1.5-4A1.4 1.4 0 0 1 5 11a1.4 1.4 0 0 1 2 .3L8 13"/></svg>`,
  makeup: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h5l1 4-3.5 3.5V21h-2v-10.5L6 7l1-4h2Z"/></svg>`,
  body: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c-4 3-6 5-6 9a6 6 0 0 0 12 0c0-4-2-6-6-9Z"/><path d="M12 12c1.5 1.5 1.5 3.5 0 5"/></svg>`,
};

export const categories = [
  {
    id: "hair",
    name: "Hair Services",
    icon: icon.hair,
    subservices: [
      { id: "haircut-styling", name: "Haircut & Styling", price: null, duration: "", mode: "both" },
      { id: "hair-coloring", name: "Hair Coloring", price: null, duration: "", mode: "salon" },
      { id: "highlights", name: "Highlights", price: null, duration: "", mode: "salon" },
      { id: "straightening-rebonding", name: "Straightening & Rebonding", price: null, duration: "", mode: "salon" },
      { id: "hair-spa", name: "Hair Spa", price: null, duration: "", mode: "both" },
    ],
  },
  {
    id: "skin",
    name: "Skincare & Facials",
    icon: icon.skin,
    subservices: [
      { id: "clean-up", name: "Clean-up", price: null, duration: "", mode: "both" },
      { id: "de-tan", name: "De-tan Treatment", price: null, duration: "", mode: "both" },
      { id: "hydrating-facial", name: "Hydrating Facial", price: null, duration: "", mode: "both" },
      { id: "brightening-facial", name: "Brightening Facial", price: null, duration: "", mode: "both" },
      { id: "anti-aging-facial", name: "Anti-Aging Facial", price: null, duration: "", mode: "both" },
    ],
  },
  {
    id: "grooming",
    name: "Grooming & Hair Removal",
    icon: icon.grooming,
    subservices: [
      { id: "eyebrow-threading", name: "Eyebrow Threading", price: null, duration: "", mode: "both" },
      { id: "upper-lip-waxing", name: "Upper Lip Waxing", price: null, duration: "", mode: "both" },
      { id: "full-body-waxing", name: "Full-Body Waxing", price: null, duration: "", mode: "both" },
    ],
  },
  {
    id: "hands-feet",
    name: "Hands & Feet",
    icon: icon.hands,
    subservices: [
      { id: "manicure", name: "Manicure", price: null, duration: "", mode: "both" },
      { id: "pedicure", name: "Pedicure", price: null, duration: "", mode: "both" },
      { id: "gel-polish", name: "Gel Polish", price: null, duration: "", mode: "both" },
      { id: "hand-foot-spa", name: "Hand & Foot Spa", price: null, duration: "", mode: "both" },
    ],
  },
  {
    id: "makeup",
    name: "Special Occasion Makeup",
    icon: icon.makeup,
    subservices: [
      { id: "party-makeup", name: "Party Makeup", price: null, duration: "", mode: "both" },
      { id: "engagement-makeup", name: "Engagement Makeup", price: null, duration: "", mode: "both" },
      { id: "bridal-package", name: "Bridal Package", price: null, duration: "", mode: "both" },
    ],
  },
  {
    id: "body",
    name: "Body Treatments",
    icon: icon.body,
    subservices: [
      { id: "body-polishing", name: "Body Polishing", price: null, duration: "", mode: "salon" },
      { id: "exfoliating-scrub", name: "Exfoliating Scrub", price: null, duration: "", mode: "salon" },
      { id: "body-wrap", name: "Body Wrap", price: null, duration: "", mode: "salon" },
    ],
  },
];
