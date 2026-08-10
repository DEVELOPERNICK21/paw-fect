# Pet Photo Base64 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users optionally pick a pet photo from camera or gallery on Add/Edit Pet, persist a compressed JPEG data URI on the Firestore pet document via a swappable encoder port, and show it everywhere `resolvePetAvatarSource` is used.

**Architecture:** Domain port `PetPhotoEncoder` + `PreparePetPhoto` use case. UI picks with `react-native-image-picker` (resize/quality at pick). Encoder validates size and returns opaque `data:image/jpeg;base64,...` for `Pet.photo`. Existing create/update + Firestore paths unchanged. Later Storage swap replaces encoder only.

**Tech Stack:** React Native 0.86, TypeScript, Zustand pet store, `@react-native-firebase/firestore`, `react-native-image-picker`, Jest.

## Global Constraints

- Photo is **optional** (camera + gallery); remove clears photo.
- Store on Firestore as `Pet.photo` data URI — **no Firebase Storage** in this plan.
- Spark/free tier: keep data URI ≲ **700_000** characters; max edge **512**, JPEG quality **0.7**.
- Domain must **not** import image-picker or Firebase.
- `Pet.photo` stays an opaque `string` (data URI today; URL later).
- Theme tokens only in UI; prefer named exports; explicit return types on exported functions.
- Spec: `docs/superpowers/specs/2026-08-10-pet-photo-base64-design.md`

---

## File map

| File | Responsibility |
| --- | --- |
| Create: `src/modules/pets/domain/ports/PetPhotoEncoder.ts` | Port + encode request type |
| Create: `src/modules/pets/domain/utils/petPhotoLimits.ts` | Size/quality constants + data-URI builder/validator |
| Create: `src/modules/pets/domain/usecases/PreparePetPhoto.ts` | Use case wrapping encoder |
| Create: `src/modules/pets/domain/usecases/__tests__/PreparePetPhoto.test.ts` | Use case unit tests |
| Create: `src/modules/pets/domain/utils/__tests__/petPhotoLimits.test.ts` | Limit helper tests |
| Create: `src/modules/pets/data/photos/FirestorePetPhotoEncoder.ts` | Validates base64 → data URI |
| Create: `src/modules/pets/data/photos/pickPetPhoto.ts` | Camera/library picker → encode request |
| Create: `src/shared/utils/__tests__/petDisplayPhoto.test.ts` | Data URI avatar resolution |
| Modify: `src/modules/pets/petComposition.ts` | Wire encoder + `preparePetPhoto` |
| Modify: `src/modules/pets/data/datasources/PetRemoteDataSource.ts` | Persist `photo: null` when clearing |
| Modify: `src/modules/pets/ui/screens/AddPetScreen.tsx` | Picker UI, preview, encode-on-save |
| Modify: `package.json` / lockfile | Add `react-native-image-picker` |
| Modify: `ios/paw_fect/Info.plist` | Camera + photo library usage strings |
| Modify: `android/app/src/main/AndroidManifest.xml` | Camera + media permissions |

---

### Task 1: Domain limits + PreparePetPhoto (TDD)

**Files:**
- Create: `src/modules/pets/domain/ports/PetPhotoEncoder.ts`
- Create: `src/modules/pets/domain/utils/petPhotoLimits.ts`
- Create: `src/modules/pets/domain/utils/__tests__/petPhotoLimits.test.ts`
- Create: `src/modules/pets/domain/usecases/PreparePetPhoto.ts`
- Create: `src/modules/pets/domain/usecases/__tests__/PreparePetPhoto.test.ts`

**Interfaces:**
- Consumes: none
- Produces:
  - `export type PetPhotoEncodeRequest = { localUri: string; base64: string }`
  - `export interface PetPhotoEncoder { encode(request: PetPhotoEncodeRequest): Promise<string> }`
  - `export const PET_PHOTO_MAX_EDGE = 512`
  - `export const PET_PHOTO_JPEG_QUALITY = 0.7`
  - `export const PET_PHOTO_MAX_DATA_URI_CHARS = 700_000`
  - `export function buildJpegDataUri(base64: string): string`
  - `export function assertPetPhotoDataUriWithinLimit(dataUri: string): void` (throws `Error` with user-safe message if over limit)
  - `export class PreparePetPhoto` with `execute(request: PetPhotoEncodeRequest): Promise<{ ok: true; photo: string } | { ok: false; errorMessage: string }>`

