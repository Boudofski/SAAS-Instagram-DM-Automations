import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AP3K — Instagram DM Automation Tool",
    short_name: "AP3K",
    description: "Turn Instagram comments into instant replies, DMs and trackable leads.",
    start_url: "/",
    display: "standalone",
    background_color: "#EEF1F6",
    theme_color: "#6D28D9",
    icons: [
      { src: "/brand/v2/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/v2/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/brand/v2/maskable-icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
