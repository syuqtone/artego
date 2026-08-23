import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Browser tab favicon — just the red dot from the logo (the same shape
// used by apple-icon.tsx), not the default Next.js triangle. Transparent
// background so it reads correctly against both light and dark browser
// tab bars, unlike the apple touch icon which needs an opaque ground.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: "#F51B24",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
