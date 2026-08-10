# React Native 0.86 Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade Pawsoul from React Native `0.84.1` to `0.86.2`, enable Android edge-to-edge, and verify Android + iOS smoke (launch → login → one pet screen).

**Architecture:** Dedicated branch from a clean RN baseline. Bump core RN / `@react-native/*` packages to match `@react-native-community/template@0.86.2`, apply Upgrade Helper native template deltas (notably Gradle wrapper), flip `edgeToEdgeEnabled=true`, preserve RNFirebase iOS Podfile workarounds, then build and smoke both platforms. Bump third-party natives only when builds fail.

**Tech Stack:** React Native `0.86.2`, React `19.2.3`, Yarn 1, Gradle wrapper `9.3.1`, CocoaPods, existing RNFirebase / New Architecture / Hermes.

**Spec:** `docs/superpowers/specs/2026-08-10-react-native-0.86-upgrade-design.md`

**Template reference:** Unpack `@react-native-community/template@0.86.2` locally when applying diffs:  
`npm pack @react-native-community/template@0.86.2 && tar -xzf react-native-community-template-0.86.2.tgz`  
Also use [Upgrade Helper](https://react-native-community.github.io/upgrade-helper/?from=0.84.1&to=0.86.2).

## Global Constraints

- Target exactly **react-native `0.86.2`** (not 0.86.0 / 0.86.1)
- Keep **New Architecture** (`newArchEnabled=true`) and **Hermes** (`hermesEnabled=true`)
- Set **`edgeToEdgeEnabled=true`**
- Preserve iOS RNFirebase flags unless proven broken on 0.86.2: `$RNFirebaseAsStaticFramework = true`, `ENV['RCT_USE_PREBUILT_RNCORE'] = '0'`, `ENV['RCT_USE_RN_DEP'] = '0'`, static `use_frameworks!`
- Do **not** invent a new Android package / app id (`app.pawfect` / `paw_fect` stay)
- Do **not** mix Firebase Analytics work or unrelated dirty marketing/feature changes into this upgrade
- Third-party library bumps: **only if** install / pod / Gradle / runtime fails with a clear error
- Do **not** commit or rewrite keystore password lines in `android/gradle.properties` beyond the `edgeToEdgeEnabled` change
- Smoke definition: cold start → auth (or resume session) → open one pet-related screen without redbox/crash on **Android and iOS**

---

## File map

| File / area | Responsibility |
|-------------|----------------|
| `package.json` / lockfile | RN + `@react-native/*` bumps; optional `@react-native/jest-preset` |
| `android/gradle/wrapper/gradle-wrapper.properties` | Gradle `9.0.0` → `9.3.1` |
| `android/gradle.properties` | `edgeToEdgeEnabled=true` |
| `android/build.gradle`, `android/app/build.gradle`, `MainActivity.kt`, `MainApplication.kt` | Apply remaining Upgrade Helper deltas if any; keep Google Services / Crashlytics / custom packages |
| `ios/Podfile`, `ios/Podfile.lock` | Template post_install alignment; preserve RNFirebase workarounds; pod install |
| `ios/paw_fect/AppDelegate.swift` | Keep Firebase `FirebaseApp.configure()`; apply template deltas if any |
| `src/app/navigation/components/PawTabBar.tsx` (+ any broken inset screens) | Edge-to-edge inset fixes if smoke shows overlap |
| Branch `feat/rn-0.86-upgrade` | Isolated upgrade work |

**Already aligned with 0.86.2 template (verify, do not regress):**  
`android/build.gradle` SDK/NDK/Kotlin ext block, `MainActivity.kt` / `MainApplication.kt` structure (keep `PawfectWidgetsPackage` + `NotificationBootPackage`), AppDelegate RN factory pattern + Firebase configure.

---

### Task 1: Create clean upgrade branch

**Files:**
- Branch only (no product code yet)

**Interfaces:**
- Consumes: clean commit that has RN `0.84.1` (prefer `main` or latest release baseline without unrelated WIP)
- Produces: local branch `feat/rn-0.86-upgrade` checked out for all later tasks

- [ ] **Step 1: Identify baseline**

Run:

```bash
git status -sb
git branch --show-current
node -p "require('./package.json').dependencies['react-native']"
```

Expected: `react-native` prints `0.84.1`. If the current branch has large unrelated WIP, note it and branch from `main` (or the last known-good remote commit) instead of committing WIP into the upgrade.

- [ ] **Step 2: Create the upgrade branch**

From the chosen clean baseline:

```bash
git checkout -b feat/rn-0.86-upgrade
```

Expected: `git branch --show-current` → `feat/rn-0.86-upgrade`.

- [ ] **Step 3: Commit nothing yet (or empty marker only if needed)**

If the branch already exists tip is clean, skip. Otherwise do not commit unrelated files.

---

### Task 2: Bump JS packages to 0.86.2

**Files:**
- Modify: `package.json`
- Modify: `yarn.lock` (via yarn)

**Interfaces:**
- Consumes: Task 1 branch
- Produces: `react-native` and matching `@react-native/*` at `0.86.2`; `yarn install` succeeds

Exact versions from `@react-native-community/template@0.86.2`:

| Package | Version |
|---------|---------|
| `react-native` | `0.86.2` |
| `@react-native/new-app-screen` | `0.86.2` (add if missing; optional if unused — only add if already depended or template requires for compile) |
| `@react-native/babel-preset` | `0.86.2` |
| `@react-native/eslint-config` | `0.86.2` |
| `@react-native/metro-config` | `0.86.2` |
| `@react-native/typescript-config` | `0.86.2` |
| `@react-native/jest-preset` | `0.86.2` (add under `devDependencies` — RN 0.86 peer) |
| `@react-native-community/cli` | `20.1.0` (keep; template still uses this) |
| `@react-native-community/cli-platform-android` | `20.1.0` |
| `@react-native-community/cli-platform-ios` | `20.1.0` |
| `react` | `19.2.3` (already correct) |
| `react-test-renderer` | `19.2.3` (already correct) |

- [ ] **Step 1: Edit `package.json` versions**

Set dependency / devDependency versions to the table above. Keep all other app libraries unchanged in this task.

If `@react-native/new-app-screen` is not in `package.json` and not imported anywhere, **do not add it**.

Add:

```json
"@react-native/jest-preset": "0.86.2"
```

under `devDependencies`.

- [ ] **Step 2: Install**

Run:

```bash
yarn install
```

Expected: install completes; `node -p "require('react-native/package.json').version"` → `0.86.2`.

- [ ] **Step 3: Quick Jest preset wire-up check**

Open `jest.config.js`. If it only uses `preset: 'react-native'`, leave it for now. If install warns that `@react-native/jest-preset` must be referenced, set:

```js
module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['<rootDir>/jest.setup.js'],
};
```

Only change if required by install/docs/peer tooling for 0.86.2.

- [ ] **Step 4: Commit**

```bash
git add package.json yarn.lock jest.config.js
git commit -m "$(cat <<'EOF'
chore: bump React Native packages to 0.86.2

EOF
)"
```

---

### Task 3: Android template + edge-to-edge flag

**Files:**
- Modify: `android/gradle/wrapper/gradle-wrapper.properties`
- Modify: `android/gradle.properties` (`edgeToEdgeEnabled` only)
- Compare (modify only if Upgrade Helper / template differs): `android/build.gradle`, `android/app/build.gradle`, `android/settings.gradle`, `android/app/src/main/java/app/pawfect/MainActivity.kt`, `android/app/src/main/java/app/pawfect/MainApplication.kt`

**Interfaces:**
- Consumes: Task 2 packages installed
- Produces: Gradle wrapper `9.3.1`; `edgeToEdgeEnabled=true`; Android project files aligned without dropping Firebase plugins or custom packages

- [ ] **Step 1: Bump Gradle wrapper**

In `android/gradle/wrapper/gradle-wrapper.properties`, set:

```properties
distributionUrl=https\://services.gradle.org/distributions/gradle-9.3.1-bin.zip
```

(leave other properties unchanged).

- [ ] **Step 2: Enable edge-to-edge**

In `android/gradle.properties`, change **only**:

```properties
edgeToEdgeEnabled=true
```

Do not touch keystore / password properties in this file.

- [ ] **Step 3: Diff remaining Android files against template**

Compare local files to `@react-native-community/template@0.86.2` `package/template/android/**`.

Known expected outcomes for this repo:

- `android/build.gradle` ext block already matches template (`minSdk 24`, `compileSdk 36`, NDK `27.1.12297006`, Kotlin `2.1.20`). **Keep** Google Services + Crashlytics classpaths and the `allprojects` async-storage maven block.
- `MainActivity.kt` / `MainApplication.kt` already use 0.86-style APIs. **Keep** `PawfectWidgetsPackage` and `NotificationBootPackage` in `MainApplication`.
- Apply any remaining small template comments/flags from Upgrade Helper only if they exist and do not conflict.

- [ ] **Step 4: Commit**

```bash
git add android/gradle/wrapper/gradle-wrapper.properties android/gradle.properties android/build.gradle android/app/build.gradle android/settings.gradle android/app/src/main/java/app/pawfect/MainActivity.kt android/app/src/main/java/app/pawfect/MainApplication.kt
git commit -m "$(cat <<'EOF'
chore(android): RN 0.86.2 Gradle wrapper and edge-to-edge

EOF
)"
```

---

### Task 4: iOS Podfile alignment (preserve RNFirebase)

**Files:**
- Modify: `ios/Podfile` (only if template post_install / structure needs sync)
- Modify: `ios/Podfile.lock` via pod install
- Modify: `ios/paw_fect/AppDelegate.swift` only if Upgrade Helper requires a delta (keep `FirebaseApp.configure()`)

**Interfaces:**
- Consumes: Task 2 `node_modules/react-native`
- Produces: pods install for 0.86.2 without removing RNFirebase static-framework / from-source RN flags

- [ ] **Step 1: Confirm Podfile preserves**

`ios/Podfile` must still contain (order may vary, but all present):

```ruby
$RNFirebaseAsStaticFramework = true
ENV['RCT_USE_PREBUILT_RNCORE'] = '0'
ENV['RCT_USE_RN_DEP'] = '0'
```

and static frameworks linkage as today. Do **not** replace the entire Podfile with the HelloWorld template.

- [ ] **Step 2: Align `use_react_native!` / `post_install` with 0.86.2 template if needed**

Template `post_install`:

```ruby
post_install do |installer|
  react_native_post_install(
    installer,
    config[:reactNativePath],
    :mac_catalyst_enabled => false,
    # :ccache_enabled => true
  )
end
```

Merge this shape into the existing `post_install` **without deleting** project-specific hooks (e.g. gRPC modulemap symlink helper if still present).

- [ ] **Step 3: Pod install**

Run:

```bash
bundle exec pod install --project-directory=ios
```

Expected: success. If prebuilt RNCore conflicts reappear, keep `RCT_USE_PREBUILT_RNCORE=0` / `RCT_USE_RN_DEP=0` and retry after `pod deintegrate` only if necessary.

- [ ] **Step 4: Commit**

```bash
git add ios/Podfile ios/Podfile.lock ios/paw_fect/AppDelegate.swift
git commit -m "$(cat <<'EOF'
chore(ios): align pods for React Native 0.86.2

EOF
)"
```

---

### Task 5: Android build + required third-party fixes

**Files:**
- Possibly: third-party version bumps in `package.json` / native files **only on failure**

**Interfaces:**
- Consumes: Tasks 2–3
- Produces: Android debug APK builds and installs

- [ ] **Step 1: Assemble debug**

Run:

```bash
cd android && ./gradlew :app:assembleDebug
```

Expected: `BUILD SUCCESSFUL`.

- [ ] **Step 2: On failure — fix narrowly**

If a library fails native compile / autolinking:

1. Capture the exact error.
2. Bump **only that library** to a peer version that claims RN 0.86 / New Arch support.
3. Re-run `yarn install` and Step 1.
4. Do not speculative-upgrade Firebase / Skia / IAP together.

- [ ] **Step 3: Install + launch**

```bash
yarn android
```

Expected: app launches on emulator/device past splash without redbox.

- [ ] **Step 4: Commit build fixes (if any)**

```bash
git add package.json yarn.lock android
git commit -m "$(cat <<'EOF'
fix(android): resolve RN 0.86.2 build breakages

EOF
)"
```

Skip commit if no extra fixes were needed beyond Tasks 2–3.

---

### Task 6: iOS build + required third-party fixes

**Files:**
- Possibly: pod / package bumps only on failure

**Interfaces:**
- Consumes: Tasks 2 + 4
- Produces: iOS debug build runs on simulator/device

- [ ] **Step 1: Build / run iOS**

```bash
yarn ios
```

Expected: build succeeds; app launches past splash without redbox.

- [ ] **Step 2: On failure — fix narrowly**

Same policy as Android Task 5 Step 2. Prefer Podfile preserve flags over deleting RNFirebase workarounds.

- [ ] **Step 3: Commit iOS fixes (if any)**

```bash
git add package.json yarn.lock ios
git commit -m "$(cat <<'EOF'
fix(ios): resolve RN 0.86.2 build breakages

EOF
)"
```

Skip if none.

---

### Task 7: Edge-to-edge UI audit (Android focus)

**Files:**
- Likely: `src/app/navigation/components/PawTabBar.tsx` (already uses `useSafeAreaInsets`)
- Possibly: screens with absolute bottom UI, status-bar config, root SafeArea providers

**Interfaces:**
- Consumes: `edgeToEdgeEnabled=true` from Task 3; running Android build from Task 5
- Produces: smoke screens not covered by status / gesture bars

- [ ] **Step 1: Visual check on Android**

On an Android 15+ device/emulator (or API 35+ with gesture nav):

1. Cold start splash / auth
2. Logged-in home / tabs
3. Confirm tab bar sits above gesture inset (`PawTabBar` uses `insets.bottom` — verify still correct)
4. Confirm headers / status icons not under the status bar

- [ ] **Step 2: Fix insets only where broken**

Example pattern already used in `PawTabBar.tsx`:

```typescript
const insets = useSafeAreaInsets();
const bottomPad = Math.max(insets.bottom, Platform.OS === 'ios' ? 6 : 4);
```

If a screen ignores insets, wrap content with `SafeAreaView` / `useSafeAreaInsets` padding — do not hardcode `24`/`48` for system bars.

- [ ] **Step 3: Commit UI fixes (if any)**

```bash
git add src
git commit -m "$(cat <<'EOF'
fix(ui): safe-area adjustments for Android edge-to-edge

EOF
)"
```

Skip if already correct.

---

### Task 8: Dual-platform smoke + version gate

**Files:** none required (checklist + optional small fixes)

- [ ] **Step 1: Confirm versions**

```bash
node -p "require('react-native/package.json').version"
grep edgeToEdgeEnabled android/gradle.properties
grep newArchEnabled android/gradle.properties
grep hermesEnabled android/gradle.properties
```

Expected:

```
0.86.2
edgeToEdgeEnabled=true
newArchEnabled=true
hermesEnabled=true
```

- [ ] **Step 2: Android smoke**

Path: launch → login (or resume) → open one pet screen. No crash/redbox. Tab bar / status bar look correct with edge-to-edge.

- [ ] **Step 3: iOS smoke**

Same path on simulator/device.

- [ ] **Step 4: Focused tests (sanity)**

```bash
yarn test --passWithNoTests
```

Expected: no new widespread failures attributable to the upgrade. Pre-existing known failures may remain; document them in the PR notes if still present. Do not block solely on pre-existing `App.test` ESM issues unless newly introduced by this upgrade.

- [ ] **Step 5: Final commit only if Step 2–4 required code changes**

Otherwise mark task complete with smoke notes in the PR description.

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| Direct bump to `0.86.2` | Tasks 1–2 |
| Matching `@react-native/*` | Task 2 |
| Upgrade Helper / template native diffs | Tasks 3–4 |
| `edgeToEdgeEnabled=true` + UI fixes | Tasks 3, 7 |
| Preserve RNFirebase Podfile workarounds | Task 4 |
| Android build + run | Task 5 |
| iOS build + run | Task 6 |
| Smoke both platforms | Task 8 |
| No Analytics / no Expo / keep New Arch | Global Constraints |
| Third-party bumps only on failure | Tasks 5–6 |
