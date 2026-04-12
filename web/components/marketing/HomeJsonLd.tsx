const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pawfect.app";

export function HomeJsonLd(): React.ReactElement {
  const json = {
    "@context": "https://schema.org",
    "@type": "MobileApplication",
    name: "Pawfect",
    operatingSystem: "iOS, Android",
    applicationCategory: "HealthApplication",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
    },
    description:
      "Vet-validated vaccination, deworming, and pet journey schedules for dogs and cats.",
    url: siteUrl,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
