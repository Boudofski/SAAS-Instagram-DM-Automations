import { copyFile } from "node:fs/promises";

// Preserve the approved optical variants: never shrink the detailed mark to 16px.
const root = new URL("../", import.meta.url);
for (const [source, target] of [
  ["favicon.svg", "app/icon.svg"],
  ["favicon.svg", "public/brand/ap3k-favicon.svg"],
  ["favicon.ico", "app/favicon.ico"],
  ["icon-512.png", "app/icon.png"],
  ["apple-touch-icon.png", "app/apple-icon.png"],
]) {
  await copyFile(new URL(`public/brand/v2/${source}`, root), new URL(target, root));
}
