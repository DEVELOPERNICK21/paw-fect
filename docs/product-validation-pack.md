# Pawsoul Product Validation Pack

Living reference for validating the app idea with users, investors, or teammates. Derived from codebase docs and feature direction as of 2026.

---

## 1) Product In One Line

**Pawsoul** is a **mobile pet care companion** that helps pet parents keep pets healthy through **profiles, smart health schedules, reminders, and notifications**, with an offline-first experience and a social sharing loop.

*(Internal docs also use "Pet Perfect" — same product.)*

---

## 2) Problem You’re Solving

- Pet parents forget or delay critical care (vaccines, deworming, meds, grooming, routine checks).
- Pet health information is fragmented (memory, chats, paper, different apps).
- Many users need reliability even with weak connectivity (offline-first design).

---

## 3) Target User (Current Best Fit)

| Segment | Why |
| -------- | --- |
| **Primary** | Dog/cat owners, especially new pet parents |
| **Secondary** | Multi-pet households (pet switching, family-tier subscription direction) |
| **Early adopter** | Owners who already try to track care but feel inconsistent or anxious |

---

## 4) Core Product Scope

What the product is built around (MVP + extensions in flight):

| Area | Capability |
| ---- | ----------- |
| Auth + onboarding | Sign-in, onboarding, pet-required gate |
| Pet profiles | Multi-pet, active pet, photos, breed/DOB |
| Reminders | Vaccination, medication, grooming, custom |
| Local notifications | Scheduled alerts, inbox, deferred resync |
| Health records | Manual records + **smart health** (auto schedules) |
| Home dashboard | Today care, upcoming week, milestones, attention banners |
| Schedule / wellness | Daily care blocks, wellness hub |
| Offline-first | Local DB primary, background sync, queue + LWW conflicts |
| Subscriptions | Entitlement bootstrap, Firestore sync, Android Play billing |
| Growth | Pet health share card (identity-first PNG for Stories/WhatsApp) |

**Planned / future (from architecture docs):** vet booking, pet community, food recommendations, wearable integrations, iOS IAP parity, Razorpay paywall UI.

---

## 5) Signature Value Proposition

Test these messages with users:

1. *“I always know what my pet needs next.”*
2. *“I don’t miss important health tasks.”*
3. *“I can show my pet’s progress in a beautiful shareable way.”*

---

## 6) Differentiators To Validate

| Differentiator | Detail |
| -------------- | ------ |
| **Smart health logic** | Age-based deworming (14d puppies → 90d adults); dog/cat vaccination series + boosters; pending / completed / overdue / skipped |
| **Identity + utility** | Share card leads with pet identity; health snapshot is secondary (viral-friendly) |
| **Offline-first** | UI reads local data; writes local first; sync in background |
| **Milestone moments** | Celebration modal on series complete, rabies, first-ever completion → share funnel |

---

## 7) Smart Health System (Product Detail)

**Task types:** Deworming, vaccination.

**Urgency (UI):** Overdue (red) · Due soon ≤7 days (amber) · Upcoming (green) · Completed (gray).

**Deworming defaults:**

| Pet age | Frequency |
| ------- | --------- |
| &lt; 12 weeks | Every 14 days |
| ≥ 12 weeks | Every 90 days |

**Vaccination:** Template-driven per species (DHPP/FVRCP series, Rabies yearly). Series logic for pets &lt; 6 months vs adult boosters only.

---

## 8) Monetization Direction

- Plans: **Care Plus**, **Family** (see `src/shared/subscription/`)
- Flow: `POST /api/entitlement/bootstrap` after sign-in → Firestore `users/{uid}.entitlement` listener
- Android: Google Play verify route
- **Gaps:** iOS StoreKit, Razorpay in paywall UI, analytics at scale

**Positioning to test:** Free core utility + premium for multi-pet / advanced features.

---

## 9) Growth Loop (Share Card)

**Purpose:** One-tap shareable PNG (1080×1350) — pet identity + health snapshot for Instagram Stories / WhatsApp.

**Entry points:**

- Pet Profile → “Share health card”
- Post-milestone modal (series complete, rabies, first-ever completion)

**Install link (v1):** `https://paw-fect.vercel.app/download`