- [ ] **Step 1: Write the failing limit tests**

```typescript
import {
  PET_PHOTO_MAX_DATA_URI_CHARS,
  assertPetPhotoDataUriWithinLimit,
  buildJpegDataUri,
} from '../petPhotoLimits';

describe('petPhotoLimits', () => {
  it('builds a jpeg data URI', () => {
    expect(buildJpegDataUri('abc')).toBe('data:image/jpeg;base64,abc');
  });

  it('accepts a data URI under the limit', () => {
    expect(() =>
      assertPetPhotoDataUriWithinLimit(buildJpegDataUri('abc')),
    ).not.toThrow();
  });

  it('rejects a data URI over the limit', () => {
    const oversized = 'data:image/jpeg;base64,' + 'a'.repeat(PET_PHOTO_MAX_DATA_URI_CHARS);
    expect(() => assertPetPhotoDataUriWithinLimit(oversized)).toThrow(
      /too large/i,
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `yarn test -- src/modules/pets/domain/utils/__tests__/petPhotoLimits.test.ts`

Expected: FAIL (module not found)

- [ ] **Step 3: Implement limits + port**

`src/modules/pets/domain/ports/PetPhotoEncoder.ts`:

```typescript
export type PetPhotoEncodeRequest = {
  /** Local file URI from the picker (kept for a future Storage/URL encoder). */
  localUri: string;
  /** JPEG base64 without data-URI prefix, from compressed picker output. */
  base64: string;
};

export interface PetPhotoEncoder {
  encode(request: PetPhotoEncodeRequest): Promise<string>;
}
```

`src/modules/pets/domain/utils/petPhotoLimits.ts`:

```typescript
export const PET_PHOTO_MAX_EDGE = 512;
export const PET_PHOTO_JPEG_QUALITY = 0.7;
export const PET_PHOTO_MAX_DATA_URI_CHARS = 700_000;

export function buildJpegDataUri(base64: string): string {
  return `data:image/jpeg;base64,${base64}`;
}

export function assertPetPhotoDataUriWithinLimit(dataUri: string): void {
  if (dataUri.length > PET_PHOTO_MAX_DATA_URI_CHARS) {
    throw new Error('Photo is too large. Try a different image.');
  }
}
```

- [ ] **Step 4: Run limit tests — expect PASS**

Run: `yarn test -- src/modules/pets/domain/utils/__tests__/petPhotoLimits.test.ts`

Expected: PASS

- [ ] **Step 5: Write failing PreparePetPhoto tests**

```typescript
import { PreparePetPhoto } from '../PreparePetPhoto';
import type { PetPhotoEncoder } from '../../ports/PetPhotoEncoder';

