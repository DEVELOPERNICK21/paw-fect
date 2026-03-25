You are designing an offline-first sync system for a mobile app.

Reliability, idempotency, and recoverability are mandatory.

---

## Task

Design sync mechanism for: <FEATURE_NAME>

---

## Requirements

- Sync queue design
- Retry strategy
- Failure handling
- Conflict resolution

---

## Must Include

- create/update/delete sync handling
- background sync behavior
- network detection integration

---

## Output

1) Sync flow (text diagram)
2) Queue structure and metadata
3) Retry logic (backoff + max attempts)
4) Conflict resolution strategy
5) Recovery strategy after app restart/crash

---

## Edge Cases

- app killed during sync
- duplicate requests
- stale data
- conflict resolution

---

Prefer idempotent operations and deterministic replay semantics.
