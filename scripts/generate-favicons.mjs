import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const root = new URL("../", import.meta.url);
const { bubble, arrow, stops } = JSON.parse(await readFile(new URL("lib/ap3k-mark.json", root), "utf8"));
const title = "<title>AP3K</title>";
const gradient = `<defs><linearGradient id="quick-reply" x1="0%" y1="90%" x2="100%" y2="10%">${stops.map(([offset, color]) => `<stop offset="${offset}" stop-color="${color}"/>`).join("")}</linearGradient></defs>`;
const mark = (fill = "url(#quick-reply)") => `<path d="${bubble}" fill="${fill}"/><path d="${arrow}" fill="#fff"/>`;
const mono = (color) => `<path d="${bubble}${arrow}" fill="${color}" fill-rule="evenodd"/>`;
const svg = (body, width = 100, height = width) => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${title}${body}</svg>\n`;
const save = (path, data) => writeFile(new URL(path, root), data);
const symbol = svg(gradient + mark());
const square = (inset) => svg(`<rect width="100" height="100" fill="#fff"/>${gradient}<g transform="translate(${inset} ${inset}) scale(${(100 - 2 * inset) / 100})">${mark()}</g>`);
const lockup = (ink) => svg(`${gradient}<g transform="translate(2 2) scale(.96)">${mark()}</g><text x="115" y="76" fill="${ink}" font-family="Plus Jakarta Sans, Inter, Arial, sans-serif" font-size="74" font-weight="800" letter-spacing="-4">AP3K</text>`, 330, 100);
const png = (source, size) => sharp(Buffer.from(source), { density: 600 }).resize(size, size).png().toBuffer();
const [icon, apple, avatar, maskable] = await Promise.all([png(square(9), 512), png(square(9), 180), png(square(15), 512), png(square(21), 512)]);
await Promise.all([
  save("app/icon.svg", symbol),
  save("app/icon.png", icon),
  save("app/apple-icon.png", apple),
  save("public/brand/ap3k-mark.svg", symbol),
  save("public/brand/ap3k-favicon.svg", symbol),
  save("public/brand/ap3k-mark-mono-dark.svg", svg(mono("#0B1020"))),
  save("public/brand/ap3k-mark-mono-light.svg", svg(mono("#fff"))),
  save("public/brand/ap3k-logo-on-light.svg", lockup("#0B1020")),
  save("public/brand/ap3k-logo-on-dark.svg", lockup("#fff")),
  save("public/brand/ap3k-social-avatar.png", avatar),
  save("public/brand/ap3k-maskable.png", maskable),
  save("public/bimi/ap3k-logo.svg", `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" version="1.2" baseProfile="tiny-ps" width="512" height="512" viewBox="0 0 100 100">${title}<rect width="100" height="100" fill="#fff"/>${mark("#6D28D9")}</svg>\n`),
]);

const sizes = [16, 32, 48, 64, 256];
const frames = await Promise.all(sizes.map((size) => png(symbol, size)));
const directory = Buffer.alloc(6 + sizes.length * 16);
directory.writeUInt16LE(1, 2);
directory.writeUInt16LE(sizes.length, 4);
let offset = directory.length;
frames.forEach((frame, index) => {
  const entry = 6 + index * 16;
  directory[entry] = sizes[index] % 256;
  directory[entry + 1] = sizes[index] % 256;
  directory.writeUInt16LE(1, entry + 4);
  directory.writeUInt16LE(32, entry + 6);
  directory.writeUInt32LE(frame.length, entry + 8);
  directory.writeUInt32LE(offset, entry + 12);
  offset += frame.length;
});
await save("app/favicon.ico", Buffer.concat([directory, ...frames]));