describe('PreparePetPhoto', () => {
  it('returns opaque photo string from encoder', async () => {
    const encoder: PetPhotoEncoder = {
      encode: async () => 'data:image/jpeg;base64,abc',
    };
    const useCase = new PreparePetPhoto(encoder);
    const result = await useCase.execute({
      localUri: 'file:///tmp/pet.jpg',
      base64: 'abc',
    });
    expect(result).toEqual({
      ok: true,
      photo: 'data:image/jpeg;base64,abc',
    });
  });

  it('maps encoder errors to ok:false', async () => {
    const encoder: PetPhotoEncoder = {
      encode: async () => {
        throw new Error('Photo is too large. Try a different image.');
      },
    };
    const useCase = new PreparePetPhoto(encoder);
    const result = await useCase.execute({
      localUri: 'file:///tmp/pet.jpg',
      base64: 'x',
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errorMessage).toMatch(/too large/i);
  });

  it('rejects empty base64 before calling encoder', async () => {
    const encode = jest.fn();
    const useCase = new PreparePetPhoto({ encode });
    const result = await useCase.execute({
      localUri: 'file:///tmp/pet.jpg',
      base64: '   ',
    });
    expect(result.ok).toBe(false);
    expect(encode).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 6: Run PreparePetPhoto tests — expect FAIL**

Run: `yarn test -- src/modules/pets/domain/usecases/__tests__/PreparePetPhoto.test.ts`

Expected: FAIL (module not found)

- [ ] **Step 7: Implement PreparePetPhoto**

```typescript
import type {
  PetPhotoEncodeRequest,
  PetPhotoEncoder,
} from '../ports/PetPhotoEncoder';

export type PreparePetPhotoResult =
  | { ok: true; photo: string }
  | { ok: false; errorMessage: string };

export class PreparePetPhoto {
  constructor(private readonly encoder: PetPhotoEncoder) {}

  async execute(request: PetPhotoEncodeRequest): Promise<PreparePetPhotoResult> {
    if (!request.base64?.trim()) {
      return {
        ok: false,
        errorMessage: 'Could not read that photo. Try another one.',
      };
    }
    try {
      const photo = await this.encoder.encode({
        localUri: request.localUri,
        base64: request.base64.trim(),
      });
      return { ok: true, photo };
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : 'Could not prepare that photo. Try another one.';
      return { ok: false, errorMessage: message };
    }
  }
}
```

- [ ] **Step 8: Run PreparePetPhoto tests — expect PASS**

Run: `yarn test -- src/modules/pets/domain/usecases/__tests__/PreparePetPhoto.test.ts`

Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/modules/pets/domain/ports/PetPhotoEncoder.ts \
  src/modules/pets/domain/utils/petPhotoLimits.ts \
  src/modules/pets/domain/utils/__tests__/petPhotoLimits.test.ts \
  src/modules/pets/domain/usecases/PreparePetPhoto.ts \
  src/modules/pets/domain/usecases/__tests__/PreparePetPhoto.test.ts
git commit -m "$(cat <<'EOF'
feat(pets): add PreparePetPhoto use case and photo size limits

Introduce a swappable PetPhotoEncoder port and validate JPEG data URI size before save.
EOF
)"
```

---

### Task 2: Install image-picker + native permissions

**Files:**
- Modify: `package.json` (via yarn)
- Modify: `ios/paw_fect/Info.plist`
- Modify: `android/app/src/main/AndroidManifest.xml`
- Touch: `ios/Podfile.lock` after `pod install`

**Interfaces:**
- Consumes: none
- Produces: App can link `react-native-image-picker`; OS permission prompts have copy

- [ ] **Step 1: Add dependency**

Run: `yarn add react-native-image-picker`

Expected: package listed in `package.json` dependencies

- [ ] **Step 2: iOS usage descriptions**

In `ios/paw_fect/Info.plist`, add keys (near other `NS*` entries):

```xml
<key>NSCameraUsageDescription</key>
<string>Pawsoul needs camera access so you can take a photo of your pet.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Pawsoul needs photo library access so you can choose a photo of your pet.</string>
```

- [ ] **Step 3: Android permissions**

In `android/app/src/main/AndroidManifest.xml`, add before `<application>`:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<!-- Android 13+ -->
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<!-- Older Android gallery access -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
```

- [ ] **Step 4: Install iOS pods**

Run: `cd ios && bundle exec pod install && cd ..`

Expected: `react-native-image-picker` appears in Podfile.lock / install succeeds

- [ ] **Step 5: Commit**

```bash
git add package.json yarn.lock ios/paw_fect/Info.plist \
  android/app/src/main/AndroidManifest.xml ios/Podfile.lock
git commit -m "$(cat <<'EOF'
chore: add react-native-image-picker and photo permissions

Enable camera and gallery access for optional pet profile photos.
EOF
)"
```

---

### Task 3: Firestore encoder, picker helper, composition

**Files:**
- Create: `src/modules/pets/data/photos/FirestorePetPhotoEncoder.ts`
- Create: `src/modules/pets/data/photos/pickPetPhoto.ts`
- Create: `src/modules/pets/data/photos/__tests__/FirestorePetPhotoEncoder.test.ts`
- Modify: `src/modules/pets/petComposition.ts`
- Modify: `src/modules/pets/data/datasources/PetRemoteDataSource.ts` (clear `photo` with `null`)

**Interfaces:**
- Consumes: `PetPhotoEncoder`, `PetPhotoEncodeRequest`, `buildJpegDataUri`, `assertPetPhotoDataUriWithinLimit`, `PET_PHOTO_MAX_EDGE`, `PET_PHOTO_JPEG_QUALITY`, `PreparePetPhoto`
- Produces:
  - `export function createFirestorePetPhotoEncoder(): PetPhotoEncoder`
  - `export async function pickPetPhoto(source: 'camera' | 'library'): Promise<PetPhotoEncodeRequest | null>`
    - `null` = user cancelled
    - throws `Error` with message `PERMISSION_DENIED` when permission blocked (UI maps this)
  - `petComposition.preparePetPhoto: PreparePetPhoto`

- [ ] **Step 1: Write failing encoder test**

```typescript
import { createFirestorePetPhotoEncoder } from '../FirestorePetPhotoEncoder';
import { PET_PHOTO_MAX_DATA_URI_CHARS } from '../../../domain/utils/petPhotoLimits';

describe('createFirestorePetPhotoEncoder', () => {
  it('returns a jpeg data URI for valid base64', async () => {
    const encoder = createFirestorePetPhotoEncoder();
    await expect(
      encoder.encode({ localUri: 'file:///x.jpg', base64: 'qq' }),
    ).resolves.toBe('data:image/jpeg;base64,qq');
  });

  it('rejects oversized payloads', async () => {
    const encoder = createFirestorePetPhotoEncoder();
    const base64 = 'a'.repeat(PET_PHOTO_MAX_DATA_URI_CHARS);
    await expect(
      encoder.encode({ localUri: 'file:///x.jpg', base64 }),
    ).rejects.toThrow(/too large/i);
  });
});
```

- [ ] **Step 2: Run encoder test — expect FAIL**

Run: `yarn test -- src/modules/pets/data/photos/__tests__/FirestorePetPhotoEncoder.test.ts`

Expected: FAIL (module not found)

- [ ] **Step 3: Implement encoder**

```typescript
import type {
  PetPhotoEncodeRequest,
  PetPhotoEncoder,
} from '../../domain/ports/PetPhotoEncoder';
import {
  assertPetPhotoDataUriWithinLimit,
  buildJpegDataUri,
} from '../../domain/utils/petPhotoLimits';

class FirestorePetPhotoEncoder implements PetPhotoEncoder {
  async encode(request: PetPhotoEncodeRequest): Promise<string> {
    const dataUri = buildJpegDataUri(request.base64);
    assertPetPhotoDataUriWithinLimit(dataUri);
    return dataUri;
  }
}

export function createFirestorePetPhotoEncoder(): PetPhotoEncoder {
  return new FirestorePetPhotoEncoder();
}
```

- [ ] **Step 4: Run encoder test — expect PASS**

Run: `yarn test -- src/modules/pets/data/photos/__tests__/FirestorePetPhotoEncoder.test.ts`

Expected: PASS

- [ ] **Step 5: Implement pickPetPhoto**

```typescript
import {
  launchCamera,
  launchImageLibrary,
  type ImagePickerResponse,
} from 'react-native-image-picker';

import type { PetPhotoEncodeRequest } from '../../domain/ports/PetPhotoEncoder';
import {
  PET_PHOTO_JPEG_QUALITY,
  PET_PHOTO_MAX_EDGE,
} from '../../domain/utils/petPhotoLimits';

const pickerOptions = {
  mediaType: 'photo' as const,
  includeBase64: true,
  maxWidth: PET_PHOTO_MAX_EDGE,
  maxHeight: PET_PHOTO_MAX_EDGE,
  quality: PET_PHOTO_JPEG_QUALITY,
  saveToPhotos: false,
};

function mapResponse(
  response: ImagePickerResponse,
): PetPhotoEncodeRequest | null {
  if (response.didCancel) {
    return null;
  }
  if (response.errorCode === 'permission') {
    throw new Error('PERMISSION_DENIED');
  }
  if (response.errorCode) {
    throw new Error(response.errorMessage ?? 'Could not open the photo picker.');
  }
  const asset = response.assets?.[0];
  const localUri = asset?.uri?.trim();
  const base64 = asset?.base64?.trim();
  if (!localUri || !base64) {
    throw new Error('Could not read that photo. Try another one.');
  }
  return { localUri, base64 };
}

export async function pickPetPhoto(
  source: 'camera' | 'library',
): Promise<PetPhotoEncodeRequest | null> {
  const response =
    source === 'camera'
      ? await launchCamera(pickerOptions)
      : await launchImageLibrary(pickerOptions);
  return mapResponse(response);
}
```

- [ ] **Step 6: Wire petComposition**

In `src/modules/pets/petComposition.ts`:

```typescript
import { PreparePetPhoto } from './domain/usecases/PreparePetPhoto';
import { createFirestorePetPhotoEncoder } from './data/photos/FirestorePetPhotoEncoder';

const petPhotoEncoder = createFirestorePetPhotoEncoder();

export const petComposition = {
  // ...existing fields
  preparePetPhoto: new PreparePetPhoto(petPhotoEncoder),
} as const;
```

- [ ] **Step 7: Clear photo on Firestore when nullish**

In `PetRemoteDataSource.serializePetForFirestore`, ensure removed photos overwrite the field under `merge: true`:

```typescript
private serializePetForFirestore(pet: Pet): Record<string, unknown> {
  const { syncStatus: _syncStatus, photo, ...rest } = pet;
  return {
    ...rest,
    // Explicit null clears a previous photo under setDoc merge.
    photo: photo && photo.trim().length > 0 ? photo : null,
  };
}
```

Update `createPet` / `updatePet` body types if needed so `setDoc` accepts this payload (cast as needed — keep runtime behavior as above).

- [ ] **Step 8: Commit**

```bash
git add src/modules/pets/data/photos \
  src/modules/pets/petComposition.ts \
  src/modules/pets/data/datasources/PetRemoteDataSource.ts
git commit -m "$(cat <<'EOF'
feat(pets): wire Firestore pet photo encoder and picker

Add compressed gallery/camera picking and clear photo with null on merge writes.
EOF
)"
```

---

### Task 4: AddPetScreen picker UI + encode-on-save

**Files:**
- Modify: `src/modules/pets/ui/screens/AddPetScreen.tsx`

**Interfaces:**
- Consumes: `petComposition.preparePetPhoto`, `pickPetPhoto`, `resolvePetAvatarSource`, existing `createPetProfile` / `updatePet`, `isPetPhotoPlaceholderUri`
- Produces: Working avatar tap → action sheet → preview → save encodes pending pick (or keeps existing data URI / clears)

**State model:**

```typescript
/** Local preview URI (file:// or data:) shown in the avatar. */
const [photoUri, setPhotoUri] = useState<string>(PROFILE_PLACEHOLDER);
/** Pending compressed pick; encode on save. Null = no new pick this session. */
const [pendingPhoto, setPendingPhoto] = useState<PetPhotoEncodeRequest | null>(null);
/** True when user chose Remove photo (even if edit had an existing photo). */
const [photoCleared, setPhotoCleared] = useState(false);
```

**Resolve photo for save:**

```typescript
async function resolvePhotoForSave(): Promise<
  | { ok: true; photo: string | undefined }
  | { ok: false; errorMessage: string }
> {
  if (photoCleared) {
    return { ok: true, photo: undefined };
  }
  if (pendingPhoto) {
    const prepared = await petComposition.preparePetPhoto.execute(pendingPhoto);
    if (!prepared.ok) {
      return { ok: false, errorMessage: prepared.errorMessage };
    }
    return { ok: true, photo: prepared.photo };
  }
  if (!isPetPhotoPlaceholderUri(photoUri) && photoUri.length > 0) {
    // Existing remote/data URI already on the pet — pass through unchanged.
    return { ok: true, photo: photoUri };
  }
  return { ok: true, photo: undefined };
}
```

- [ ] **Step 1: Imports + state**

Add imports for `Alert`, `Image`, `Linking`, `petComposition`, `pickPetPhoto`, `PetPhotoEncodeRequest`, `resolvePetAvatarSource`. Add `pendingPhoto` / `photoCleared` state. When loading edit pet, set `photoUri` from `pet.photo`, reset `pendingPhoto` to `null`, `photoCleared` to `false`.

- [ ] **Step 2: Action sheet handlers**

Implement `openPhotoOptions` with **Take photo** | **Choose from library** | **Remove photo** (if set) | **Cancel**, and `handlePick` that calls `pickPetPhoto`, maps `PERMISSION_DENIED` to Settings alert, and sets preview URI from `picked.localUri`.

- [ ] **Step 3: Avatar UI**

Replace avatar section: show `Image` via `resolvePetAvatarSource` when photo set, else dog/cat icon; wrap in `Pressable` with existing `cameraBadge`.

- [ ] **Step 4: Encode on save in create + edit paths**

Before `createPetProfile` / `updatePet`, call `resolvePhotoForSave()`. On failure, set error and stop. On success, pass `photo: result.photo`. Treat pending or non-placeholder photo (and not cleared) as photo filled for progress.

- [ ] **Step 5: Manual smoke (device/simulator)**

1. Add pet without photo → succeeds; placeholder avatar.
2. Choose library photo → preview → save → profile/home show photo.
3. Edit → remove photo → save → placeholder returns; Firestore `photo` is null.
4. Deny permission once → Settings alert appears.

- [ ] **Step 6: Commit**

```bash
git add src/modules/pets/ui/screens/AddPetScreen.tsx
git commit -m "$(cat <<'EOF'
feat(pets): let users pick pet photos on add/edit

Wire camera/library action sheet, preview, encode-on-save, and remove photo.
EOF
)"
```

---

### Task 5: Avatar source test + typecheck

**Files:**
- Create: `src/shared/utils/__tests__/petDisplayPhoto.test.ts`

**Interfaces:**
- Consumes: `resolvePetAvatarSource`
- Produces: Regression coverage that data URIs resolve to `{ uri }`

- [ ] **Step 1: Write test**

```typescript
import { resolvePetAvatarSource } from '../petDisplayPhoto';

describe('resolvePetAvatarSource', () => {
  it('uses a data URI as the image source', () => {
    const photo = 'data:image/jpeg;base64,qq';
    expect(resolvePetAvatarSource({ type: 'dog', photo })).toEqual({
      uri: photo,
    });
  });

  it('falls back to bundled art when photo is empty', () => {
    const source = resolvePetAvatarSource({ type: 'cat', photo: undefined });
    expect(source).not.toEqual(
      expect.objectContaining({ uri: expect.any(String) }),
    );
  });
});
```

- [ ] **Step 2: Run test**

Run: `yarn test -- src/shared/utils/__tests__/petDisplayPhoto.test.ts`

Expected: PASS (no production change required if current helper already returns `{ uri }`)

- [ ] **Step 3: Typecheck + focused pet photo tests**

Run:

```bash
npx tsc --noEmit
yarn test -- src/modules/pets/domain/utils/__tests__/petPhotoLimits.test.ts src/modules/pets/domain/usecases/__tests__/PreparePetPhoto.test.ts src/modules/pets/data/photos/__tests__/FirestorePetPhotoEncoder.test.ts src/shared/utils/__tests__/petDisplayPhoto.test.ts
```

Expected: typecheck clean; all listed tests PASS

- [ ] **Step 4: Commit**

```bash
git add src/shared/utils/__tests__/petDisplayPhoto.test.ts
git commit -m "$(cat <<'EOF'
test: cover pet avatar resolution for data URI photos

Lock in display behavior for Firestore-stored base64 pet photos.
EOF
)"
```

---

## Spec coverage checklist

| Spec requirement | Task |
| --- | --- |
| Camera + gallery | 2, 3, 4 |
| Optional photo + remove | 4 |
| Base64 data URI on Firestore `Pet.photo` | 1, 3, 4 |
| Swappable `PetPhotoEncoder` / no UI Firebase | 1, 3 |
| Size budget ~512 / 0.7 / ~700KB | 1, 3 |
| `petComposition` wiring | 3 |
| Add/Edit UI + permissions + Settings | 2, 4 |
| Unit tests + data URI display | 1, 3, 5 |
| Out of scope Storage / crop / user photos | — not planned |

## Self-review notes

- Port uses `{ localUri, base64 }` so Firestore path validates picker-compressed base64 today; a future Storage encoder can ignore `base64` and upload `localUri` — same `PreparePetPhoto` call site.
- `serializePetForFirestore` writes `photo: null` so merge updates clear removed photos.
- No placeholders left in tasks.
