import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/dashboard/", "/onboarding/", "/payment", "/callback/"],
      },
    ],
    sitemap: "https://ap3k.com/sitemap.xml",
  };
}
