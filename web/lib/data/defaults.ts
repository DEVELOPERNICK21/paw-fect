import type { PricingPlan, SiteContentMarketing } from "@/types";

export const defaultSiteContent = (): SiteContentMarketing => ({
  heroHeadline: "Your pet's health, perfectly scheduled.",
  heroSubline:
    "Pawfect gives dog and cat owners a vet-validated health timeline — vaccinations, deworming, and life stage milestones — all in one beautiful app.",
  trustBadges: [
    "Vet-validated protocols",
    "Dogs & cats",
    "Works offline",
    "India-first",
  ],
  testimonials: [
    {
      id: "1",
      name: "Priya S.",
      petName: "Max",
      species: "Dog",
      quote:
        "Max got his Rabies booster on exactly the right day. Pawfect sent me a reminder 5 days before and again on the day. My vet was impressed we had the records ready.",
      stars: 5,
    },
    {
      id: "2",
      name: "Arjun M.",
      petName: "Milo",
      species: "Cat",
      quote:
        "The deworming timeline caught up with Milo's outdoor habits. I used to guess dates — now I just follow the app.",
      stars: 5,
    },
    {
      id: "3",
      name: "Neha K.",
      petName: "Bruno",
      species: "Dog",
      quote:
        "Offline mode saved me at the clinic with no signal. Synced everything when I got home.",
      stars: 5,
    },
  ],
  pricingFaqs: [
    {
      id: "1",
      question: "Is Pawfect a substitute for veterinary care?",
      answer:
        "No. Pawfect helps you track schedules and records; always consult your vet for medical decisions.",
    },
    {
      id: "2",
      question: "Can I export my pet's records?",
      answer:
        "Paid plans include PDF export for boarding, grooming, and travel.",
    },
    {
      id: "3",
      question: "How does billing work?",
      answer:
        "Subscriptions renew automatically until cancelled. You can cancel anytime from account settings.",
    },
  ],
  appStoreUrl: "https://apps.apple.com/",
  playStoreUrl: "https://play.google.com/store",
  privacyLastUpdated: "2026-04-01",
});

export const defaultPricingPlans = (): Omit<PricingPlan, "id">[] => [
  {
    name: "Free",
    slug: "free",
    priceMonthly: 0,
    priceAnnual: 0,
    currency: "INR",
    maxPets: 1,
    isPopular: false,
    isActive: true,
    ctaLabel: "Start free",
    features: [
      { label: "Basic schedule", included: true, sortOrder: 0 },
      { label: "3 months history", included: true, sortOrder: 1 },
      { label: "Manual entry", included: true, sortOrder: 2 },
      { label: "PDF export", included: false, sortOrder: 3 },
      { label: "Offline sync", included: false, sortOrder: 4 },
    ],
  },
  {
    name: "Care+",
    slug: "care-plus",
    priceMonthly: 149,
    priceAnnual: 1490,
    currency: "INR",
    maxPets: 3,
    isPopular: true,
    isActive: true,
    badgeText: "Most popular",
    ctaLabel: "Upgrade to Care+",
    features: [
      { label: "Full schedule", included: true, sortOrder: 0 },
      { label: "Unlimited history", included: true, sortOrder: 1 },
      { label: "PDF export", included: true, sortOrder: 2 },
      { label: "Offline-first sync", included: true, sortOrder: 3 },
    ],
  },
  {
    name: "Family",
    slug: "family",
    priceMonthly: 299,
    priceAnnual: 2990,
    currency: "INR",
    maxPets: 10,
    isPopular: false,
    isActive: true,
    ctaLabel: "Get Family plan",
    features: [
      { label: "Everything in Care+", included: true, sortOrder: 0 },
      { label: "Multi-user household", included: true, sortOrder: 1 },
      { label: "Vet sharing", included: true, sortOrder: 2 },
      { label: "Priority support", included: true, sortOrder: 3 },
    ],
  },
];
