<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Pawsoul React Native app. Here is a summary of all changes made:

**New files created:**
- `src/config/posthog.ts` — PostHog client instance, configured via `react-native-config` environment variables
- `src/types/env.d.ts` — TypeScript type declarations for `react-native-config` (POSTHOG_PROJECT_TOKEN, POSTHOG_HOST)
- `.env` — environment variables file with PostHog token and host (gitignore-protected)

**Files modified:**
- `android/app/build.gradle` — added `apply from: react-native-config/android/config.gradle` for env variable embedding
- `src/app/navigation/RootNavigator.tsx` — added `PostHogProvider` (inside `NavigationContainer`), manual screen tracking via `onStateChange`, and user identification/reset via `useEffect` watching auth state
- `src/modules/auth/ui/screens/LoginScreen.tsx` — captures `user_signed_up` (email signup) and `user_logged_in` (email and Google login)
- `src/modules/app/ui/screens/OnboardingScreen.tsx` — captures `onboarding_step_viewed` on each step and `onboarding_completed` on finish or skip
- `src/modules/pets/ui/screens/AddPetScreen.tsx` — captures `pet_profile_created` (new pet) and `pet_profile_updated` (edit)
- `src/modules/records/ui/screens/AddHealthRecordScreen.tsx` — captures `health_record_added` with category and notes metadata
- `src/modules/reminders/ui/screens/AddReminderScreen.tsx` — captures `reminder_created`
- `src/modules/subscription/ui/screens/PaywallScreen.tsx` — captures `paywall_viewed` on mount and `subscription_checkout_started` on each subscribe button press

**Packages installed:** `posthog-react-native`, `react-native-config`

---

| Event | Description | File |
|---|---|---|
| `user_signed_up` | User creates a new account using email/password | `src/modules/auth/ui/screens/LoginScreen.tsx` |
| `user_logged_in` | User signs in with email/password or Google | `src/modules/auth/ui/screens/LoginScreen.tsx` |
| `onboarding_step_viewed` | User views a step in the 3-step onboarding flow | `src/modules/app/ui/screens/OnboardingScreen.tsx` |
| `onboarding_completed` | User completes or skips the onboarding flow | `src/modules/app/ui/screens/OnboardingScreen.tsx` |
| `pet_profile_created` | User saves a new pet profile | `src/modules/pets/ui/screens/AddPetScreen.tsx` |
| `pet_profile_updated` | User saves changes to an existing pet profile | `src/modules/pets/ui/screens/AddPetScreen.tsx` |
| `health_record_added` | User saves a new health record for a pet | `src/modules/records/ui/screens/AddHealthRecordScreen.tsx` |
| `reminder_created` | User saves a new reminder for a pet | `src/modules/reminders/ui/screens/AddReminderScreen.tsx` |
| `paywall_viewed` | User views the subscription paywall screen | `src/modules/subscription/ui/screens/PaywallScreen.tsx` |
| `subscription_checkout_started` | User taps a subscribe button to begin a Play Store checkout | `src/modules/subscription/ui/screens/PaywallScreen.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics (wizard) — Dashboard](https://us.posthog.com/project/459308/dashboard/1683134)
- [New sign-ups (wizard)](https://us.posthog.com/project/459308/insights/uThXRmlp)
- [User onboarding funnel (wizard)](https://us.posthog.com/project/459308/insights/Ov9z7oYa)
- [Subscription conversion funnel (wizard)](https://us.posthog.com/project/459308/insights/wycXsznh)
- [Health engagement (wizard)](https://us.posthog.com/project/459308/insights/8sa2qnDG)
- [Daily active users (wizard)](https://us.posthog.com/project/459308/insights/dfiu5Xpc)

> **iOS note:** After installing `posthog-react-native` and `react-native-config`, run `cd ios && pod install` before building for iOS.

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-react-native/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
