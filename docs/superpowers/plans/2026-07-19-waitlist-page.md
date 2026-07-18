# Waitlist Marketing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dedicated `/waitlist` marketing page with benefits + existing form, linked from navbar and footer.

**Architecture:** New Next.js App Router page under `(marketing)` reuses `WaitlistForm` and `/api/waitlist`. Nav/footer/sitemap get a Waitlist link. No API or schema changes.

**Tech Stack:** Next.js (App Router), React, TypeScript, Tailwind, existing marketing UI (`Card`, `WaitlistForm`)

## Global Constraints

- Reuse `WaitlistForm` unchanged; keep `source: "web"`
- No new form fields, schema, API, or admin changes
- Do not remove Home/Download `WaitlistSection`
- Match Contact page layout patterns and design tokens (stone/primary/surface)
- Navbar: Waitlist link immediately before Contact
- Footer Product: add Waitlist alongside Features / Pricing / Download / Blog

---

## File map

| File | Responsibility |
|------|----------------|
| `web/app/(marketing)/waitlist/page.tsx` | Page UI + metadata |
| `web/components/marketing/Navbar.tsx` | Header Waitlist link |
| `web/components/marketing/Footer.tsx` | Footer Waitlist link |
| `web/app/sitemap.ts` | Include `/waitlist` |

---

### Task 1: Waitlist page route

**Files:**
- Create: `web/app/(marketing)/waitlist/page.tsx`
- Test: manual — open `/waitlist`

**Interfaces:**
- Consumes: `WaitlistForm` from `@/components/marketing/WaitlistForm`, `Card` from `@/components/ui/Card`
- Produces: default export `WaitlistPage` at route `/waitlist`

- [ ] **Step 1: Create the page**

```tsx
import { WaitlistForm } from "@/components/marketing/WaitlistForm";
import { Card } from "@/components/ui/Card";
import { CalendarCheck, FolderHeart, PawPrint } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Waitlist",
  description:
    "Join the Pawfect waitlist for product updates and news. Vet-aligned schedules, health records, and pet journey stages.",
};

const benefits = [
  {
    icon: CalendarCheck,
    title: "Vet-aligned schedules",
    body: "Vaccination and deworming timelines tailored for dogs and cats.",
  },
  {
    icon: FolderHeart,
    title: "Health records in one place",
    body: "Keep visits, vaccines, and notes organized without the paper chase.",
  },
  {
    icon: PawPrint,
    title: "Pet journey stages",
    body: "Know what care matters next as your pet grows.",
  },
] as const;

export default function WaitlistPage(): React.ReactElement {
  return (
    <div className="py-24 md:py-32">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-start lg:px-8">
        <div>
          <h1 className="text-4xl font-bold text-stone-900 dark:text-stone-50">
            Join the waitlist
          </h1>
          <p className="mt-4 text-lg text-stone-600 dark:text-stone-400">
            Get product updates and news about Pawfect. No spam — unsubscribe anytime.
          </p>
          <ul className="mt-10 space-y-6">
            {benefits.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/20">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="font-semibold text-stone-900 dark:text-stone-50">{title}</p>
                  <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <Card className="hover:translate-y-0 hover:shadow-card">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
            Notify me
          </h2>
          <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
            Drop your email and we&apos;ll let you know when there&apos;s news.
          </p>
          <div className="mt-6">
            <WaitlistForm />
          </div>
          <p className="mt-4 text-xs text-stone-500 dark:text-stone-500">
            We only use your email for waitlist updates. See our{" "}
            <a
              href="/privacy"
              className="underline decoration-stone-400 underline-offset-2 hover:text-primary"
            >
              Privacy Policy
            </a>
            .
          </p>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify route loads**

Run (with web dev server): open `http://localhost:3000/waitlist`  
Expected: page renders with headline, 3 benefits, form — not 404

- [ ] **Step 3: Commit**

```bash
git add web/app/\(marketing\)/waitlist/page.tsx
git commit -m "feat(web): add waitlist marketing page"
```

---

### Task 2: Nav, footer, and sitemap

**Files:**
- Modify: `web/components/marketing/Navbar.tsx` (links array)
- Modify: `web/components/marketing/Footer.tsx` (Product links)
- Modify: `web/app/sitemap.ts` (staticRoutes)
- Test: manual — click nav/footer links; confirm sitemap entry

**Interfaces:**
- Consumes: `/waitlist` route from Task 1
- Produces: discoverable links to Waitlist in chrome + sitemap

- [ ] **Step 1: Update Navbar links**

In `web/components/marketing/Navbar.tsx`, change `links` to:

```ts
const links = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
  { href: "/waitlist", label: "Waitlist" },
  { href: "/contact", label: "Contact" },
];
```

- [ ] **Step 2: Update Footer Product links**

In `web/components/marketing/Footer.tsx`, change the Product array to:

```ts
{[
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/download", label: "Download" },
  { href: "/blog", label: "Blog" },
  { href: "/waitlist", label: "Waitlist" },
].map((l) => (
```

- [ ] **Step 3: Add sitemap entry**

In `web/app/sitemap.ts`, add `"/waitlist"` to `staticRoutes` (after `"/download"` is fine):

```ts
const staticRoutes = [
  "",
  "/features",
  "/pricing",
  "/about",
  "/blog",
  "/contact",
  "/download",
  "/waitlist",
  "/privacy",
  "/terms",
].map((path) => ({
```

- [ ] **Step 4: Verify links**

Expected: header and footer “Waitlist” navigate to `/waitlist`; sitemap includes `/waitlist`

- [ ] **Step 5: Commit**

```bash
git add web/components/marketing/Navbar.tsx web/components/marketing/Footer.tsx web/app/sitemap.ts
git commit -m "feat(web): link waitlist in nav, footer, and sitemap"
```

---

## Spec coverage

| Spec requirement | Task |
|------------------|------|
| `/waitlist` page, two-column layout | Task 1 |
| Benefits + WaitlistForm + privacy note | Task 1 |
| Metadata | Task 1 |
| Navbar before Contact | Task 2 |
| Footer Product link | Task 2 |
| sitemap `/waitlist` | Task 2 |
| No API/schema/admin changes | (none — intentional) |
| Keep Home/Download sections | (none — intentional) |
