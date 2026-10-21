# Pawfect ASO listing pack (App Store + Google Play)

_Prepared 21 Oct 2026. Limits were checked against Apple and Google documentation; every string below is length-verified by script. Nothing here claims a feature the app does not ship, and nothing claims vet validation._

## 0. What is live today and what is wrong with it

| Finding | Why it matters | Fix |
|---|---|---|
| **iOS description mentions "home screen widgets"** | The iOS widget extension is not in the Xcode project, so iOS has no widgets. Inaccurate listing text risks rejection under Guideline 2.3 (accurate metadata). | Remove it now (this pack's description has none). Re-add after iOS widgets ship. |
| **No App Store subtitle** | 30 free characters of indexed text, shown in search results. | Add subtitle (section 1). |
| **Weekly and monthly Care+ are both $0.99** | A monthly plan priced the same as weekly cannibalises itself; nobody picks monthly. | Re-tier in App Store Connect and Play (see section 8). |
| Promo text is generic | It isn't indexed, but it is the first line shoppers read. | Section 1 options. |
| Google Play listing could not be read publicly | Not verified; assume it needs the same pass. | Section 3. |
| App icon is dog-only (cat owners are half your market) | Icon is the biggest conversion lever in search results. | Section 6. |

## 1. App Store (iOS)

### Name (30)
Keep: **Pawfect: Pet Care & Reminders** (29/30). It already carries the brand plus two searchable phrases. Alternatives: `Pawfect: Dog & Cat Care` (23), `Pawfect: Pet Vaccine Tracker` (28).

### Subtitle (30): 5 options

| # | Subtitle | Length | Reasoning |
|---|---|---|---|
| 1 | Vaccine & deworming schedules | 29/30 | Benefit + two core keywords; none repeated from the name. **Recommended.** |
| 2 | Dog & cat health tracker | 24/30 | Species keywords for people who search "dog" or "cat" first. |
| 3 | Never miss a vaccine date | 25/30 | Pure benefit; strongest emotional hook (test vs #1). |
| 4 | Puppy & kitten vaccine plans | 28/30 | Targets the new-pet-parent audience. |
| 5 | Vaccines, worming & records | 27/30 | UK/AU version: "worming" is the local word. |

### Keyword field (100 bytes, comma-separated, no spaces, no repeats of name/subtitle words)

- **en-US** (`96/100` bytes):

```
dog,cat,puppy,kitten,tracker,health,records,vet,rabies,booster,medicine,walk,groom,planner,owner
```

- **en-GB / en-AU** (`99/100` bytes), uses "worming":

```
dog,cat,puppy,kitten,vaccination,worming,tracker,health,records,vet,rabies,booster,medicine,planner
```

Words already in the name or subtitle (pawfect, pet, care, reminders, vaccine, deworming, schedules) are left out on purpose: Apple combines name + subtitle + keywords, so repeating them wastes bytes. Plurals and singulars count as the same word, so use one.

### Promotional text (170): 3 options (editable without a new review)

1. Add your dog or cat once and get a vaccine and deworming plan built for their age. Gentle reminders, health records, free to start.  _(131/170)_
2. Never miss a booster again. Pawfect builds your pet's vaccine and deworming schedule and reminds you before it's due. Free to start.  _(132/170)_
3. Puppy, kitten or senior: the right care schedule, reminders and records in one calm app. Free to start on iPhone and iPad.  _(122/170)_

Recommended: #2 (loss-aversion hook that matches the "never miss" promise).

### Description (2101/4000)
The first two lines show before "more", so they carry the promise. Contains the required auto-renew disclosure and Terms/Privacy links.

```
Never miss a vaccine, deworming dose or vet visit again.

Pawfect builds a care plan for your dog or cat from their age and species, reminds you before things are due, and keeps their health records in one calm place. Setup takes about two minutes.

WHAT YOU GET
• Vaccine and deworming schedules built around your pet's age, species and lifestyle
• Reminders for vaccines, deworming, medicine, walks, grooming and vet visits
• A Today view that shows what's due, what's coming up and what's overdue
• Health records: log vaccines, treatments and vet visits in one timeline
• Pet profiles with photo, breed and birthday
• A shareable pet health card for milestone moments
• Light and dark mode

HOW IT WORKS
1. Add your pet: name, species, birthday and lifestyle.
2. Get your plan: Pawfect lays out what your pet needs, and when.
3. Stay on track: gentle reminders, one-tap done, reschedule when plans change.

FREE TO START
The free plan covers one pet with schedules, reminders and three months of history. No credit card needed.

UPGRADE WHEN YOU NEED MORE
Care+: up to 3 pets, unlimited history, offline access with sync, wellness score and extra care tasks. Billed weekly, monthly or annually.
Family: up to 10 pets, everything in Care+, and priority support.

BUILT FOR
• New puppy and kitten parents who want a clear plan
• Busy owners who rely on reminders
• Homes with more than one pet

IMPORTANT
Pawfect is a scheduling and record-keeping tool. It is not a medical device or a substitute for professional veterinary care. Schedules are informational and based on commonly used protocols. Always confirm vaccines, dosing and timing with your veterinarian.

SUBSCRIPTION DETAILS
Care+ and Family are auto-renewing subscriptions billed to your Apple ID. Payment is charged at confirmation of purchase. Subscriptions renew automatically unless cancelled at least 24 hours before the end of the current period. Manage or cancel anytime in your Apple ID Account Settings. Prices vary by country.

Terms of Use: https://paw-fect.vercel.app/terms
Privacy Policy: https://paw-fect.vercel.app/privacy
```

### What's New template
```
NEW: {headline}

• {change_1}
• {change_2}
• Bug fixes and smoother reminders

Loving Pawfect? A rating helps other pet parents find us. Thank you!
```

## 2. App Store creative: screenshots, header, search asset, preview

### Screenshot sizes (Apple creative-asset specs)

- **iPhone:** 1320×2868 (6.9"), plus 1206×2622 and 1290×2796 accepted. If the UI is the same, provide the largest and App Store Connect scales down. PNG/JPEG, no transparency, up to 10.
- **iPad (required, your app supports iPad):** 2064×2752 (13") and 1488×2266 / 1668×2420 (11").

### Storyboard: 8 frames, ordered by user value (frames 1-3 must sell on their own)

| # | Headline (≤6 words) | App screen to capture | Visual treatment |
|---|---|---|---|
| 1 | Never miss a vaccine again | Home: next milestone + today's care | Warm orange gradient, phone centred, mascot peeking over the top-right corner |
| 2 | Your pet's plan in 2 minutes | Onboarding: personalised plan reveal | Show the plan bullets large; pet name visible; mascot 'proud' |
| 3 | Know exactly what's due next | Health tab: overdue / due soon / upcoming | Colour-coded states highlighted with callout arrows |
| 4 | Gentle reminders that fit your day | Reminder list + a lock-screen notification | Real notification banner overlapping the phone edge |
| 5 | Every pet, one calm view | Pet switcher with two pets (dog + cat) | Both mascots; pet photos visible |
| 6 | Today's care, one tap each | Day view / care path with progress | Show progress ring + streak toast |
| 7 | Celebrate every milestone | Milestone modal + share health card | Mascot 'celebrating', card preview angled |
| 8 | Free to start. Upgrade anytime. | Plans / paywall screen | Three plan cards; no price claims beyond store prices |

Style: brand orange `#F28C28` to warm `#FDF1E5` gradient, app font for headlines (large, bold), one idea per frame, supporting line ≤12 words, real in-app screens only (no invented data). Capture in light mode on a real device; add one dark-mode frame as a variant test.

### New: App Store header and search-results assets (live since 5 Oct 2026)

Your screenshot shows the **Header and Search Results** section. Verified specs (Apple creative assets page):

| Asset | Image | Video |
|---|---|---|
| **Product page header** | 21:9, exactly **3840×1646** (JPG/PNG) or 16:9 **5244×2950** PNG | 21:9, 3840×1646, 5-30 s, 30/60 fps, .mov/.m4v/.mp4 |
| **Search results** | 3:2, **1920×1280 to 3840×2560** (JPG/PNG) or 16:9 5244×2950 PNG | 3:2, same range, 5-30 s, 30/60 fps |

No alpha channel. Per third-party coverage (not on Apple's page): they appear on iOS/iPadOS 27 and later, header video is muted by default and loops, and they sit alongside screenshots rather than replacing them. Check the live Apple page before relying on those details.

**Creative concepts (we need new content for these):**

1. **Header (21:9), "Never miss what your pet needs next."** Dog and cat mascots at left, phone at centre-right showing the Home dashboard with a due-soon milestone, short headline at far left, big safe margins (the edges crop on small devices). Light version and dark version.
2. **Search-results asset (3:2), "Vaccine reminders for dogs & cats."** Shoppers see it *before* tapping, so use only the mascot's happy face, five words of text max, and a single orange accent. Brief this one first.
3. **Header video (loop, 8-12 s, muted-first):** mascot waves, a phone slides in, "Rabies due in 3 days" card pulses, the check animates, mascot celebrates, loop back. No voice-over; captions burned in.

### App preview video (portrait)

Specs (Apple): 15-30 s, accepted portrait resolution **886×1920** for current iPhones (1200×1600 for iPad), H.264, max 30 fps, up to 500 MB, up to 3 per device size, audio as stereo AAC. Poster frame defaults to 5 s in. Previews always show before screenshots. Confirm how Apple treats a silent audio track when you upload.

| Time | Shot | On-screen caption (readable with sound off) |
|---|---|---|
| 0-3 s | Hook: calendar with a missed date, then the app Today screen | "Never miss a vaccine again" |
| 3-8 s | Onboarding: pick dog/cat, name, birthday, plan reveal | "Your pet's plan in 2 minutes" |
| 8-14 s | Health tab: overdue / due soon / upcoming states | "Know what's due next" |
| 14-19 s | Reminder notification, mark done | "Gentle reminders. One tap." |
| 19-24 s | Pet switcher with two pets | "Every pet, one calm view" |
| 24-28 s | Milestone celebration + share card | "Celebrate every milestone" |
| 28-30 s | Logo + store badge | "Free to start" |

## 3. Google Play

### Title (30): **Pawfect: Pet Care & Reminders** (29/30)

### Short description (80): 5 options

1. Dog & cat vaccine, deworming and daily care reminders. Free to start.  _(69/80)_
2. Never miss a pet vaccine. Schedules, reminders & records for dogs and cats.  _(75/80)_
3. Pet vaccine & deworming schedules, reminders and records. Free to start.  _(72/80)_
4. Your dog or cat's care plan: vaccines, deworming, reminders & records.  _(70/80)_
5. Puppy & kitten vaccine schedules, reminders and health records. Free.  _(69/80)_

Recommended: #1 (clear, two audiences, free-to-start). Test #2 against it in a store listing experiment.

### Full description (1856/4000)
Play indexes this text, so the real search phrases are used naturally (no stuffing).

```
Never miss a pet vaccine again.

Pawfect is a pet care app for dogs and cats. Add your pet once and get a vaccine and deworming schedule built around their age and species, reminders before anything is due, and health records you can find in seconds.

PET VACCINE REMINDER AND SCHEDULE
Puppy vaccination schedule, kitten vaccine schedule, adult boosters and rabies: see what's due, what's coming up and what's overdue on one Today screen.

DEWORMING REMINDER
Deworming timed to your pet's age and lifestyle, with a reminder before every dose.

DAILY PET CARE REMINDERS
Walks, medicine, grooming and vet visits, all in one reminder list, so nothing slips on a busy week.

PET HEALTH RECORDS
Log vaccines, treatments and vet visits in one timeline for your dog or cat. Add a photo, breed and birthday to every pet profile.

SHARE THE MILESTONES
Create a pet health card to share when your pet finishes a vaccination series or gets a rabies booster.

FREE TO START
The free plan covers one pet with schedules, reminders and three months of history. No credit card needed.

CARE+ AND FAMILY
Care+ adds up to 3 pets, unlimited history, offline access with sync, a wellness score and extra care tasks (weekly, monthly or annual). Family covers up to 10 pets and adds priority support. Subscriptions are billed through Google Play and renew automatically until you cancel in Play Store > Subscriptions.

BUILT FOR
New puppy and kitten parents, busy owners who rely on reminders, and homes with more than one pet.

IMPORTANT
Pawfect is a scheduling and record-keeping tool, not a medical device or a substitute for professional veterinary care. Schedules are informational and based on commonly used protocols. Always confirm vaccines, dosing and timing with your veterinarian.

Terms: https://paw-fect.vercel.app/terms
Privacy: https://paw-fect.vercel.app/privacy
```

### Assets
- Icon 512×512 PNG (32-bit, ≤1024 KB). Feature graphic **1024×500** JPEG/24-bit PNG, no alpha. Screenshots 2-8, 9:16, min 1080 px wide (portrait 1080×1920 or larger). Promo video must be a public YouTube link.
- **Feature graphic concept:** orange gradient, left: "Never miss a vaccine again" + a "Free to start" pill; right: phone showing Home with the mascot peeking from behind. Keep text in the central 70% (Play overlays a play button when a video is attached).
- **What's New (Play, 500):**

```
{headline}
• {change_1}
• {change_2}
• Bug fixes and smoother reminders
```

## 4. Positioning

**Statement:** For new and busy dog and cat owners, Pawfect is the pet care app that builds your pet's vaccine and deworming schedule for you, so you always know what's due next.

**Core promise:** "Always know what your pet needs next."

| Angle | Message | Use for |
|---|---|---|
| A. Peace of mind | "Never miss a vaccine again." | Screenshot 1, promo text, Play short description |
| B. Done for you | "Your pet's plan in 2 minutes." | Screenshot 2, subtitle #1 |
| C. One calm place | "Every pet, one calm view." | Multi-pet custom product page |

## 5. Icon directions

Your current icon (white dog face on orange) is bold and high-contrast, which is a good base. Concerns: it is dog-only for a dog + cat app, and the file in the repo has a glow and black background baked in, so make sure the uploaded 1024×1024 is a plain full-bleed square (Apple rounds the corners; no transparency).

| Concept | Idea | Rationale |
|---|---|---|
| **A. Duo** | Dog and cat faces side by side, white on orange | Speaks to both audiences; direct evolution of the current icon |
| **B. Paw + tick** | White paw with a check mark in the pad | Says "reminders done" at a glance; species-neutral |
| **C. Mascot** | The new mascot's happy face on orange | Builds a character the whole product can use (celebrations, empty states) |

**Competitor check still needed:** screenshot the top 10 results for "pet vaccine reminder", "dog care", "cat care" and "pet health tracker" and see which colours dominate. If blue/green dominate, orange already stands out; I could not verify this visually.

## 6. In-app purchase display names and descriptions

| Product | Display name (≤30) | Description (≤45) |
|---|---|---|
| Care+ Weekly | Care+ Weekly (12/30) | 3 pets, full history, offline sync (34/45) |
| Care+ Monthly | Care+ Monthly (13/30) | 3 pets, full history, offline sync (34/45) |
| Care+ Annual | Care+ Annual (12/30) | 3 pets, full history, offline sync (34/45) |
| Family Monthly | Family Monthly (14/30) | Up to 10 pets, priority support (31/45) |
| Family Annual | Family Annual (13/30) | Up to 10 pets, priority support (31/45) |

(Apple field limits of 30 and 45 characters are from memory; confirm in App Store Connect.)

## 7. Localization (English-only app, global audience)

Same app text, different vocabulary per market. Add English (U.K.), English (Australia) and English (Canada) localizations in App Store Connect; keyword fields are per localization, so each can carry different terms (which storefronts index which localization is widely documented by ASO tools but varies, so verify per market).

| Market | Use | Avoid |
|---|---|---|
| US, CA | deworming, vaccine, veterinarian, puppy shots | "jabs", "worming" |
| UK, AU, NZ | worming, vaccination, vet, jabs, walkies | "deworming" as the lead word |
| India | deworming, vaccination, vet | brand-specific protocols |

Title stays `Pawfect: Pet Care & Reminders` everywhere (brand consistency). Next languages after English, once vet review is done: Spanish, Portuguese (Brazil), Hindi.

## 8. Pricing fix (store)

Live US prices today: Care+ Weekly $0.99, Monthly $0.99, Annual $14.99; Family Monthly $2.99, Annual $29.99. Your India plan is ₹49 / ₹149 / ₹1,499. Suggest keeping the same ratios worldwide: Weekly ≈ price/4.3 of monthly, annual ≈ 10 × monthly. Example US tiers: Weekly $0.99, Monthly $2.99 (or $1.99), Annual $14.99. Change in both stores and RevenueCat together.

## 9. Growth plan

### A/B tests (in order)

| # | Test | Hypothesis | Where |
|---|---|---|---|
| 1 | First 3 screenshots: angle A vs B | "Never miss" converts better than "2 minutes" | App Store Product Page Optimization; Play Store listing experiment |
| 2 | Subtitle #1 vs #2 | Benefit beats species keywords | Release-by-release (App Store), Play short description experiment |
| 3 | Icon: current dog vs Duo | Dog + cat widens appeal | Both |
| 4 | Search-results asset (new) | A face + 5 words lifts tap-through | App Store Connect |

Caveat: with low traffic, tests take weeks. Don't call a winner under a few thousand impressions per variant.

### Custom product pages (match to audiences / ad campaigns)
- **New puppy/kitten parents:** "Puppy vaccination schedule" angle, frame 2 first.
- **Multi-pet homes:** "Every pet, one calm view", frame 5 first.
- **Forgetful / busy owners:** "Never miss a booster", frame 1 and 4 first.

### Ratings and reviews
- Ask for a rating only after a happy moment: right after the user completes their **third care task**, or after they tap "Share this moment" on a milestone. Never during onboarding, never after an error. Apple's system prompt is shown at most 3 times per 365 days (verify current limit).
- **Reply templates:**
  1. _Bug:_ "Sorry about that, and thank you for telling us. Could you email support with your phone model so we can fix it? We read every message."
  2. _Price:_ "Thanks for the honest feedback. The free plan covers one pet with schedules and reminders, and paid plans only add more pets and history. We're always listening on pricing."
  3. _Missing feature:_ "Thank you, that's useful. We've added it to our list. Reminders for vaccines and deworming are our focus right now."

### Next 3 months (in-app events and content)
- **Early Nov: fireworks season** (Diwali, Bonfire Night): event "Fireworks week: keep your pet's routine steady", with mascot tips (routine reminders only, no medical advice).
- **Dec: boarding and travel season:** event "Holiday boarding check": review your pet's vaccine dates before you travel.
- **Jan: new-year pet health reset:** event "Set your pet's year": add every annual booster as a reminder.

### Weekly metrics
| Metric | Where | Why |
|---|---|---|
| Impressions to product-page-view rate | App Store Connect, Play Console | Icon, title and search asset quality |
| Page view to install rate | Both consoles | Screenshot and description quality |
| Keyword rankings (top 10 terms) | ASO tool (not set up yet) | Metadata effect |
| Install to first reminder created | PostHog | Activation (your PRD goal ≥60%) |
| Paywall view to paid, trial to paid | RevenueCat | Revenue |

## 10. Ship-first checklist

1. **Remove "home screen widgets" from the iOS description** (accuracy).
2. Add the iOS **subtitle** and the keyword field (section 1).
3. Replace the promo text.
4. Fix the $0.99 weekly/monthly pricing in both stores and RevenueCat.
5. Capture real screenshots from a device (storyboard, section 2), including **iPad 13"**.
6. Rewrite the Play short and full descriptions (section 3).
7. Upload the header and search-results assets once designed (search asset first).
8. Add the rating prompt in the app.
9. Add the English (UK/AU/CA) localizations.
10. Start test #1.

## 11. Open questions for you
1. Is the share health card free or paid (the plan catalog says sharing is not a paid feature)?
2. Will you set up a **store introductory offer** (e.g. 7 days free) so the trial can be advertised honestly?
3. Which final domain should Terms/Privacy links use (currently paw-fect.vercel.app)?
4. Do you want a dog+cat duo icon or the mascot icon?
5. When will iOS widgets ship (so the description can mention them)?
6. What does the live Google Play listing say? I could not read it.
7. Primary category: stay on Lifestyle (safer) or add Health & Fitness as the secondary?

## 12. Finished header and search-results graphics

Files in `docs/aso/assets/` (sources in `assets/src/`, mascot SVGs in `assets/mascot/`):

| File | Size | Slot | Notes |
|---|---|---|---|
| `header-21x9.png` / `.jpg` | 3840×1646 | Product page header (21:9) | No alpha channel; text kept inside the central area |
| `search-3x2.png` / `.jpg` | 3000×2000 | Search results (3:2, allowed range 1920×1280 to 3840×2560) | Large faces and a 5-word headline so it reads at thumbnail size |

Both use the app's own font (Plus Jakarta Sans), brand orange `#F28C28`, and the placeholder mascot art. Re-render after the illustrator delivers the final mascot: edit the HTML in `assets/src/` and run the same headless render at the sizes above.

Upload path: App Store Connect → the version page → Header and Search Results → Upload (or the Asset Library) → submit for approval. Apple reviews assets separately from the app build.
