import { APP_STORE_URL, PLAY_STORE_URL } from "@/lib/store-links";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pawsoul.app";

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
      "Age-aware vaccine and deworming schedules, daily care reminders and health records for dogs and cats. Free on iPhone and Android.",
    url: siteUrl,
    downloadUrl: [APP_STORE_URL, PLAY_STORE_URL],
    installUrl: `${siteUrl}/download`,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
