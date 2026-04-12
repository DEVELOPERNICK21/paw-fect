export interface PricingFeatureRow {
  label: string;
  included: boolean;
  tooltip?: string;
  sortOrder: number;
}

export interface PricingPlan {
  id: string;
  name: string;
  slug: string;
  priceMonthly: number;
  priceAnnual: number;
  currency: string;
  maxPets: number;
  isPopular: boolean;
  isActive: boolean;
  badgeText?: string;
  ctaLabel: string;
  features: PricingFeatureRow[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "new" | "read" | "replied";
  createdAt: string;
}

export interface WaitlistEntry {
  id: string;
  email: string;
  source: "web" | "app";
  createdAt: string;
}

export interface Testimonial {
  id: string;
  name: string;
  petName: string;
  species: string;
  quote: string;
  stars: number;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface SiteContentMarketing {
  heroHeadline: string;
  heroSubline: string;
  trustBadges: string[];
  testimonials: Testimonial[];
  pricingFaqs: FaqItem[];
  appStoreUrl: string;
  playStoreUrl: string;
  privacyLastUpdated: string;
  updatedAt?: string;
}

export interface BlogFrontmatter {
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
}
