import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "GetSukoon — How prepared is your family?";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#FAF7F2",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 80px",
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "rgba(122, 139, 111, 0.08)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -60,
            left: -60,
            width: 250,
            height: 250,
            borderRadius: "50%",
            background: "rgba(184, 100, 63, 0.06)",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          {/* Logo text */}
          <div
            style={{
              fontSize: 28,
              color: "#7A8B6F",
              letterSpacing: "0.05em",
              marginBottom: 32,
              fontWeight: 600,
            }}
          >
            GETSUKOON
          </div>

          {/* Main headline */}
          <div
            style={{
              fontSize: 52,
              fontWeight: 700,
              color: "#2A2520",
              lineHeight: 1.2,
              maxWidth: 900,
              marginBottom: 24,
            }}
          >
            How prepared is your family for your parents&apos; care?
          </div>

          {/* Subtext */}
          <div
            style={{
              fontSize: 24,
              color: "#5C5448",
              lineHeight: 1.5,
              maxWidth: 700,
              marginBottom: 40,
            }}
          >
            Five questions most families never talk about. A 2-minute assessment
            that helps you start.
          </div>

          {/* CTA pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#7A8B6F",
              color: "#FAF7F2",
              padding: "14px 32px",
              borderRadius: 50,
              fontSize: 20,
              fontWeight: 600,
            }}
          >
            Take the free assessment
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
