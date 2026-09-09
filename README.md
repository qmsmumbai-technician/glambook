# GlamBook — setup

This is a **private, single-user app** for you (the parlour owner) — not a customer-facing booking site. There's no login for clients, no cloud backend, no Firebase, no Google account setup. Everything — the service menu, client records, discounts, bills, and reminders — lives only in this device's local storage.

## How it works
1. **Open the app → PIN screen.** Enter the PIN set in `brand-config.js` (`appPin`) to get in. Tap the lock icon in the header any time to re-lock it.
2. **Home screen** — your logo, name, contact number up top; a grid of service categories below (Hair, Skincare, Grooming, etc.).
3. **Tap a category** → itemized menu grouped the way you specified (e.g. Hair Cut / Hair Colouring / Hair Treatment). Each service has a checkbox, a name, and a price field:
   - **Checkbox** — tick when a customer takes that service; adds it to a running bill.
   - **Service name** (styled as a link) — tap to open a write-up screen for that service, where you can type notes and save them. Two buttons there: **Add & Save** (saves your text and returns) and **Previous Screen** (goes back without saving).
   - **Price field** — tap to set or edit that service's price, saved instantly.
4. **Bottom bar** appears once you've ticked at least one service, showing a running count and total — tap **Review & Bill** any time to jump to Bill Generation.
5. **Panel icon** (top right, grid icon) → six tools:
   - **Client Details** — save clients (name, code, mobile, birthday, anniversary).
   - **Special Discount** — festival / anniversary discount notes, for your own reference.
   - **Client History** — look up a client by code, see their saved bills.
   - **Bill Generation** — shows whatever you've ticked from the category menus, with a live subtotal. Enter the client code, add a discount ("10%" or "₹200") if you're giving one, remove anything with the ✕ if needed. Save it, or tap Confirm & Send to save and open WhatsApp/SMS with the itemized bill ready to send. Selections clear automatically after saving/sending, ready for the next customer.
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
- The app only works on the one device it's installed on. If you ever want a second device to see the same data live, that requires a real shared backend — not part of this build.

## What's working
- Categories → items → price editing (local)
- Per-service write-up notes (local)
- Tick services as customers take them → running bill total (bottom bar)
- Client Details, Special Discount, Client History, Bill Generation, Reminder — all local
- Backup & Restore
- PIN lock on app open

## Known gaps / next steps
- Bill Generation's Client Code field wasn't in your original spec — added since Client History needs a code to look up a client's bills.
- "Send" is two buttons (WhatsApp/SMS) instead of one — see explanation above, this is a real technical limit, not a design choice.
- Backup/restore is manual — nothing reminds you to do it. Worth building a periodic reminder if this becomes your daily driver.
