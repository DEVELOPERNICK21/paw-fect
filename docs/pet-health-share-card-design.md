# Pet Health Share Card — Design Spec

**Status:** Approved 2026-05-11 — proceeding to implementation
**Owner:** TBD
**Target version:** v1 (this spec). A v1.1 spec covers per-pet deep-link landing pages with public OG previews.

### Resolved open questions

1. **Deworming completions trigger the celebration modal?** No. v1 trigger list stays tight (series-final, Rabies, first-ever).
2. **Card language?** English-only in v1.
3. **Install URL?** `paw-fect.vercel.app/download` — confirmed existing marketing page at `web/app/(marketing)/download/page.tsx`.

---

## 1. Purpose

Give every Paw-fect user a one-tap way to produce a beautiful, shareable PNG of their pet's identity + current health snapshot, optimized for Instagram Stories and WhatsApp DMs.

This is the project's single highest-leverage growth feature for v1: pet content goes viral on identity ("look at my Bruno"), not utility ("my dog needs a shot"). The card foregrounds identity and tucks utility into the body.

## 2. Non-goals (v1)

- A public, per-pet deep-link landing page (`/p/<token>`) — deferred to v1.1.
- A medical-record-style PDF export (Option B in mockups) — deferred to a future paid-tier feature.
- A compact WhatsApp-optimized format (Option C in mockups) — deferred to v1.1 once we have share-rate data on Option A.
- Saving the card directly to the device camera roll — system share sheet covers this implicitly on both platforms.
- Server-side image rendering. Card is rendered on-device only.
- Tracking who opened / installed from a shared card. Requires deep-link infra, deferred to v1.1.

## 3. User-visible behavior

### 3.1 Entry point A — Pet Profile hero

A new "Share health card" button appears in or near the existing `PetProfileHeroCard` on the Pet Profile screen. Always available, regardless of pet health state. Tapping it navigates to the share screen for that pet.

### 3.2 Entry point B — Post-task-completion celebration modal

After a user marks a smart health task as complete (existing `MarkSmartHealthRecordDone` use case path), if the completion qualifies as a "milestone moment", a modal appears with:

- Headline: e.g. "Bruno just completed his puppy series 🎉" or "Bruno is on track 💛"
- Preview thumbnail of the share card
- Primary action: "Share this moment" → goes to the share screen with that pet pre-loaded
- Secondary action: "Not now" → dismisses, no further nag this session

A completion qualifies as a milestone moment when **any** of the following is true (computed by a new helper in the records domain, see §6.5):

1. It is the final dose of a series vaccination (e.g. last DHPP / FVRCP puppy dose).
   - Headline copy: "Bruno just completed his puppy series 🎉"
2. It is a Rabies booster.
   - Headline copy: "Bruno is fully covered against rabies 🛡️"
3. It is the first ever completed health task for that pet.
   - Headline copy: "Bruno is on track 💛"

This is a deliberately tight definition so the modal feels like a celebration, not a recurring nag. Once-per-pet-per-session dedup is enforced (see §6.4) so users never see two modals back-to-back for the same pet. We can broaden the trigger list later based on dismiss-rate telemetry (added when analytics ships).

### 3.3 Share screen

A new full-screen RN screen renders the card centered on a neutral background, with:

- The card itself (Option A layout, see §4).
- A primary "Share" button below the card.
- A back button.
- A subtle "Looking good?" caption above the share button (no heavy copy).

Tapping "Share":

1. Captures the card view via `react-native-view-shot` → temp file URI.
2. Opens the system share sheet with `Share.share({ url, message })`.
3. Caption / message string (see §6.6) accompanies the image in apps that support it.

On capture failure: in-place toast, no navigation change.
On share sheet dismissal: silent, expected behavior.

## 4. Card visual specification (Option A)

Sized for a fixed canvas of **1080 × 1350 px** (4:5, the densest IG-Story / IG-Feed safe rectangle that also looks correct in WhatsApp DM previews).

### 4.1 Anatomy (top → bottom)

1. **Hero band** — full-bleed, dark green (`#1a3a2a`), ~38% of card height.
    - Pet avatar: 160 × 160 circle, centered, 4 px border in lighter brand green.
       - Source: pet photo when present; species-emoji-on-colored-circle fallback (reuse existing `petPhotoPlaceholder` util).
    - Pet name: bold, ~56 px, white, centered, below avatar with 16 px gap.
    - Subline: `<Breed> · <age display>` in light brand green (`#82c9a8`), ~26 px, centered. If no DOB: just `<Breed>`. If no breed: just `<age display>`. If neither: hide subline.
