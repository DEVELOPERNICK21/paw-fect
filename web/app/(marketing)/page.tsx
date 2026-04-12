import { AppGallerySection } from "@/components/marketing/AppGallerySection";
import { DownloadCTA } from "@/components/marketing/DownloadCTA";
import { FeaturesSection } from "@/components/marketing/FeaturesSection";
import { HeroSection } from "@/components/marketing/HeroSection";
import { HomeJsonLd } from "@/components/marketing/HomeJsonLd";
import { HowItWorksSection } from "@/components/marketing/HowItWorksSection";
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
  title: "Pawfect — Smart Pet Health Scheduling",
  description:
    "Vet-validated vaccination and deworming schedules, pet journey stages, and health records for dogs and cats.",
  openGraph: {
    title: "Pawfect — Smart Pet Health Scheduling",
    description:
      "Vet-validated vaccination and deworming schedules, pet journey stages, and health records for dogs and cats.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pawfect — Smart Pet Health Scheduling",
    description:
      "Vet-validated vaccination and deworming schedules, pet journey stages, and health records for dogs and cats.",
  },
  robots: { index: true, follow: true },
};

export default async function HomePage(): Promise<React.ReactElement> {
  const [plans, site] = await Promise.all([getActivePricingPlans(), getSiteContentMarketing()]);

  return (
    <>
      <HomeJsonLd />
      <HeroSection site={site} />
      <SocialProofBar />
      <FeaturesSection />
      <AppGallerySection />
      <HowItWorksSection />
      <PetJourneySection />
      <SpeciesSection />
      <TestimonialsSection items={site.testimonials} />
      <PricingPreviewSection plans={plans} />
      <DownloadCTA />
    </>
  );
}
