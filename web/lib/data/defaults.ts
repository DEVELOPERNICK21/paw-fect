import type { PricingPlan, SiteContentMarketing } from "@/types";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/lib/store-links";

export const defaultSiteContent = (): SiteContentMarketing => ({
  heroHeadline: "Stop missing what your pet needs next.",
  heroSubline:
    "Age-aware vaccine and deworming schedules, daily care reminders and health records for dogs and cats, all in one app. Free to start.",
  trustBadges: [
    "Age-aware schedules",
    "Dogs & cats",
    "iPhone & Android",
    "Free to start",
  ],
  testimonials: [],
  pricingFaqs: [
    {
      id: "1",
      question: "Is Pawfect a substitute for veterinary care?",
      answer:
        "No. Pawfect helps you track schedules and records; always consult your vet for medical decisions.",
    },
    {
      id: "2",
      question: "How many pets can I add?",
      answer:
        "The free plan covers one pet, Care+ covers up to three, and Family covers up to ten.",
    },
    {
      id: "3",
      question: "How does billing work?",
      answer:
        "Subscriptions renew automatically until cancelled. You can cancel anytime from account settings.",
    },
  ],
  appStoreUrl: APP_STORE_URL,
  playStoreUrl: PLAY_STORE_URL,
  privacyLastUpdated: "2026-05-06",
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
      { label: "1 pet", included: true, sortOrder: 0 },
      { label: "Vaccine & deworming schedule", included: true, sortOrder: 1 },
      { label: "Care reminders", included: true, sortOrder: 2 },
      { label: "3 months of history", included: true, sortOrder: 3 },
      { label: "Offline access with sync", included: false, sortOrder: 4 },
      { label: "Wellness score & Pro care tasks", included: false, sortOrder: 5 },
    ],
  },
  {
    name: "Care+",
    slug: "care-plus",
    priceWeekly: 49,
    priceMonthly: 149,
    priceAnnual: 1499,
    currency: "INR",
    maxPets: 3,
    isPopular: true,
    isActive: true,
    badgeText: "Most popular",
    ctaLabel: "Upgrade to Care+",
    features: [
      { label: "Up to 3 pets", included: true, sortOrder: 0 },
      { label: "Everything in Free", included: true, sortOrder: 1 },
      { label: "Unlimited history", included: true, sortOrder: 2 },
      { label: "Offline access with sync", included: true, sortOrder: 3 },
      { label: "Wellness score & Pro care tasks", included: true, sortOrder: 4 },
      { label: "Weekly, monthly or annual billing", included: true, sortOrder: 5 },
    ],
  },
  {
    name: "Family",
    slug: "family",
    priceMonthly: 299,
    priceAnnual: 2999,
    currency: "INR",
    maxPets: 10,
    isPopular: false,
    isActive: true,
    ctaLabel: "Get Family plan",
    features: [
      { label: "Up to 10 pets", included: true, sortOrder: 0 },
      { label: "Everything in Care+", included: true, sortOrder: 1 },
      { label: "Priority support", included: true, sortOrder: 2 },
    ],
  },
];
