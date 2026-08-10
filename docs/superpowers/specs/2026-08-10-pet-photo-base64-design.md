# Pet Photo Base64 Design

**Date:** 2026-08-10  
**Status:** Approved for planning  
**Approach:** Opaque `Pet.photo` string + `PetPhotoEncoder` port; store compressed JPEG data URI on Firestore pet doc (no Firebase Storage)

## Goal

Let users add an optional pet photo from **camera or gallery** on Add/Edit Pet, persist it to **Firebase Firestore** as a compressed **base64 data URI** on the existing pet document, and keep the pipeline **backend-swappable** so a later move to Storage/S3/URLs does not change UI or the `Pet` model.

## Decisions

| Topic | Choice |
| --- | --- |
| Source | Camera **and** gallery |
| Required? | **Optional** — can save without a photo |
| Storage | Firestore field `Pet.photo` as `data:image/jpeg;base64,...` |
| Firebase plan | Works on **Spark (free)**; no paid plan required for base64 strings |
| Architecture | Approach 1 — domain port + use case; UI does not encode or talk to Firebase |
| Display | Existing `resolvePetAvatarSource` (`{ uri: photo }`) — data URIs supported |
| Size budget | Max edge ~512px, JPEG quality ~0.7; reject/re-encode if payload ≳700KB |

## Current baseline

- `Pet.photo?: string` already on domain model and Firestore serialize path
- `AddPetScreen` holds `photoUri` and passes it into create/update, but avatar UI only shows species icons (camera badge styles exist unused)
- No image picker dependency; no Firebase Storage
- Pets written via `PetRemoteDataSource` → `users/{userId}/pets/{petId}`

## Architecture & data flow

```
UI (AddPetScreen)
  → pick camera/gallery (local file URI)
  → PreparePetPhoto use case
       → PetPhotoEncoder (infra: resize + JPEG + base64)
       → returns opaque string: "data:image/jpeg;base64,..."
  → createPetProfile / updatePet (existing)
       → Pet.photo = that string
       → Firestore pet doc (existing PetRemoteDataSource)
```

### Contracts (backend-swappable)

| Piece | Role |
| --- | --- |
| `Pet.photo?: string` | Opaque display string (data URI today; URL later) — **no model change** |
| `PetPhotoEncoder` (domain port) | `encode(localUri: string): Promise<string>` |
| `FirestorePetPhotoEncoder` (infra) | Resize ~512px, JPEG ~0.7, return data URI under size budget |
| Later swap | New implementation returns `https://...` — UI + `Pet` unchanged |

Wire encoder via `petComposition`. Store/UI call `PreparePetPhoto` before create/update. Domain must not import image-picker or Firebase.

## UI & picker UX

**Where:** Add/Edit Pet avatar (reuse existing `cameraBadge` / `profileImage` styles).

**Behavior:**

- Tap avatar / camera badge → action sheet: **Take photo** | **Choose from library** | **Cancel**
- If a photo is already set: also **Remove photo** (clears to species placeholder)
- After pick: show local preview immediately; on save, run `PreparePetPhoto` then persist via existing create/update
- While encoding/saving: disable save + show loading (reuse `isSaving`)
- Permissions denied: short message + open Settings

**Libraries:**

- `react-native-image-picker` for camera + gallery
- Prefer picker options (`includeBase64`, `maxWidth` / `maxHeight` / `quality`) inside the encoder implementation so we avoid an extra image-manipulator package when sufficient; port still wraps so encoding strategy can change later

**Native permissions:**

- iOS: `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription` (and Photo Library Add if required by picker version)
- Android: camera + photo/media permissions as required by the chosen picker version / target SDK

## Errors & limits

| Case | Behavior |
| --- | --- |
| User cancels picker | No change |
| Permission denied | Message + open Settings |
| Encode fails / too large | Show error; do not save broken photo |
| Firestore write fails | Existing pet save error path |

**Firestore free tier note:** Base64 does not require Blaze. Risk is document size (1MB hard limit) and storage/read bandwidth from larger pet docs — mitigated by compression budget above.

## Testing

- Unit: encoder builds `data:image/jpeg;base64,...`; oversize rejected; `PreparePetPhoto` returns opaque string
- `resolvePetAvatarSource` accepts data URI
- No full E2E camera in CI

## Scope

### In

1. Domain port `PetPhotoEncoder` + `PreparePetPhoto` use case
2. Infra encoder using image picker compression/base64 (or equivalent) with size guard
3. Wire through `petComposition`
4. Add/Edit Pet UI: picker action sheet, preview, remove photo, encode-on-save
5. iOS/Android permission strings and Android manifest entries as required
6. Unit tests for prepare/encode size rules and avatar source with data URI

### Out

- Firebase Storage / CDN
- User profile photos
- Multi-photo galleries
- Interactive crop UI (resize only)
- Migrating existing remote placeholder URLs beyond current `isPetPhotoPlaceholderUri` handling

## Success criteria

- User can take or choose a pet photo (or skip) on Add/Edit Pet
- Chosen photo appears in preview and on profile/home avatars after save
- `photo` stored on Firestore pet doc as compressed data URI (or cleared when removed)
- Saving without a photo still works
- Swapping encoder to URL-based upload later requires no `Pet` model or screen contract changes

## Relation to other work

Separate from the React Native 0.86 upgrade track; do not mix unfinished upgrade/analytics work into this feature unless a dependency conflict forces a coordinated fix.
