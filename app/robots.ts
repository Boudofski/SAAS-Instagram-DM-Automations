import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        // Meta fetches product-card photos from this public endpoint.
        // Keep other API routes blocked; image responses remain noindex.
        allow: ["/", "/api/automation-images/"],
        disallow: [
          "/admin/",
          "/ap3k-admin/",
          "/ap3k-admin-v2/",
          "/api/",
          "/dashboard/",
          "/onboarding/",
          "/payment",
          "/callback/",
        ],
      },
    ],
    sitemap: "https://ap3k.com/sitemap.xml",
  };
}
