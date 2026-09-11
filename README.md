# GlamBook — full reference

This is a **private, single-user app** for you (the parlour owner) — not a customer-facing booking site. There's no login for clients, no cloud backend, no Firebase, no Google account setup. Everything — the service menu, client records, discounts, bills, and reminders — lives only in this device's local storage.

This file is the complete reference for everything about this project — how the app works, how to deploy it, how to package it as an installable `.apk`, and how to fix every issue we've actually run into along the way. Come back to this whenever you need it instead of trying to remember all of it.

## Contents
1. [How the app works](#how-the-app-works)
2. [About the "Send" buttons](#about-the-send-buttons-whatsappsms)
3. [Selling to a new parlour — checklist](#selling-to-a-new-parlour--checklist)
4. [Deploy to GitHub Pages](#deploy-to-github-pages)
5. [Generating an installable .apk](#generating-an-installable-apk-no-play-store)
6. [Package ID & signing key — critical rules](#package-id--signing-key--critical-rules)
7. [Removing the browser address bar (Digital Asset Links)](#removing-the-browser-address-bar-digital-asset-links)
8. [Troubleshooting](#troubleshooting)
9. [Backup reminders](#backup-reminders)
10. [Single-device limitation](#important-limitation-this-is-single-device-only)
11. [What's working / known gaps](#whats-working)

---

## How the app works

### 1. PIN screen
Two PINs work here (`brand-config.js`):
- `masterPin` — your own PIN. Always works, on every device, forever — never starts or is affected by any trial. Use this whenever you're demoing from your own phone.
- `appPin` — the client/demo PIN. If `trial.enabled` is `true`, typing this PIN on a device for the first time starts a countdown **on that device only** (stored locally on that device, not shared anywhere). Once `trial.days` have passed since that first use, that device shows a "Trial period ended" message instead of unlocking — your master PIN still works on it regardless. Set `trial.enabled` to `false` once a client actually buys, and rebuild their APK — the lock is gone for good. If you rebuild with the same Package ID and signing key, installing the new APK over the old one is treated as an *update*, so the client keeps all their existing data.

The PIN screen also shows, top to bottom: a small app icon + "My Parlour" label (top), the PIN entry form, then a bottom block with the business name, a larger company logo, the developer credit line, and a copyright line. The header (logo/name/Home/Panel/Lock icons) is hidden entirely on this screen — `display: none`, not just invisible — so it doesn't eat vertical space.

Tap the lock icon in the header any time to re-lock (does not affect or reset the trial countdown).

### 2. Home screen
Your logo, name, contact number up top; a grid of service category tiles below (photo tile if that category has an `image` set in `categories-config.js`, otherwise a plain icon tile). Categories built so far: Hair Services, Skincare & Facials, Grooming & Hair Removal, Hands & Feet, Special Occasion Makeup, Body Treatments, Mahendi, plus the Academy tile.

### 3. Category screen
Tap a category → itemized menu grouped the way you specified (e.g. Hair Cut / Hair Colouring / Hair Treatment). Each service row has, left to right:
- **Checkbox** — tick when a customer takes that service; adds it to a running bill.
- **Service name** (styled as a link) — tap to open a write-up screen for that service, where you can type notes and save them. Two buttons there: **Add & Save** (saves your text and returns) and **Previous Screen** (goes back without saving).
- **"H" checkbox** — marks whether that service is offered as a home visit. Yours to decide per service; saved instantly, no effect on billing, just a reference marker.
- **Price field** — tap to set or edit that service's price, saved instantly.

### 4. Bottom bill bar
Appears once you've ticked at least one service, showing a running count and total — tap **Review & Bill** any time to jump to Bill Generation.

### 5. Panel (grid icon in header)
- **Client Details** — save clients (name, mobile number — used as their unique ID, birthday, anniversary).
- **Special Discount** — festival / anniversary discount notes, for your own reference.
- **Client History** — look up a client by code, see their saved bills.
- **Bill Generation** — shows whatever you've ticked from the category menus, with a live subtotal. Enter the client code, add **Additional Charges** if any (a flat ₹ amount, added after subtotal), then a **Discount** ("10%" or "₹200") if you're giving one — Final Total updates live as you fill these in. Remove anything with the ✕. Tap **Save Bill** to record it, **Discard** to clear everything without saving, or **Confirm & Send** to save and open WhatsApp/SMS with the itemized bill ready to send. Selections clear automatically after saving/sending/discarding, ready for the next customer.
- **Reminder** — write a message and send it to a client (by mobile or code) via WhatsApp or SMS.
- **Backup & Restore** — export everything to a `.json` file you can save elsewhere; restore from that file if you ever switch phones or lose data.
- **Academy** — a separate price list for training/course purposes. Shows every service across all categories with its own price field (independent of the regular customer price) and a **"D"** field for course duration (free text — "2-3 Month", etc.). Each service also has a checkbox — tick it to add that service to the running bill using its **Academy price**, distinct from a regular sale of the same service.
- **Upcoming Occasions** — lists any saved client whose birthday or anniversary falls within the next 7 days, soonest first. One-tap **WhatsApp**/**SMS** buttons with a ready-made greeting (anniversary messages include your saved Client Anniversary Discount, if set). No limit on how many times you can message the same person — nothing is tracked or blocked.
- **Inventory** — two tabs, **Consumable Items** and **Non-consumable Items**. Each item has a description plus **Stock**, **Min Qty**, and **Max Qty** (2-digit fields, right-aligned above their labels). Tap **+ Add item** to add more. Whenever Stock drops below Min Qty, that number turns red and a banner appears ("N items below Min Qty — View Reorder Sheet"), leading to the **Reorder Sheet**: every low-stock item with **Item Desc.** and **Order Qty** (Min Qty − Stock), with Send via WhatsApp/SMS (opens a contact picker, since there's no saved supplier number).

---

## About the "Send" buttons (WhatsApp/SMS)
A plain web app can't silently auto-send SMS or WhatsApp messages — there's no browser permission for that without a paid gateway (Twilio for SMS, WhatsApp Business API for WhatsApp), both needing a backend server and per-message cost. What's built instead: tapping **Send via WhatsApp** or **Send via SMS** opens that app with your message pre-typed to the client's number — one more tap in WhatsApp/Messages actually sends it.

---

## Selling to a new parlour — checklist
For each new client, touch only these:
1. **`brand-config.js`** — app name, tagline, contact info, colors, logo, `appPin` (their PIN), and `trial` settings.
2. **`categories-config.js`** — the service catalog: categories, groups, items. Prices start blank ("Set price") and get filled in live in the app.
3. **`manifest.json`** — update `name`, `short_name`, `background_color`, `theme_color` to match.
4. **`icon-192.png` / `icon-512.png`** — the client's logo, or a placeholder mark.
5. **`logo.png`** — the client's company logo mark, used in the header and PIN screen.
6. Turn on Pages for that new repo (see below), done.

---

## Deploy to GitHub Pages

### First time only: set up your template
1. Create a GitHub repo, upload all these files — this becomes your master copy.
2. Repo → Settings → check **"Template repository"**.
3. That's it — you never manually upload every file again after this.

### For every new parlour after that
1. Go to your template repo → green **"Use this template"** button → **"Create a new repository"**.
2. Name it for that client — instantly copies all files into the new repo.
3. Edit the files listed in the checklist above for that client.
4. New repo → Settings → Pages → source = your branch, root folder.
5. Live at `https://<username>.github.io/<new-repo-name>/`.

---

## Generating an installable .apk (no Play Store)
Using **PWABuilder** (pwabuilder.com, free, by Microsoft):

1. Make sure the client's site is already live on GitHub Pages.
2. Confirm `icon-192.png` and `icon-512.png` exist in the repo.
3. Go to pwabuilder.com, paste in the client's GitHub Pages URL, tap **Start**.
4. On the report card, tap **Package For Stores** → **Android**.
5. Set the **Package ID** and **Signing Key** correctly — see the next section, this is the part that goes wrong most often.
6. **Download Package** → you get a `.apk` (install directly), a `.aab` (Play Store only, not needed here), and an `assetlinks.json` file.
7. Send the `.apk` to the client however you like (WhatsApp, email, USB) — no Play Store account, no app review.

**What this actually is:** a thin Android wrapper ("Trusted Web Activity" / TWA) that loads the live GitHub Pages site inside an app-like shell. It needs internet on first load; the service worker's caching helps after that.

**"Install from unknown sources"** — since this isn't from the Play Store, Android shows this prompt the first time. Normal, one tap to allow.

**"Running in Chrome" notification** — shows every time the app is opened, disappears when closed. This is standard, expected behavior for every TWA-style app (not specific to this build) — Chrome is genuinely the engine powering it under the hood, and this notification is Android's transparency requirement for that. It **cannot be removed** through PWABuilder's simple flow — doing so needs native Android Studio development, not achievable from a phone with no laptop. Not a bug, nothing to fix.

**One per client:** the APK bakes in that specific GitHub Pages URL, so each client needs their own APK generated separately.

---

## Package ID & Signing Key — critical rules
These two settings are the source of almost every APK problem we've hit. Get them right once per app and you won't see these issues again.

### Package ID
This is Android's internal, invisible identity for the app — separate from the app's display Name, and separate from the Host/Start URL (which just point at the actual website, and should never be changed).

**Rule: every single app you ever build — Kaarigar, GlamBook, and every future client's version — needs its own unique Package ID.** PWABuilder suggests a default based on your GitHub path (e.g. `io.github.yourname_reponame.twa`) — this default is *not* required, it's just a placeholder text field. Overwrite it every time.

**Naming pattern to use:**
```
com.abodedigital.glambook                    — this template/demo build
com.abodedigital.glambook.parlourname         — each real client's build
com.abodedigital.kaarigar                     — Kaarigar
```

**What happens if you reuse a Package ID by accident:** Android sees the new APK as "the same app" as whatever already has that ID installed — even under a totally different name. This shows up as an "Update this app?" prompt on install, and can fail entirely as "App not installed" if the signing keys don't also match. This is exactly what happened when GlamBook accidentally kept Kaarigar's old default Package ID.

### Signing Key
This is the actual cryptographic key that signs the APK — a completely different thing from `assetlinks.json` (see next section). Every APK, even sideloaded ones, must be signed; an unsigned APK cannot install on Android at all.

**The first time** you package an app, choose **"Create new"** — PWABuilder generates a fresh keystore file (e.g. `signing.keystore`) and a password (in `signing-key-info.txt`).

**Save both of these files somewhere permanent immediately** (Google Drive, email to yourself) — not just Downloads, which can get cleared. **Every future rebuild of that same app must reuse this exact keystore** (choose "Use existing key" / "Import" in PWABuilder and upload the saved file + password) — if you choose "Create new" again, you get a *different* signing key, which breaks `assetlinks.json` verification (the address bar reappears) and can also block reinstalling over an existing copy.

**One keystore per app** — Kaarigar and GlamBook each need their own; don't reuse one app's keystore for another.

---

## Removing the browser address bar (Digital Asset Links)
By default, a freshly packaged TWA app shows the website's URL at the top like a browser. This is Android's security check failing to find proof that the app and the website belong to the same developer. Fixing it removes the address bar permanently.

### One-time setup (per GitHub account, not per app)
1. Create a **new, separate** GitHub repo named **exactly** `<your-username>.github.io` (this is GitHub's special "root site" naming rule — different from your regular project repos like `glambook`).
2. Turn on Pages for it (Settings → Pages → branch: main, folder: / root).
3. Add a file at `.well-known/assetlinks.json` (type the full path in the "create new file" filename box — this auto-creates the folder).
4. **Also add an empty file named `.nojekyll`** at the repo root. Without this, GitHub's Jekyll processing silently hides any folder starting with a dot (like `.well-known`), and the file 404s even though it's committed correctly. This tripped us up the first time — don't skip it.

### The assetlinks.json content
This file lists every app (by Package ID + signing key fingerprint) that's allowed to load full-screen without the address bar. **One shared file covers every app on your account**, as a list:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.abodedigital.glambook",
      "sha256_cert_fingerprints": ["YOUR-GLAMBOOK-FINGERPRINT-HERE"]
    }
  },
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.abodedigital.kaarigar",
      "sha256_cert_fingerprints": ["YOUR-KAARIGAR-FINGERPRINT-HERE"]
    }
  }
]
```

**Where the fingerprint comes from:** when you choose "Create new" (or use an existing) signing key in PWABuilder, the downloaded package usually includes an `assetlinks.json` file with your app's correct fingerprint already filled in — copy that entry into the shared file above rather than typing the fingerprint by hand.

**Every time you add a new app, or change a signing key:** update this one shared file with that app's current entry. This is the file to come back to if the address bar ever reappears on any app.

### Verifying it worked
Wait about a minute after committing, then open in a browser:
```
https://<your-username>.github.io/.well-known/assetlinks.json
```
You should see the raw JSON. If you see a 404, check the `.nojekyll` file exists and try again after another minute. Once confirmed, fully close and reopen the app (swipe away from Recent Apps, not just switch away) — the address bar should be gone.

---

## Troubleshooting
Real issues we've hit, and their actual causes — check here before assuming something new is broken.

**"Update this app?" appears, but you never installed it before**
→ Package ID collision with another app already on the phone (often an old test build under a different display name). Check Settings → Apps → all apps for anything unfamiliar; uninstall it, or better, give this app its own unique Package ID (see above) so it can never collide again.

**"App not installed" after clearing cache / trying again**
→ Usually one of: (a) the Package ID conflict above, combined with a signing key mismatch, (b) you downloaded an **unsigned** package (check — the file names say "unsigned"; these cannot install at all, you need "Create new" or "Use existing key" selected under Signing, not "None"), or (c) a corrupted download — try a completely fresh download.

**Address bar shows at the top of the installed app**
→ `assetlinks.json` isn't set up, isn't live yet, or has the wrong/outdated fingerprint (most often after regenerating a signing key). See the full Digital Asset Links section above. Remember: Host/Start URL fields in PWABuilder are correct and should *not* be changed — this is a separate, backend trust-verification issue, not a wrong-URL issue.

**"Running in Chrome" notification every time you open the app**
→ Normal, expected behavior for every TWA app, not a bug. Cannot be removed through PWABuilder. See the .apk section above.

**Signing key confusion — "keystore" vs "assetlinks.json"**
→ These are different files. The keystore is the actual private key that *creates* a signature; `assetlinks.json` is a small public text file that just *states* what that signature should be. Losing the keystore means you can never produce a matching signature again for that Package ID — save it permanently, first thing, every time you generate one.

---

## Backup reminders
The home screen watches how long it's been since your last export (`brand.backupReminderDays`, default 3 days). When overdue, a banner appears at the top with a one-tap **Back up now** button, or **×** to dismiss for this session (reappears next time you reopen the app). Not a fully automatic cloud backup like WhatsApp's — a plain web app can't silently upload files without a real backend — but you never have to remember to check, only to tap when reminded.

---

## Important limitation: this is single-device only
Everything is stored in this browser's local storage. That means:
- If you clear your browser data, or switch phones, **everything is lost unless you've exported a backup** (Panel → Backup & Restore).
- The app only works on the one device it's installed on. A second device seeing the same data live would require a real shared backend — not part of this build.

---

## What's working
- Categories → items → price editing (local)
- Per-service write-up notes (local)
- "H" home-service marker per service (local)
- Tick services as customers take them → running bill total (bottom bar)
- Bill Generation with Additional Charges + Discount + Discard
- Academy — separate price + duration list for training purposes
- Client Details, Special Discount, Client History, Reminder — all local
- Backup & Restore
- PIN lock with master/client PIN + optional 3-day trial
- Inventory with low-stock flagging + Reorder Sheet
- Installable `.apk` via PWABuilder, with the address bar removed via Digital Asset Links

## Known gaps / next steps
- Bill Generation's Client Code field wasn't in the original spec — added since Client History needs a code to look up a client's bills.
- "Send" is two buttons (WhatsApp/SMS) instead of one — real technical limit, not a design choice.
- Backup/restore is manual — nothing reminds you beyond the home-screen banner.
- "Running in Chrome" notification cannot be suppressed without native Android development.
