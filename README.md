# GlamBook — setup

This is a **private, single-user app** for you (the parlour owner) — not a customer-facing booking site. There's no login for clients, no cloud backend, no Firebase, no Google account setup. Everything — the service menu, your appointment log, client records, discounts, bills, and reminders — lives only in this device's local storage.

## How it works
1. **Open the app → PIN screen.** Enter the PIN set in `brand-config.js` (`appPin`) to get in. Tap the lock icon in the header any time to re-lock it.
2. **Home screen** — your logo, name, contact number up top; a grid of service categories below (Hair, Skincare, Grooming, etc.).
3. **Tap a category** → itemized menu grouped the way you specified (e.g. Hair Cut / Hair Colouring / Hair Treatment). Tap the price field next to any item to set or edit it — saved instantly.
4. **Tap a service row** (not the price box) → opens a form to log a booking: client name, mobile, date, time of day, salon/home, notes. This is YOU recording an appointment (a client called, walked in, etc.) — not a client booking themselves.
5. **Panel icon** (top right, grid icon) → six tools:
   - **Bookings** — everything logged from step 4; cancel any of them.
   - **Client Details** — save clients (name, code, mobile, birthday, anniversary).
   - **Special Discount** — festival / anniversary discount notes, for your own reference.
   - **Client History** — look up a client by code, see their saved bills.
   - **Bill Generation** — log a bill against a client code, then send it via WhatsApp or SMS.
   - **Reminder** — write a message and send it to a client (by mobile or code) via WhatsApp or SMS.
   - **Backup & Restore** — export everything to a `.json` file you can save elsewhere; restore from that file if you ever switch phones or lose data.

## About the "Send" buttons (WhatsApp/SMS)
A plain web app can't silently auto-send SMS or WhatsApp messages — there's no browser permission for that without a paid gateway (Twilio for SMS, WhatsApp Business API for WhatsApp), both needing a backend server and per-message cost. What's built instead: tapping **Send via WhatsApp** or **Send via SMS** opens that app with your message pre-typed to the client's number — one more tap in WhatsApp/Messages actually sends it.

## Selling to a new parlour — checklist
For each new client, touch only these:
1. **`brand-config.js`** — app name, tagline, contact info, colors, logo, and `appPin` (their own PIN).
2. **`categories-config.js`** — the service catalog: categories, groups, items. Prices start blank ("Set price") and get filled in live in the app.
3. **`manifest.json`** — update `name`, `short_name`, `background_color`, `theme_color` to match.
4. **`icon-192.png` / `icon-512.png`** — the client's logo, or a placeholder mark.
5. Push to a new GitHub repo (or new branch), turn on Pages, done. No accounts to create, no consoles to configure.

## Deploy to GitHub Pages
1. Create a GitHub repo, upload all these files.
2. Repo → Settings → Pages → source = your branch, root folder.
3. Live at `https://<username>.github.io/<repo-name>/`.

## Important limitation: this is single-device only
Everything is stored in this browser's local storage. That means:
- If you clear your browser data, or switch phones, **everything is lost unless you've exported a backup** (Panel → Backup & Restore). Export regularly, especially before clearing browser data or getting a new phone.
- The app only works on the one device it's installed on. If you (or a client) ever want a second device to see the same data live, that requires a real shared backend again — not part of this build.

## What's working
- Categories → items → price editing (local)
- Booking log (local) — add, view, cancel
- Client Details, Special Discount, Client History, Bill Generation, Reminder — all local
- PIN lock on app open

## Known gaps / next steps
- No slot-clash checking on bookings (two clients could land on the same date/time-of-day).
- Bill Generation's Client Code field wasn't in your original spec — added since Client History needs a code to look up a client's bills.
- "Send" is two buttons (WhatsApp/SMS) instead of one — see explanation above, this is a real technical limit, not a design choice.
- Backup/restore is manual — nothing reminds you to do it. Worth building a periodic reminder if this becomes your daily driver.
