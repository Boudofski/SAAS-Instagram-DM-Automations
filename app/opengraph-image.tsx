import mark from "@/lib/ap3k-mark.json";
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "AP3K — Turn Instagram attention into action";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "76px 88px",
          color: "white",
          background: "radial-gradient(circle at 82% 18%, rgba(236,72,153,.42), transparent 30%), linear-gradient(135deg, #0B1020 0%, #241052 48%, #6D28D9 100%)",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: 720 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
            <svg width="108" height="108" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="quick-reply" x1="0%" y1="90%" x2="100%" y2="10%">
                  {mark.stops.map(([offset, color]) => <stop key={offset} offset={Number(offset)} stopColor={String(color)} />)}
                </linearGradient>
              </defs>
              <path d={mark.bubble} fill="url(#quick-reply)" />
              <path d={mark.arrow} fill="#fff" />
            </svg>
            <div style={{ fontSize: 72, fontWeight: 900, letterSpacing: -5 }}>AP3K</div>
          </div>
          <div style={{ marginTop: 48, fontSize: 58, lineHeight: 1.03, fontWeight: 900, letterSpacing: -3 }}>
            Turn attention into action.
          </div>
          <div style={{ marginTop: 24, maxWidth: 680, fontSize: 26, lineHeight: 1.4, color: "rgba(255,255,255,.72)" }}>
            Instagram comment replies, DMs and trackable leads—automated.
          </div>
        </div>
        <div style={{ position: "relative", width: 260, height: 390, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", width: 250, height: 250, borderRadius: 999, background: "rgba(255,107,53,.18)", filter: "blur(26px)" }} />
          <div style={{ width: 224, height: 370, borderRadius: 44, border: "2px solid rgba(255,255,255,.24)", background: "rgba(255,255,255,.08)", display: "flex", flexDirection: "column", padding: 24 }}>
            <div style={{ width: 82, height: 8, borderRadius: 99, background: "rgba(255,255,255,.22)", alignSelf: "center" }} />
            <div style={{ marginTop: 54, width: 154, height: 62, borderRadius: 20, background: "rgba(255,255,255,.12)" }} />
            <div style={{ marginTop: 18, marginLeft: 30, width: 142, height: 62, borderRadius: 20, background: "linear-gradient(135deg,#8B5CF6,#EC4899)" }} />
            <div style={{ marginTop: 18, width: 164, height: 62, borderRadius: 20, background: "rgba(255,255,255,.12)" }} />
          </div>
        </div>
      </div>
    ),
    size
  );
}
