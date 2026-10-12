import { ImageResponse } from "next/og"
import { site } from "@/lib/site"

export const alt =
  "Liftly · Crea y comparte planes de entrenamiento, sesión a sesión"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "linear-gradient(135deg, #1e1b4b 0%, #4c1d95 55%, #6d28d9 100%)",
          padding: "72px",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 64,
              height: 64,
              borderRadius: 20,
              background: "rgba(255,255,255,0.18)",
              fontSize: 34,
              fontWeight: 700,
            }}
          >
            L
          </div>
          <div style={{ fontSize: 34, fontWeight: 600, letterSpacing: -0.5 }}>
            {site.name}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 70,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -1.5,
              maxWidth: 900,
            }}
          >
            Diseña tu plan de gimnasio, sesión a sesión
          </div>
          <div
            style={{
              fontSize: 30,
              lineHeight: 1.4,
              color: "rgba(255,255,255,0.82)",
              maxWidth: 900,
            }}
          >
            Crea planes con tus ejercicios, compártelos con la comunidad y copia
            los de otros.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 16,
            fontSize: 24,
            color: "rgba(255,255,255,0.9)",
          }}
        >
          <span>Sesiones ordenadas</span>
          <span>·</span>
          <span>Series, peso y descanso</span>
          <span>·</span>
          <span>Copia con atribución</span>
        </div>
      </div>
    ),
    { ...size }
  )
}
