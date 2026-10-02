import { ImageResponse } from "next/og"

import { BRAND_DESCRIPTOR, BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand"

export const alt = `${BRAND_NAME} — ${BRAND_TAGLINE}`
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "88px",
        background: "#ffffff",
        color: "#171717",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
        <div
          style={{
            width: 58,
            height: 58,
            borderRadius: 12,
            background: "#171717",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 34,
            fontWeight: 700,
          }}
        >
          B
        </div>
        <div style={{ fontSize: 32, color: "#525252" }}>{BRAND_DESCRIPTOR}</div>
      </div>
      <div
        style={{
          marginTop: 48,
          fontSize: 94,
          lineHeight: 1,
          letterSpacing: "-4px",
          fontWeight: 700,
        }}
      >
        {BRAND_NAME}
      </div>
      <div
        style={{
          marginTop: 28,
          maxWidth: 900,
          fontSize: 34,
          lineHeight: 1.35,
          color: "#525252",
        }}
      >
        {BRAND_TAGLINE}
      </div>
    </div>,
    size
  )
}
