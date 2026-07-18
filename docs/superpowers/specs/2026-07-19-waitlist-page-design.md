# Waitlist Marketing Page Design

**Date:** 2026-07-19  
**Status:** Approved for planning  
**Approach:** Compose from existing waitlist pieces (dedicated route + nav links; reuse form/API)

## Goal

Add a shareable marketing page at `/waitlist` so visitors can join the email waitlist without hunting for the section on Home or Download. Surface the page in the main nav and footer.

## Scope

**In**
- New route: `web/app/(marketing)/waitlist/page.tsx`
- Two-column layout (stacked on mobile): benefits/teaser + existing `WaitlistForm`
- Page metadata (title, description) for SEO
- “Waitlist” link in `Navbar` (desktop + mobile) and Footer → Product
- `/waitlist` entry in `sitemap.ts`

**Out**
- New form fields (name, pet type, etc.)
- Schema/API/Firestore changes
- Admin dashboard changes
- Replacing or removing `WaitlistSection` on Home / Download
- Custom `source` value beyond existing `"web"` | `"app"`

## UX

### Layout

| Region | Content |
|--------|---------|
| Left (top on mobile) | H1 “Join the waitlist”, short subcopy, 3 benefit bullets |
| Right (below on mobile) | `WaitlistForm` in a simple surface/card + privacy note |

Benefit bullets align with existing product messaging:

1. Vet-aligned vaccination and deworming schedules  
2. Health records in one place  
3. Pet journey stages for dogs and cats  

Subcopy tone matches current waitlist section: product updates / news, no spam.

### Form behavior

Reuse `WaitlistForm` unchanged:

- Email only; submit → `POST /api/waitlist` with `{ email, source: "web" }`
- Existing states: loading, success, already registered, error, unavailable
- No new client validation beyond the current form + API schema

### Navigation

- Navbar links array: add `{ href: "/waitlist", label: "Waitlist" }` immediately before Contact
- Footer Product list: add `{ href: "/waitlist", label: "Waitlist" }` (with Features / Pricing / Download / Blog)

## Architecture

```
/waitlist page (marketing layout)
  → WaitlistForm (client)
    → GET/POST /api/waitlist
      → lib/data/waitlist (Firestore via Firebase Admin)
```

No new data layer. Home and Download keep embedding `WaitlistSection` as today.

### Files to touch

| File | Change |
|------|--------|
| `web/app/(marketing)/waitlist/page.tsx` | New page |
| `web/components/marketing/Navbar.tsx` | Add Waitlist link |
| `web/components/marketing/Footer.tsx` | Add Waitlist link |
| `web/app/sitemap.ts` | Add `/waitlist` |

Optional: thin wrapper component only if the page JSX gets noisy; prefer keeping markup in the page file (Contact-style) unless reuse is needed.

## Error handling

Inherited from `WaitlistForm` / `/api/waitlist`:

- Invalid email → client/API validation message  
- Duplicate → “already on the waitlist”  
- Storage not configured (503) → unavailable message  
- Network failure → retry message  

No page-level error boundary beyond the marketing `error.tsx`.

## Testing

Manual / light verification:

- `/waitlist` renders (not 404) in marketing shell  
- Form submit success path works when Firebase Admin is configured  
- Nav and footer links reach `/waitlist`  
- Sitemap includes `/waitlist`  
- Mobile: stacked layout readable; desktop: two columns  

No new automated tests required unless the repo already tests marketing pages similarly (it does not for Contact).

## Success criteria

1. `http://localhost:3000/waitlist` shows the waitlist page (not 404)  
2. User can submit an email and see success / already / error states  
3. Waitlist appears in header and footer navigation  
4. Existing Home/Download waitlist sections and admin waitlist still work unchanged  
