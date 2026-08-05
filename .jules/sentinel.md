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

## 2027-10-14 - Resource Exhaustion (DoS) & ReDoS in Authentication Input Validation
**Vulnerability:** The email and password inputs during user authentication (login, registration, password reset) were not bounded by maximum length checks. This allowed arbitrary-sized inputs, leading to possible thread blocking via Regular Expression Denial of Service (ReDoS) or memory exhaustion / Out-Of-Memory (OOM) crashes on the device, and excessive CPU load on the auth backend during password hashing.
**Learning:** Pure domain validators must enforce upper-bound constraints on inputs (e.g., maximum email and password lengths) as defense-in-depth, even if the UI/input fields have visual lengths or limit attributes.
**Prevention:** Always enforce standard RFC limits (max 254 characters for emails) and password limits (max 128 characters) during validation logic to fail securely and fast, preventing CPU and memory exhaustion.
