# React Native 0.86 Upgrade Design

**Date:** 2026-08-10  
**Status:** Approved for planning  
**Approach:** Upgrade Helper–guided direct bump `0.84.1` → `0.86.2` with Android edge-to-edge enabled

## Goal

Upgrade the Pawsoul React Native app from **0.84.1** to **0.86.2**, enable Android **edge-to-edge**, preserve New Architecture + Hermes and existing RNFirebase iOS workarounds, and verify both Android and iOS with a defined smoke path.

## Decisions

| Topic | Choice |
| --- | --- |
| Path | Direct **0.84.1 → 0.86.2** (not staged via 0.85) |
| Patch target | **0.86.2** (latest stable; skip 0.86.1) |
| Done criteria | Android + iOS both **build and run**; smoke: launch → login → one pet screen |
| Edge-to-edge | Enable `edgeToEdgeEnabled=true` and fix safe-area / status-bar / chrome if needed |
| New Architecture | Keep enabled (`newArchEnabled=true`, Hermes on) |
| Method | Upgrade Helper template diffs + package bumps; fix third-party natives only as required |
| Relation to Analytics | Separate track; do not mix unfinished Analytics work into this upgrade branch |

## Current baseline (known)

- `react-native` / `@react-native/*`: **0.84.1**
- `react` / `react-test-renderer`: **19.2.3** (compatible with 0.86 peer `^19.2.3`)
- Android: `minSdk 24`, `compileSdk/targetSdk 36`, NDK `27.1.12297006`, Kotlin `2.1.20`, `edgeToEdgeEnabled=false`, `newArchEnabled=true`, `hermesEnabled=true`
- iOS: `$RNFirebaseAsStaticFramework = true`, `ENV['RCT_USE_PREBUILT_RNCORE'] = '0'`, `ENV['RCT_USE_RN_DEP'] = '0'`, `use_frameworks!` static linkage
- Notable natives: RNFirebase (app/auth/crashlytics/firestore), Skia, IAP, MMKV, Nitro, Notifee, Razorpay, Google Sign-In, Config, screens, safe-area, SVG

## Scope

### In

1. Bump JS packages:
   - `react-native` → `0.86.2`
   - Matching `@react-native/babel-preset`, `eslint-config`, `metro-config`, `typescript-config`, `new-app-screen` → `0.86.2`
   - CLI packages (`@react-native-community/cli*`) to versions required by 0.86.2 template / peer guidance
2. Apply Upgrade Helper diffs for app name `paw_fect` / Android package as in-repo (do not invent a new package id).
3. Android: set `edgeToEdgeEnabled=true`; review status bar, navigation bar, tab bar, and any absolute bottom UI for insets.
4. iOS: update Podfile / Xcode project template changes from Upgrade Helper while **preserving** RNFirebase static-framework and from-source RN env flags unless proven obsolete on 0.86.2.
5. `yarn install`, `pod install`, Android assemble, iOS build.
6. Smoke on device/simulator: cold start → auth screen → login (or already-auth path) → open a pet-related screen.
7. Fix compile/runtime breakages in third-party modules only as needed for green smoke.

### Out

- Implementing Firebase Analytics (separate plan/spec)
- Full regression (paywall purchase flows, notification matrix, etc.)
- Expo
- Turning New Architecture off
- Marketing website / unrelated dirty tree changes

## Architecture / process

```
main (0.84.1)
  → branch feat/rn-0.86-upgrade
      → Upgrade Helper package + native template updates
      → edgeToEdgeEnabled=true + UI inset fixes
      → build Android + iOS
      → smoke
```

**Source of truth for template deltas:** [React Native Upgrade Helper](https://react-native-community.github.io/upgrade-helper/?from=0.84.1&to=0.86.2) (`from=0.84.1`, `to=0.86.2`).

**Preserve unless broken on 0.86.2:**

- iOS RNFirebase static frameworks + `RCT_USE_PREBUILT_RNCORE=0` / `RCT_USE_RN_DEP=0`
- Google Services / Crashlytics Gradle plugins
- Existing signing, `react-native-config` dotenv wiring, store package name

## Edge-to-edge behavior

- Flip `android/gradle.properties` `edgeToEdgeEnabled` from `false` to `true`.
- Expect OS-enforced edge-to-edge behavior on Android 15+; use 0.86 measurement / KeyboardAvoidingView / StatusBar fixes.
- Audit UI that sits under system bars:
  - Root navigators / safe-area usage
  - Custom tab bar (`PawTabBar` or equivalent)
  - Any sticky bottom CTAs in the app (not marketing web)
- Prefer React Native / `react-native-safe-area-context` insets over hardcoded padding.

## Dependency policy

- First pass: core RN + `@react-native/*` only.
- Second pass: bump a library **only if** install, pod, Gradle, or runtime fails with a clear peer/native error.
- Prefer official peer-compatible versions; avoid speculative major upgrades of IAP/Skia/Firebase unless required.

## Testing / success criteria

1. `yarn install` succeeds on the upgrade branch.
2. Android debug build installs and launches.
3. iOS debug build installs and launches (after `pod install`).
4. Smoke path on each platform: launch → login (or resume session) → one pet screen navigates without crash/redbox.
5. No intentional revert of New Architecture or Hermes.
6. `edgeToEdgeEnabled=true` remains on; no obvious content under the status bar / gesture nav for the smoke screens.

## Risks

| Risk | Mitigation |
| --- | --- |
| RNFirebase + frameworks + from-source RN | Keep Podfile flags; re-test pods early |
| Skia / Nitro / IAP native ABI | Build early; bump only on failure |
| Edge-to-edge overlaps custom chrome | Visual smoke on Android 15+ or emulator with gesture nav |
| Large Upgrade Helper surface (0.84→0.86 spans 0.85) | Apply diffs carefully; prefer template defaults except documented preserves |
| Dirty unrelated changes on `main` | Dedicated upgrade branch from clean RN baseline commits |

## Open follow-ups (not blocking)

- Full QA after merge
- Resume Firebase Analytics on its own branch after upgrade lands (or rebase Analytics onto 0.86)
