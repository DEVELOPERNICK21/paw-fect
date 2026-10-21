import { PricingFaq } from "@/components/marketing/PricingFaq";
import { homeFaqs } from "@/lib/data/home-faq";

/** FAQ block + FAQPage structured data (answers objections right before the final CTA). */
export function HomeFaqSection(): React.ReactElement {
  const json = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: homeFaqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <PricingFaq items={homeFaqs} heading="Questions before you download?" subheading="Straight answers. Tap to expand." />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />
    </div>
  );
}
