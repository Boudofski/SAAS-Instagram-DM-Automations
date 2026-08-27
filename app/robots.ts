import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/ap3k-admin/",
          "/ap3k-admin-v2/",
          "/api/",
          "/dashboard/",
          "/onboarding/",
          "/payment",
          "/callback/",
          "/sign-in/",
          "/sign-up/",
        ],
      },
    ],
    sitemap: "https://ap3k.com/sitemap.xml",
  };
}
