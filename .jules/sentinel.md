# Sentinel Journal 🛡️

This journal tracks critical security learnings and vulnerability patterns in the Paw-fect codebase.

## Entries

## 2026-05-28 - PII Leakage in Notifications
**Vulnerability:** User PII (email address) was being leaked in login welcome notifications. When a user's `displayName` was missing, the app would parse the email address and include the local part (before @) in the notification title.
**Learning:** Notifications are often displayed on lock screens and can be seen by anyone near the device. Using email fragments as a fallback for missing names is a common but risky pattern that exposes PII.
**Prevention:** Use generic greetings ("there", "User", etc.) as fallbacks for names in notifications. Ensure that notification payloads are audited for PII, especially if they are displayed immediately or scheduled via local triggers.
