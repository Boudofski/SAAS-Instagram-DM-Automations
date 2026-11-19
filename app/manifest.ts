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
      { src: "/icon-192.png?v=2", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png?v=2", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/maskable-icon-512.png?v=2", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/apple-touch-icon.png?v=2", sizes: "180x180", type: "image/png" },
    ],
  };
}
