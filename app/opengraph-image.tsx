import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Language Hub | Hub of Language Excellence";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #17131f 0%, #221e2b 55%, #2a2438 100%)",
          padding: 64,
          fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "linear-gradient(135deg, #6e5ae0 0%, #d63a8c 100%)",
              color: "#fff",
              fontSize: 30,
              fontWeight: 800,
            }}
          >
            LH
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", color: "#faf8f4", fontSize: 30, fontWeight: 800, letterSpacing: 1 }}>
              LANGUAGE HUB
            </div>
            <div style={{ display: "flex", color: "#c2a05c", fontSize: 17, fontWeight: 600, letterSpacing: 3 }}>
              HUB OF LANGUAGE EXCELLENCE
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              display: "flex",
              background: "linear-gradient(90deg, #6e5ae0 0%, #d63a8c 45%, #c2a05c 100%)",
              WebkitBackgroundClip: "text",
              color: "transparent",
              fontSize: 64,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -1,
            }}
          >
            Speak. Write. Shine.
          </div>
          <div style={{ display: "flex", color: "#d9d4e6", fontSize: 26, fontWeight: 500, maxWidth: 900, lineHeight: 1.35 }}>
            English fluency, confidence and creative expression through practical, interactive learning with Javeria Malik.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 28, color: "#7d768a", fontSize: 20, fontWeight: 700 }}>
          <span style={{ display: "flex", color: "#faf8f4" }}>Spoken English</span>
          <span style={{ display: "flex", width: 6, height: 6, borderRadius: 999, background: "#6e5ae0" }} />
          <span style={{ display: "flex", color: "#faf8f4" }}>IELTS</span>
          <span style={{ display: "flex", width: 6, height: 6, borderRadius: 999, background: "#d63a8c" }} />
          <span style={{ display: "flex", color: "#faf8f4" }}>PTE</span>
          <span style={{ display: "flex", width: 6, height: 6, borderRadius: 999, background: "#c2a05c" }} />
          <span style={{ display: "flex", color: "#faf8f4" }}>Duolingo English</span>
        </div>
      </div>
    ),
    { ...size }
  );
}