2. **Health snapshot section** — light surface, ~50% of card height.
    - Section label `HEALTH SNAPSHOT` in caps, tracked, secondary text color.
    - Up to **3 health items** as rows. Each row: label on left, status chip on right.
       - Status chips:
          - `Due in N days` — amber background (`#fff3cd` / `#7a5800`)
          - `Done ✓` — green background (`#d4edda` / `#1a5e30`)
          - `Overdue` — red background (`#fde0e0` / `#8a1a1a`)
       - Item selection (see §6.3 for full ordering): next upcoming (1) + most recent completed (up to 2).
    - Empty state: if the pet has no smart-health records yet, replace the 3 rows with a single centered block:
       - "Just added Bruno to Paw-fect 🎉"
       - "Vaccines and deworming auto-scheduled below"
       - This still produces a shareable artifact and turns the empty-state into a viral moment.
3. **Footer band** — ~12% of card height, light separator above.
    - Left: `paw-fect.vercel.app/get` in secondary text color, small.
    - Right: `🐾 Paw-fect` in brand-dark color, slightly larger.

### 4.2 Visual fidelity vs. provided mockup

The on-device card must visually match the provided Option A mockup (see `mockups/pet_health_card_mockups.html`, Option A block) within these tolerances:

- Colors: exact hex match.
- Typography: pet name uses the existing project bold font (`fontFamilies.bold`); subline uses regular; section label uses medium. Sizes are scaled up vs. the mockup to fit a 1080-wide canvas, but proportions match.
- Spacing: maintain the visual rhythm of the mockup (centered hero, breathing room between sections, snug rows in the snapshot).
- Rounded corners: 24 px radius on the card itself (the mockup's `border-radius-lg`).

## 5. Architecture

Respects `AGENTS.md` clean-architecture rules: UI → Store → UseCase → Repository → DataSource. Domain stays React-free.

### 5.1 New files

```
src/modules/pets/
├── domain/
│   ├── models/
│   │   └── PetHealthCardViewModel.ts                # pure data shape
│   ├── usecases/
│   │   ├── BuildPetHealthCardViewModel.ts           # the use case
│   │   └── __tests__/
│   │       └── BuildPetHealthCardViewModel.test.ts
│   └── utils/
│       └── petDobDisplay.ts                          # extended: new formatPetAgeShareLabel()
├── ui/
│   ├── components/
│   │   └── share/
│   │       ├── PetHealthShareCard.tsx                # renderable RN view
│   │       └── PetHealthShareCard.styles.ts
│   └── screens/
│       └── PetHealthCardShareScreen.tsx              # hosts ViewShot + share
└── petComposition.ts                                  # extended to wire the use case

src/modules/records/
└── domain/
    └── utils/
        ├── isMilestoneCompletion.ts                   # qualifies a completion (§3.2)
        └── __tests__/
            └── isMilestoneCompletion.test.ts

src/modules/app/ui/components/
└── celebration/
    └── ShareMomentModal.tsx                           # post-task celebration modal
```

### 5.2 Modified files

- `src/modules/pets/ui/components/profile/PetProfileHeroCard.tsx` — add "Share health card" button.
- `src/modules/records/store/smartHealthRecordStore.ts` — on successful `markDone`, if `isMilestoneCompletion` returns true and no modal has been shown this session for this pet, emit a one-shot signal (see §6.4) that the app shell observes to mount the modal.
- `src/app/navigation/RootNavigator.tsx` — register the new `PetHealthCardShareScreen` route.
- `package.json` — add `react-native-view-shot`.
- iOS: `Podfile` will pull the new pod automatically on next `pod install`.

### 5.3 New dependency

- `react-native-view-shot` (latest stable on RN 0.84).
- No other new deps. `Share` is from `react-native` core.

## 6. Data and logic

### 6.1 `PetHealthCardViewModel` shape

```ts
export interface PetHealthCardViewModel {
  pet: {
    name: string;
    breedLabel: string | null;       // "Golden Retriever" | null
    ageLabel: string | null;          // "2 yrs 4 mo" | null
    photoSource: ImageSourcePropType; // real photo OR species-emoji-on-circle fallback
  };
  snapshot:
    | { kind: 'items'; items: PetHealthCardItem[] }   // up to 3
    | { kind: 'empty'; speciesEmoji: string };
  footer: {
    urlLabel: string;       // "paw-fect.vercel.app/get" in v1
    brandLabel: string;     // "🐾 Paw-fect"
    shareUrl: string;       // full URL passed to Share.share message (v1: same as above; v1.1: deep-link)
  };
}

export interface PetHealthCardItem {
  label: string;            // "Rabies booster"
  status: 'done' | 'due_in' | 'overdue';
  detail: string;           // "Done ✓" | "Due in 11 days" | "Overdue"
}
```

`shareUrl` is a separate field from `urlLabel` so we can change the share message URL (v1.1 deep link) without changing what's printed on the card visually, or vice versa.

### 6.2 `BuildPetHealthCardViewModel` use case

Inputs:

- `petId: string`
- A `PetReadPort` (read pet by id) — already exists or trivially extracted from `PetRepository`.
- A `SmartHealthRecordReadPort` (read smart health records for a pet) — already exists or extracted from `SmartHealthRecordRepository`.

Output: `PetHealthCardViewModel`.

Logic:

1. Read pet. If not found → throw `PetNotFoundError`.
2. Read smart health records for the pet.
3. Compute `breedLabel` from pet.breed (null if blank).
4. Compute `ageLabel` from pet.dob via a **new** pure helper `formatPetAgeShareLabel(dob)` added to the **existing** `src/modules/pets/domain/utils/petDobDisplay.ts` file (sibling to the existing `formatPetAgeLabel` that returns long-form "2 Years Old" — share card needs the compact "2 yrs 4 mo" form):
    - `< 4 wks` → `"N wks"` (drop to weeks when months would round to 0)
    - `< 12 mo` → `"N mo"`
    - `≥ 12 mo with M = 0` → `"N yrs"`
    - `≥ 12 mo with M > 0` → `"N yrs M mo"`
    - dob blank / future / invalid → returns null.
5. Compute `photoSource` from pet.photo if present, otherwise `petPhotoPlaceholder(pet.species)`.
6. Compute snapshot (see §6.3).
7. Compose footer with the v1 constant URL.

Pure function. No store reads. No side effects. Trivially testable.

### 6.3 Snapshot item ordering rule

The snapshot shows **up to 3** items (matching §4.1 #2), selected as:

1. **Slot 1 (required)**: The single next upcoming or overdue health task for this pet, from `GetNextSmartHealthTask` logic. If overdue, status is `overdue`; otherwise `due_in`.
2. **Slot 2 and Slot 3**: The two most-recent completed health tasks within the last 365 days, newest first, status `done`.

If only 1 completed task exists, the card shows 2 items. If none, the card shows just the upcoming. If the pet has no records at all (no upcoming, no completed), use the empty-state branch from §4.1 #2.

### 6.4 Post-completion modal trigger

The records store already orchestrates `markDone`. After a successful mark-done:

1. Synchronously compute `isMilestoneCompletion(record, allRecordsForPet)`.
2. If true, push a one-shot `{ petId, recordId, kind: 'series_complete' | 'rabies_booster' | 'first_ever' }` event onto a small in-memory queue exposed by `smartHealthRecordStore`.
3. A new lightweight hook in the app shell (next to `HomeDashboardInvalidationHub` style) consumes that queue and mounts `ShareMomentModal` exactly once per event.
4. The modal shows its preview thumbnail by calling `BuildPetHealthCardViewModel` (cheap, pure).
5. Once-per-session dedup is by petId — we don't show two modals for the same pet in the same JS session, even if multiple milestones trigger back-to-back.

This keeps the records store free of UI concerns (still adheres to architecture rules — the store emits a domain event, the UI subscribes).

### 6.5 `isMilestoneCompletion` rules (pure helper, in records domain)

Returns `true` iff:

- The completed record is the final dose of a series schedule (its `seriesIndex === seriesTotal - 1`), OR
- The completed record is a Rabies booster (any pet age), OR
- This is the first completed health record ever for this pet (count of completed for petId === 1 right after this mark-done).

Three independent test cases. Easy unit tests.

### 6.6 Share message string

```
{petName} on Paw-fect 🐾
Next up: {nextLabel} ({nextDetail})
Track your pet's health: {shareUrl}
```

When the snapshot is empty-state, the message is:

```
Just added {petName} to Paw-fect 🐾
Auto-scheduled vaccines and deworming for {speciesLabel}.
Track your pet's health: {shareUrl}
```

`shareUrl` is `https://paw-fect.vercel.app/download` in v1 (the `/download` page already exists at `web/app/(marketing)/download/page.tsx`). Single source of truth in `src/shared/constants/releaseBackend.ts` (existing file), extended with a new exported `SHARE_INSTALL_URL` constant derived from `RELEASE_BACKEND_BASE_URL`.

### 6.7 Image capture parameters

`react-native-view-shot`:

- `format: 'png'`
- `quality: 1.0`
- `result: 'tmpfile'`
- `width: 1080, height: 1350` (logical; the captured view is laid out at this size off-screen or in an absolutely-positioned hidden render layer to ensure pixel parity across devices)
- `snapshotContentContainer: false`

The card render component is mounted at exactly its target dimensions, so capture is 1:1. The visible "preview" of the same component on screen is laid out at a scaled-down size via `transform: [{ scale }]` for visual presentation only.

## 7. Error and edge handling

| Case | Behavior |
|---|---|
| Pet not found | Use case throws, share screen shows inline error toast and back-navigates |
| Pet has no photo | Species-emoji-on-circle fallback via `petPhotoPlaceholder` |
| Pet has no DOB | Drop age line; show breed only |
| Pet has no breed | Drop breed line; show age only |
| Pet has neither | Hide subline entirely; pet name carries the hero |
| Pet has zero smart-health records | Empty-state snapshot block (§4.1 #2) |
| ViewShot capture rejects | Inline toast: "Couldn't generate card — try again"; no navigation |
| Share API resolves with no activity | Silent (normal user dismissal) |
| Share API rejects with error | Toast: "Couldn't open share sheet" |
| User on iOS with no installed share targets | iOS handles this — no special code |
| Permissions: photo library | Not required; we share a temp file URI through the system sheet, not save to library |
| Notifications permission for celebration modal | Not required; the modal is in-app, not a push |
| Modal triggers while user is on a non-app screen (e.g. settings) | Defer mount until app returns to a "modal-safe" screen (Home, Pet Profile, Health Records). Implementation: the consumer hook checks the current route name |

## 8. Testing

Required tests:

- `BuildPetHealthCardViewModel.test.ts`
   - Full pet (photo, breed, dob, upcoming + 2 completed) → all 3 items, no empty state.
   - Pet missing dob → ageLabel null, no crash.
   - Pet missing breed → breedLabel null.
   - Pet missing both → subline data absent.
   - Pet with no records → empty-state branch.
   - Pet with overdue task → slot 1 status is `overdue`.
- `isMilestoneCompletion.test.ts`
   - Last dose of a series → true.
   - Mid-series dose → false.
   - Rabies booster → true.
   - Generic adult deworming with prior completions → false.
   - First-ever completed record for a pet → true.
- `formatPetAgeLabel.test.ts`
   - `< 12 mo`, `= 12 mo`, `> 12 mo with 0 months`, `> 12 mo with non-zero months`, `null dob`.

No automated visual / screenshot test for the card itself in v1. Manual QA on:

- iPhone (real device) iOS 17+
- Android emulator API 33+
- Both light and dark device themes (the card itself is fixed-theme by design; verify the surrounding share screen UI renders correctly in both)
- Real photo and emoji fallback
- Empty state
- All three milestone modal trigger types

## 9. Privacy notes

- The card is generated on-device and only leaves the device when the user actively shares it through the system sheet.
- The card content contains pet name, breed, age, and health snapshot labels (e.g. "Rabies booster — Done"). No medical notes, no attachments, no user PII (email, phone), no exact dates beyond "Due in N days" / "Done" status chips. Specifically:
    - **No raw birth date.** Only the derived age label.
    - **No vet name, no clinic, no attachment thumbnails.**
- The footer URL is a static install link in v1 with no tracking parameters. In v1.1 the deep-link token will be a non-guessable random string and the public page will require the token (no enumeration).

## 10. Effort estimate

4 working days total. Decomposed in the implementation plan (next step):

- Day 1: `react-native-view-shot` install, domain model + use case + tests, `formatPetAgeLabel` helper + tests.
- Day 2: `PetHealthShareCard` component visual polish to match mockup, photo/emoji fallback, all edge variants.
- Day 3: `PetHealthCardShareScreen` + ViewShot wiring + Share.share + Pet Profile entry button.
- Day 4: `isMilestoneCompletion` helper + tests, records store milestone event, `ShareMomentModal`, app shell hook, route-safety check, iOS + Android manual QA pass.

## 11. Forward-compatibility hooks (for v1.1 deep-link)

To make v1.1 a one-line code change rather than a refactor:

- `PetHealthCardViewModel.footer.shareUrl` is already separate from `urlLabel`. v1.1 swaps the value, not the structure.
- The card visually renders `urlLabel`, so the visible URL on the printed card can stay short (`paw-fect.vercel.app`) while the share message URL becomes a long token.
- The share-message-builder function (§6.6) accepts `shareUrl` as input, not as a constant.

## 12. Open questions for reviewer

All resolved — see "Resolved open questions" at the top of this spec.
