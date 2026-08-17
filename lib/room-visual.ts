// room-visual.md: "Optional: a simple frame (none, thin black, thin
// white, natural wood) and a soft drop shadow." Shared between the live
// CSS preview, the canvas-composited download, and the saved/shared
// static views, so all three agree on what each frame looks like.

export type Frame = "none" | "thin_black" | "thin_white" | "natural_wood";
export const FRAMES: Frame[] = ["none", "thin_black", "thin_white", "natural_wood"];
export const FRAME_LABEL: Record<Frame, string> = {
  none: "None",
  thin_black: "Thin Black",
  thin_white: "Thin White",
  natural_wood: "Natural Wood",
};
export const FRAME_COLOR: Record<Frame, string | null> = {
  none: null,
  thin_black: "#111111",
  thin_white: "#f7f7f5",
  natural_wood: "#8b5a2b",
};
export const FRAME_WIDTH_PX = 5;
