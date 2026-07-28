import type { SiteContentMarketing } from "@/types";

/** Rewrite legacy Pawfect brand strings in CMS / marketing copy. */
export function rebrandCopy(text: string): string {
  return text
    .replaceAll("Pawfect+", "Pawsoul+")
    .replaceAll("Paw-fect", "Pawsoul")
    .replaceAll("Pawfect", "Pawsoul")
    .replaceAll("pawfect.app", "pawsoul.app")
    .replaceAll("paw-fect.vercel.app", "pawsoul.app");
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
