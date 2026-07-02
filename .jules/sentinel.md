# Sentinel Journal 🛡️

This journal tracks critical security learnings and vulnerability patterns in the Paw-fect codebase.

## Entries

## 2026-05-28 - PII Leakage in Notifications
**Vulnerability:** User PII (email address) was being leaked in login welcome notifications. When a user's `displayName` was missing, the app would parse the email address and include the local part (before @) in the notification title.
**Learning:** Notifications are often displayed on lock screens and can be seen by anyone near the device. Using email fragments as a fallback for missing names is a common but risky pattern that exposes PII.
**Prevention:** Use generic greetings ("there", "User", etc.) as fallbacks for names in notifications. Ensure that notification payloads are audited for PII, especially if they are displayed immediately or scheduled via local triggers.

## 2027-03-26 - Information Disclosure in Admin Auth Logs
**Vulnerability:** The NextAuth credentials provider was logging the provided email, the expected admin email, and the first 7 characters of the bcrypt password hash upon authentication failure.
**Learning:** Developers often add verbose logging to debug authentication flows during development and forget to remove or sanitize them for production. This leaks PII (email) and significantly reduces the search space for brute-forcing the password hash.
**Prevention:** Never log PII or credential fragments (even hashes) in authentication handlers. Use generic error messages for logs and avoid echoing back input values in failure contexts.

## 2028-01-15 - PII Leakage in UI Labels (Email Prefix Fallbacks)
**Vulnerability:** The `BuildUserProfileLabels` use case was using the user's email prefix as a fallback for the greeting name and initials when the `displayName` was missing.
**Learning:** Using PII-derived data as UI fallbacks is a common UX pattern that inadvertently leaks identity in shared environments or notifications. Users often don't realize their email local-part is being displayed as their "name".
**Prevention:** UI labels and notifications must use generic, static fallbacks (e.g., 'there', 'User', '?') when a display name is unavailable. Never parse or reveal fragments of the user's email or phone number in the UI unless explicitly intended (e.g., in a "Profile" settings view).
