import { copyFile } from "node:fs/promises";

// Preserve the approved optical variants: never shrink the detailed mark to 16px.
const root = new URL("../", import.meta.url);
for (const [source, target] of [
  ["favicon.svg", "public/favicon.svg"],
  ["favicon.svg", "public/brand/ap3k-favicon.svg"],
  ["favicon.ico", "public/favicon.ico"],
  ["favicon-16.png", "public/favicon-16.png"],
  ["favicon-32.png", "public/favicon-32.png"],
  ["favicon-48.png", "public/favicon-48.png"],
  ["icon-192.png", "public/icon-192.png"],
  ["icon-512.png", "public/icon-512.png"],
  ["icon-512.png", "public/icon.png"],
  ["maskable-icon-512.png", "public/maskable-icon-512.png"],
  ["apple-touch-icon.png", "public/apple-touch-icon.png"],
]) {
  await copyFile(new URL(`public/brand/v2/${source}`, root), new URL(target, root));
}
