# Health Hub — Needs Next UI Design

**Date:** 2026-09-16  
**Status:** Approved  
**Approach:** Health Records as “What {pet} needs next” hub (engines unchanged)

## Goal

Open Health and immediately answer: **What does my pet need? When? Why? What should I do?** Hide schedule intelligence behind plain language.

## Non-goals

- Document / certificate attachments
- Home screen redesign
- Domain / template / engine / Firestore changes
- Second schedule system

## Screen map

```
Flat header (Health · {name} · age)
  → Status line (on track / needs attention)
  → What {pet} needs next (≤2 actionable cards)
  → Why am I seeing this? (collapsed)
  → See full plan (collapsed timeline)
  → Vet disclaimer footer
```

## Needs-next cards

Derived from existing SmartHealth selectors (`getActionRequiredItems` / priority sort), **cross-type**, limit **2**.

Each card (owner copy only):

| Slot | Source |
| --- | --- |
| What | Plain label (Worm medicine / Core vaccine / Rabies / …) |
| When | Friendly date + relative (“In 5 days”, “Overdue”) |
| Why | One sentence from copy map |
| What to do | One sentence + ask vet |
| Primary | I did this (existing modals) |
| Secondary | Change date; Skip for now (deworm only) |

## Full plan

Collapsed by default. Expand shows a simple vertical timeline of upcoming then history — no DHPP/FVRCP codes, no cadence protocol walls.

## Why am I seeing this?

Collapsed. Expand: age-based line + “PawSoul uses age, pet type, and your records. Your vet decides treatment and timing.”

## Architecture

UI-only. Store / use cases / engines unchanged. Copy helpers in records domain utils (plain language layer).

## Success criteria

1. First viewport answers “what next” without tabs.
2. No technical vaccine codes in primary UI.
3. Mark done / reschedule / skip still work.
4. Engines untouched.
