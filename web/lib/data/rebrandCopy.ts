import type { SiteContentMarketing } from "@/types";

/**
 * Normalise legacy brand strings in CMS / marketing copy to the current store name.
 * (Domains and email addresses are left alone.)
 */
export function rebrandCopy(text: string): string {
  return text.replaceAll("Pawsoul", "Pawfect").replaceAll("Paw-fect", "Pawfect");
}

export function rebrandSiteContent(
  content: SiteContentMarketing,
): SiteContentMarketing {
  return {
    ...content,
    heroHeadline: rebrandCopy(content.heroHeadline),
    heroSubline: rebrandCopy(content.heroSubline),
    trustBadges: content.trustBadges.map(rebrandCopy),
    testimonials: content.testimonials.map((t) => ({
      ...t,
      name: rebrandCopy(t.name),
      petName: rebrandCopy(t.petName),
      species: rebrandCopy(t.species),
      quote: rebrandCopy(t.quote),
    })),
    pricingFaqs: content.pricingFaqs.map((f) => ({
      ...f,
      question: rebrandCopy(f.question),
      answer: rebrandCopy(f.answer),
    })),
  };
}
