import { AppGallerySection } from "@/components/marketing/AppGallerySection";
import { CommitmentSection } from "@/components/marketing/CommitmentSection";
import { ContrastSection } from "@/components/marketing/ContrastSection";
import { DownloadCTA } from "@/components/marketing/DownloadCTA";
import { HomeWidgetsShowcaseSection } from "@/components/marketing/HomeWidgetsShowcaseSection";
import { FeaturesSection } from "@/components/marketing/FeaturesSection";
import { HeroSection } from "@/components/marketing/HeroSection";
import { HomeFaqSection } from "@/components/marketing/HomeFaqSection";
import { HomeJsonLd } from "@/components/marketing/HomeJsonLd";
import { HowItWorksSection } from "@/components/marketing/HowItWorksSection";
import { LossAversionSection } from "@/components/marketing/LossAversionSection";
import { PetJourneySection } from "@/components/marketing/PetJourneySection";
import { PricingPreviewSection } from "@/components/marketing/PricingPreviewSection";
import { SocialProofBar } from "@/components/marketing/SocialProofBar";
import { SpeciesSection } from "@/components/marketing/SpeciesSection";
import { TestimonialsSection } from "@/components/marketing/TestimonialsSection";
import { getActivePricingPlans } from "@/lib/data/pricing";
import { getSiteContentMarketing } from "@/lib/data/site-content";
import type { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: "Pawfect: Pet Care & Reminders for Dogs & Cats" },
  description:
    "Age-aware vaccine and deworming schedules, daily care reminders and health records for dogs and cats. Free on iPhone and Android.",
  openGraph: {
    title: "Pawfect: Pet Care & Reminders for Dogs & Cats",
    description:
      "Age-aware vaccine and deworming schedules, daily care reminders and health records for dogs and cats. Free on iPhone and Android.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pawfect: Pet Care & Reminders for Dogs & Cats",
    description:
      "Age-aware vaccine and deworming schedules, daily care reminders and health records for dogs and cats. Free on iPhone and Android.",
  },
  robots: { index: true, follow: true },
};

export default async function HomePage(): Promise<React.ReactElement> {
  const [plans, site] = await Promise.all([getActivePricingPlans(), getSiteContentMarketing()]);

  return (
    <>
      <HomeJsonLd />
      <HeroSection site={site} />
      <SocialProofBar trustBadges={site.trustBadges} />
      <LossAversionSection />
      <FeaturesSection />
      <AppGallerySection />
      <HowItWorksSection />
      <ContrastSection />
      <PetJourneySection />
      <SpeciesSection />
      <TestimonialsSection items={site.testimonials} />
      <PricingPreviewSection plans={plans} />
      <CommitmentSection />
      <HomeWidgetsShowcaseSection />
      <HomeFaqSection />
      <DownloadCTA />
    </>
  );
}
