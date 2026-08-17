import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS doesn't composite a background behind apple-touch-icon, so this one
// stays fully opaque white with no rounding — iOS applies its own corner
// mask on the home screen.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FFFFFF",
        }}
      >
        <div
          style={{
            width: 124,
            height: 124,
            borderRadius: "50%",
            background: "#F51B24",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
