# GlamBook — setup

Same pattern as Kaarigar: PWA, Firebase Firestore backend, GitHub Pages hosting.

This is built as a **product you resell**, not a one-off app: one codebase, reskinned per parlour client with a fresh Firebase project each time. This is a template — nothing here is deployed publicly until you follow the steps below for a specific client.

## How the app is organized
- **Home screen** — parlour logo, name, contact number at top; a grid of main service category icons below.
- **Category screen** — tapping a category shows its sub-services as a second icon grid.
- **Booking flow** — tapping a sub-service opens the booking form (choose home/salon, date, time of day, contact details).
- Admin panel (`/#/admin`) currently manages **bookings only** — confirm/cancel. Editing the service catalog is done in `categories-config.js` directly for now; we can move that into the admin panel once the catalog structure is finalized.

## Selling to a new parlour — checklist
For each new client, touch only these:
1. **`brand-config.js`** — app name, tagline, contact info, colors, logo. This is the only file with the "look" of the app.
2. **`categories-config.js`** — the service catalog: main categories (icons on the home screen) and sub-services under each. Prices can be left blank ("Price on request") until finalized.
3. **`firebase-config.js`** — a fresh Firebase project per client (don't share one client's data with another).
4. **`manifest.json`** — update `name`, `short_name`, `background_color`, `theme_color` to match. (Can't be driven by `brand-config.js` — the browser reads this file before any JS runs.)
5. **`icon-192.png` / `icon-512.png`** — the client's logo, or a placeholder mark if they don't have one yet.
6. Push to a new GitHub repo (or a new branch), turn on Pages, done.

Nothing else needs to change — routing, booking logic, and the admin panel are shared.

## 1. Firebase project
1. Go to console.firebase.google.com → Create project (or reuse an existing one).
2. Add a Web app → copy the config object into `firebase-config.js`, replacing the placeholders.
3. Enable **Firestore Database** (start in production mode).
4. Enable **Authentication → Email/Password** — this is for YOU (the owner), to log into `/admin`. Add yourself as a user under Authentication → Users.
5. Firestore → Rules → paste in the contents of `firestore.rules`. Read the note at the bottom before you rely on it for real customer data.

## 2. Deploy to GitHub Pages
1. Create a new GitHub repo, push all these files to it.
2. Repo → Settings → Pages → set source to your main branch, root folder.
3. Your app will be live at `https://<username>.github.io/<repo-name>/`.

## 3. Icons
`manifest.json` references `icon-192.png` and `icon-512.png` — add two square PNG icons with those exact names in the root folder (any beauty-themed logo/mark) so the "Add to Home Screen" prompt looks right. The app works without them, just with a blank icon.

## What's working
- Customer: browse by category → sub-service, book a slot (date + morning/afternoon/evening), view/cancel own bookings
- Owner: `/admin` — confirm/cancel bookings

## Known gaps (next steps, same as Kaarigar)
- Customer login is phone-number-only, no OTP — fine for testing, not for public launch. Add Firebase Phone Auth before going live, and update `firestore.rules` per the note in that file.
- No slot-clash prevention — two customers can pick the same date/time-of-day. Fine to start (you're confirming manually anyway), but worth adding a per-slot cap later if bookings pick up.
- No SMS/notification when a booking is confirmed — customer has to check the app.
- This is a PWA accessed via browser / "Add to Home Screen" — no Play Store submission needed or planned for this one.
- Service catalog admin editing (currently a manual edit to `categories-config.js`) can move into the `/admin` panel once you're happy with the category structure.
