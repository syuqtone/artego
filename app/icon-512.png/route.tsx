import { ImageResponse } from "next/og";

const SIZE = 512;
const DOT_DIAMETER = 352;

// Reuses the same red-dot brand mark from the landing page (app/page.tsx)
// at app-icon scale — design-tokens.md: "small red/blue/yellow accent
// planes" on white, no literal artwork or gradients.
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
