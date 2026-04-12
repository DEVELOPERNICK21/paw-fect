import type { MetadataRoute } from "next";

const base =
  process.env.NEXT_PUBLIC_SITE_URL && /^https?:\/\//.test(process.env.NEXT_PUBLIC_SITE_URL)
    ? process.env.NEXT_PUBLIC_SITE_URL
    : "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/dashboard/", "/api/"] },
    sitemap: `${base}/sitemap.xml`,
  };
}