**Privacy on card:** Name, breed, age label, task labels/status — no raw DOB, notes, vet PII, or attachments.

---

## 10) Tech Stack (Context For Stakeholders)

- React Native, TypeScript strict, Zustand
- Clean Architecture, feature-first modules
- SQLite + MMKV, Firebase (auth, Firestore entitlement)
- Next.js backend on Vercel (`web/`)
- Notifee notifications, Crashlytics

---

## 11) Risks / Gaps To Validate Early

1. Is **auto-scheduling** must-have vs plain reminders?
2. Does the **share card** drive installs or only engagement?
3. Will users **pay** before vet booking / wearables / community?
4. **Android-first billing** — iOS users need a path or you skew interviews to Android.
5. Trust: wrong schedule = churn; validate breed/age edge cases in interviews.

---

## 12) Validation Hypotheses

| ID | Hypothesis |
| -- | ---------- |
| H1 | Users switch from manual tracking because auto-scheduling reduces anxiety |
| H2 | “Next due” + overdue highlighting increases weekly active usage |
| H3 | Share-card milestone moments create referral-worthy behavior |
| H4 | Multi-pet users are the highest-conversion paid segment |
| H5 | Offline reliability is a meaningful acquisition/retention differentiator |

---

## 13) Customer Interview Questions (10)

1. How do you currently track vaccines, deworming, and meds?
2. What gets missed most often?
3. What happens when a task is missed?
4. Would auto-generated schedules feel trustworthy or risky?
5. Would you pay to avoid missing health tasks? How much?
6. What proof/history do you need to trust an app like this?
7. Would you share your pet’s health progress (public story vs private DM)?
8. What would make you uninstall in week 1?
9. If this app disappeared, what would you do instead?
10. Which **one** feature is non-negotiable for you?

---

## 14) Metrics To Track First

| Stage | Metric |
| ----- | ------ |
| Activation | Onboarding complete + first pet added |
| Aha | First health task marked complete |
| Habit | Tasks completed per pet per week |
| Reliability | Notification tap → return rate |
| Growth | Share screen → system share → download page visits |
| Revenue | Paywall view → checkout start → active entitlement |

---

## 15) ICP + Positioning Statement (Draft)

**For** busy pet parents (especially new or multi-pet households),  
**Pawsoul** is the pet health routine app  
**that** automatically structures vaccines, deworming, and reminders and keeps you on track—even offline—  
**while** turning milestones into shareable moments.

**Unlike** generic reminder apps, Pawsoul encodes species- and age-aware care schedules and surfaces what matters today on one home screen.

---

## 16) Go / No-Go Signals (2-Week Sprint)

**Go (continue / double down):**

- ≥60% of interviewed target users rank “never miss vaccines/deworming” as top-3 pain
- ≥40% say they’d try auto-schedules if accurate for dog/cat
- ≥25% share-card mock/wireframe gets “I’d post this” without prompting
- 5+ users complete a paper/wizard prototype flow and ask when app ships

**Pivot / narrow:**

- Users only want generic reminders → simplify MVP, delay smart health marketing
- Trust barrier on auto schedules → lead with manual log + optional “turn on smart schedule”
- No sharing intent → deprioritize growth card; focus retention + notifications

**Stop / pause:**

- No willingness to pay and no engagement with “next due” concept in tests
- Acquisition channel unclear after 20+ interviews with no referral story

---

## 17) Related Docs In Repo

| Doc | Topic |
| --- | ----- |
| `docs/architecture.md` | MVP feature set, models, navigation |
| `docs/health-system.md` | Deworming/vaccination rules |
| `docs/pet-health-share-card-design.md` | Share card spec |
| `docs/subscription-launch-checklist.md` | Billing launch |
| `.cursor/system.md` | Offline-first, orchestration |

---

## 18) Quick Reference — Module Map

```
auth/          → login, profile, session
pets/          → profiles, share card, health details
reminders/     → custom reminders
records/       → health records, smart health engine
schedule/      → daily care, wellness
subscription/  → entitlement, Play checkout
app/           → home dashboard, celebrations
settings/      → preferences, onboarding flag
notifications/ → feed sync
```

---

*Update this file when positioning, pricing, or MVP scope changes.*
