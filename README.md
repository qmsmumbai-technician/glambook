# GlamBook — setup

Same pattern as Kaarigar: PWA, Firebase Firestore backend, GitHub Pages hosting.

This is built as a **product you resell**, not a one-off app: one codebase, reskinned per parlour client with a fresh Firebase project each time. This is a template — nothing here is deployed publicly until you follow the steps below for a specific client.

## How the app is organized
- **Home screen** — parlour logo, name, contact number at top; a grid of main service category icons below.
- **Category screen** — tapping a category goes straight to its itemized menu: grouped sections (e.g. under Hair Services: Hair Cut, Hair Colouring, Hair Treatment), each listing individual services with an inline price field.
- **Prices** — anyone can type a price directly into the field next to each service; no login needed. ⚠️ **Important limitation right now:** prices are saved to `localStorage`, meaning they only persist on the device that entered them. If you set a price on your phone, a customer opening the app on their phone won't see it — they'll see "Set price" blank again. This is fine for demoing the UI to a parlour owner, but before real customers use it, prices need to move to Firestore (shared, cross-device) instead. Flag this to me when you're ready for that step.
- **Booking flow** — tapping a service row (not the price field) opens the booking form (choose home/salon, date, time of day, contact details).
- **Admin panel** (`/#/admin`) — six sections:
  - **Bookings** — confirm/cancel customer booking requests (Firestore, shared/cloud).
  - **Client Details** — save clients (name, code, mobile, birthday, anniversary). Stored only on this device (`localStorage`) — won't show up if you open the admin panel on a different phone.
  - **Special Discount** — set festival/anniversary discount text (e.g. "10%" or "₹200"), stored locally, for your own reference.
  - **Client History** — look up a client by code, see their saved details and past bills.
  - **Bill Generation** — enter a client code, services taken, and total; saves to that client's history and can send the bill via WhatsApp or SMS.
  - **Reminder** — write a message and send it to a client (by mobile or code) via WhatsApp or SMS.

### About the "Send" buttons (WhatsApp/SMS)
A plain web app can't silently auto-send SMS or WhatsApp messages — there's no browser permission for that without a paid gateway (Twilio for SMS, WhatsApp Business API for WhatsApp, both needing a backend server and per-message cost). What's built instead: tapping **Send via WhatsApp** or **Send via SMS** opens that app with your message pre-typed to the client's number — one more tap in WhatsApp/Messages actually sends it. If you want true one-tap-from-GlamBook silent sending later, that's a real feature but needs a paid API integration — let me know if you want to go there.

## Selling to a new parlour — checklist
For each new client, touch only these:
1. **`brand-config.js`** — app name, tagline, contact info, colors, logo. This is the only file with the "look" of the app.
2. **`categories-config.js`** — the service catalog: main categories, their groups, and items under each. Prices can be left blank ("Set price") and filled in live in the app.
3. **`firebase-config.js`** — a fresh Firebase project per client (don't share one client's data with another).
4. **`manifest.json`** — update `name`, `short_name`, `background_color`, `theme_color` to match. (Can't be driven by `brand-config.js` — the browser reads this file before any JS runs.)
5. **`icon-192.png` / `icon-512.png`** — the client's logo, or a placeholder mark if they don't have one yet.
6. Push to a new GitHub repo (or a new branch), turn on Pages, done.

Nothing else needs to change — routing, booking logic, and the admin panel are shared.

## 1. Firebase project
1. Go to console.firebase.google.com → Create project (or reuse an existing one).
2. Add a Web app → copy the config object into `firebase-config.js`, replacing the placeholders.
3. Enable **Firestore Database** (start in production mode).
4. Enable **Authentication → Email/Password** → Users → add one user (any email/password — this is never shown to customers). Copy that email + password into `brand-config.js` under `adminAccess.firebaseEmail` / `firebasePassword`.
5. In `brand-config.js`, also set `adminAccess.phone` (a private number, different from the public `contactPhone`) and `adminAccess.pin` (a PIN you'll remember). Entering that exact phone + PIN on the app's Sign In screen opens the Admin Panel.
6. Firestore → Rules → paste in the contents of `firestore.rules`. Read the note at the bottom before you rely on it for real customer data.

**How Admin sign-in actually works:** typing your `adminAccess.phone` + `adminAccess.pin` on the Sign In screen silently logs you into Firebase using the email/password from step 4, then takes you to `/#/admin`. The PIN is just a friendlier front door — Firestore's real security still runs on that Firebase login underneath. Since this is all client-side code, someone who inspects the page source could technically find the PIN, so don't treat it as strong security — it's there to stop casual customers from wandering into Admin, not to stop a determined attacker.

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
