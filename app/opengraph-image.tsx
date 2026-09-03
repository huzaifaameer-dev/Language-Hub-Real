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
          background: "linear-gradient(135deg, #0b1220 0%, #1e293b 55%, #0f172a 100%)",
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
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              color: "#fff",
              fontSize: 30,
              fontWeight: 800,
            }}
          >
            LH
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", color: "#ffffff", fontSize: 30, fontWeight: 800, letterSpacing: 1 }}>
              LANGUAGE HUB
            </div>
            <div style={{ display: "flex", color: "#fbbf24", fontSize: 17, fontWeight: 600, letterSpacing: 3 }}>
              HUB OF LANGUAGE EXCELLENCE
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              display: "flex",
              background: "linear-gradient(90deg, #6366f1 0%, #8b5cf6 45%, #f59e0b 100%)",
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
          <div style={{ display: "flex", color: "#cbd5e1", fontSize: 26, fontWeight: 500, maxWidth: 900, lineHeight: 1.35 }}>
            English fluency, confidence and creative expression through practical, interactive learning with Javeria Malik.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 28, color: "#94a3b8", fontSize: 20, fontWeight: 700 }}>
          <span style={{ display: "flex", color: "#ffffff" }}>Spoken English</span>
          <span style={{ display: "flex", width: 6, height: 6, borderRadius: 999, background: "#6366f1" }} />
          <span style={{ display: "flex", color: "#ffffff" }}>IELTS</span>
          <span style={{ display: "flex", width: 6, height: 6, borderRadius: 999, background: "#8b5cf6" }} />
          <span style={{ display: "flex", color: "#ffffff" }}>PTE</span>
          <span style={{ display: "flex", width: 6, height: 6, borderRadius: 999, background: "#f59e0b" }} />
          <span style={{ display: "flex", color: "#faf8f4" }}>Duolingo English</span>
        </div>
      </div>
    ),
    { ...size }
  );
}