import { ImageResponse } from "next/og";

const SIZE = 512;
// Maskable icons get cropped to a circle/squircle by the OS, so the mark
// must sit inside the ~80% "safe zone" — smaller than the plain icon.
const DOT_DIAMETER = 300;

export async function GET() {
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
            width: DOT_DIAMETER,
            height: DOT_DIAMETER,
            borderRadius: "50%",
            background: "#F51B24",
          }}
        />
      </div>
    ),
    { width: SIZE, height: SIZE },
  );
}
