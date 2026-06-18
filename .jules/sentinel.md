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

## 2028-02-14 - Identity Exposure via UI Label Fallbacks
**Vulnerability:** User identity (email prefix) was being exposed in UI greetings and profile initials when `displayName` was missing.
**Learning:** Using identity-derived data as a fallback for missing display names is a common but insecure practice that leaks PII into the UI layer.
**Prevention:** Always use static, generic fallbacks (e.g., 'there', '?') for UI labels when optional identity data is unavailable.
