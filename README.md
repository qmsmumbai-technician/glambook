# GlamBook — setup

This is a **private, single-user app** for you (the parlour owner) — not a customer-facing booking site. There's no login for clients, no cloud backend, no Firebase, no Google account setup. Everything — the service menu, client records, discounts, bills, and reminders — lives only in this device's local storage.

## How it works
1. **Open the app → PIN screen.** Enter the PIN set in `brand-config.js` (`appPin`) to get in. Tap the lock icon in the header any time to re-lock it.
2. **Home screen** — your logo, name, contact number up top; a grid of service categories below (Hair, Skincare, Grooming, etc.).
3. **Tap a category** → itemized menu grouped the way you specified (e.g. Hair Cut / Hair Colouring / Hair Treatment). Each service row has, left to right:
   - **Checkbox** — tick when a customer takes that service; adds it to a running bill.
   - **Service name** (styled as a link) — tap to open a write-up screen for that service, where you can type notes and save them. Two buttons there: **Add & Save** (saves your text and returns) and **Previous Screen** (goes back without saving).
   - **"H" checkbox** — marks whether that service is offered as a home visit. Yours to decide per service; saved instantly, no effect on billing, just a reference marker.
   - **Price field** — tap to set or edit that service's price, saved instantly.
4. **Bottom bar** appears once you've ticked at least one service, showing a running count and total — tap **Review & Bill** any time to jump to Bill Generation.
5. **Panel icon** (top right, grid icon) → seven tools:
   - **Client Details** — save clients (name, code, mobile, birthday, anniversary).
   - **Special Discount** — festival / anniversary discount notes, for your own reference.
   - **Client History** — look up a client by code, see their saved bills.
   - **Bill Generation** — shows whatever you've ticked from the category menus, with a live subtotal. Enter the client code, add **Additional Charges** if any (a flat ₹ amount, added after subtotal), then a **Discount** ("10%" or "₹200") if you're giving one — Final Total updates live as you fill these in. Remove anything with the ✕. Tap **Save Bill** to record it, **Discard** to clear everything without saving, or **Confirm & Send** to save and open WhatsApp/SMS with the itemized bill ready to send. Selections clear automatically after saving/sending/discarding, ready for the next customer.
   - **Reminder** — write a message and send it to a client (by mobile or code) via WhatsApp or SMS.
   - **Backup & Restore** — export everything to a `.json` file you can save elsewhere; restore from that file if you ever switch phones or lose data.
   - **Academy** — a separate price list for training/course purposes. Shows every service across all categories with its own price field (independent of the regular customer price) and a **"D"** field for course duration (free text — "2-3 Month", etc.).

## About the "Send" buttons (WhatsApp/SMS)
A plain web app can't silently auto-send SMS or WhatsApp messages — there's no browser permission for that without a paid gateway (Twilio for SMS, WhatsApp Business API for WhatsApp), both needing a backend server and per-message cost. What's built instead: tapping **Send via WhatsApp** or **Send via SMS** opens that app with your message pre-typed to the client's number — one more tap in WhatsApp/Messages actually sends it.

## Selling to a new parlour — checklist
For each new client, touch only these:
1. **`brand-config.js`** — app name, tagline, contact info, colors, logo, and `appPin` (their own PIN).
2. **`categories-config.js`** — the service catalog: categories, groups, items. Prices start blank ("Set price") and get filled in live in the app.
3. **`manifest.json`** — update `name`, `short_name`, `background_color`, `theme_color` to match.
4. **`icon-192.png` / `icon-512.png`** — the client's logo, or a placeholder mark.
5. Turn on Pages for that new repo (see below), done. No accounts to create, no consoles to configure.

## Deploy to GitHub Pages

### First time only: set up your template
1. Create a GitHub repo, upload all these files — this becomes your master copy.
2. Repo → Settings → check **"Template repository"**.
3. That's it — you never manually upload all 8 files again after this.

### For every new parlour after that
1. Go to your template repo → green **"Use this template"** button (top of the repo page) → **"Create a new repository"**.
2. Name it for that client, create it — this instantly copies all 8 files into the new repo, no file-by-file upload needed.
3. Edit just the 4 files listed in the checklist above (brand, categories, manifest, icons) for that client.
4. New repo → Settings → Pages → source = your branch, root folder.
5. Live at `https://<username>.github.io/<new-repo-name>/`.

(If you'd rather not use a template — e.g. you're on a plan or account type without it — the older path still works: create a blank repo and upload all the files manually each time.)

## Generating an installable .apk (no Play Store)
You can hand a client an actual installable file instead of a link, using **PWABuilder** (pwabuilder.com, free, by Microsoft):

1. Make sure the client's site is already live on GitHub Pages (previous section) — PWABuilder packages the *live* site, not local files.
2. Confirm `icon-192.png` and `icon-512.png` actually exist in the repo (see checklist above) — PWABuilder needs these for the app icon.
3. Go to pwabuilder.com, paste in the client's GitHub Pages URL.
4. It scans the manifest and service worker and flags anything missing — fix those first if any show up.
5. Choose **Android** → let it generate a signing key (or supply your own) → download the package.
6. You get a `.apk` file. Send it to the client however you like (WhatsApp, email, USB) — no Play Store account, no app review, no listing.

**What this actually is:** a thin Android wrapper ("Trusted Web Activity") that loads the live GitHub Pages site inside an app-like shell — it's not a fully bundled offline app. It needs internet on first load; the service worker's caching helps after that, same as the installed PWA already behaves.

**What the client will see:** since this isn't from the Play Store, Android shows an **"install from unknown sources"** prompt the first time — normal for any sideloaded app, one tap to allow.

**One per client:** the APK bakes in that specific GitHub Pages URL, so each client (their own repo + their own live URL) needs their own APK generated separately — one APK can't serve multiple client sites.

## Backup reminders
The home screen watches how long it's been since your last export (`brand.backupReminderDays`, default 3 days). When it's overdue, a banner appears at the top with a one-tap **Back up now** button — tap it to go straight to Backup & Restore, or the **×** to dismiss it for this session (it'll reappear next time you reopen the app). This isn't a fully automatic cloud backup like WhatsApp's — a plain web app can't silently upload files without a real backend integration — but it means you never have to remember to check, only to tap when reminded.

## Important limitation: this is single-device only
Everything is stored in this browser's local storage. That means:
- If you clear your browser data, or switch phones, **everything is lost unless you've exported a backup** (Panel → Backup & Restore). Export regularly, especially before clearing browser data or getting a new phone.
- The app only works on the one device it's installed on. If you ever want a second device to see the same data live, that requires a real shared backend — not part of this build.

## What's working
- Categories → items → price editing (local)
- Per-service write-up notes (local)
- "H" home-service marker per service (local)
- Tick services as customers take them → running bill total (bottom bar)
- Bill Generation with Additional Charges + Discount + Discard
- Academy — separate price + duration list for training purposes
- Client Details, Special Discount, Client History, Reminder — all local
- Backup & Restore (now includes H flags, Academy prices/durations)
- PIN lock on app open

## Known gaps / next steps
- Bill Generation's Client Code field wasn't in your original spec — added since Client History needs a code to look up a client's bills.
- "Send" is two buttons (WhatsApp/SMS) instead of one — see explanation above, this is a real technical limit, not a design choice.
- Backup/restore is manual — nothing reminds you to do it. Worth building a periodic reminder if this becomes your daily driver.
