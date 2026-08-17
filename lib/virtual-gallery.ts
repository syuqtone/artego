// virtual-gallery.md "Hanging rules" — shared constants so the renderer,
// the creation form, and (later slices) the public viewer all agree.

export type WallPreset = "white" | "warm_grey" | "black";
export const WALL_PRESETS: WallPreset[] = ["white", "warm_grey", "black"];
export const WALL_PRESET_LABEL: Record<WallPreset, string> = {
  white: "White",
  warm_grey: "Warm Grey",
  black: "Black",
};
export const WALL_PRESET_COLOR: Record<WallPreset, string> = {
  white: "#f7f6f3",
  warm_grey: "#a8998a",
  black: "#141414",
};
export const WALL_PRESET_TEXT_COLOR: Record<WallPreset, string> = {
  white: "#111111",
  warm_grey: "#111111",
  black: "#f5f5f5",
};

// "The virtual wall is 300 cm high."
export const WALL_HEIGHT_CM = 300;
// "Every artwork is placed with its vertical centre at 150 cm from the
// floor ... unless taller than 240 cm, in which case it is floor-anchored."
export const EYE_LINE_CM = 150;
export const FLOOR_ANCHOR_THRESHOLD_CM = 240;
// "Default horizontal gap: 60 cm of virtual wall, increased
// proportionally for works wider than 150 cm." No exact formula is given
// in the spec — this adds 0.4cm of extra gap per cm of width past 150cm.
export const DEFAULT_GAP_CM = 60;
export const WIDE_WORK_THRESHOLD_CM = 150;
export const WIDE_WORK_GAP_FACTOR = 0.4;
export function gapCmFor(widthCm: number): number {
  return DEFAULT_GAP_CM + Math.max(0, widthCm - WIDE_WORK_THRESHOLD_CM) * WIDE_WORK_GAP_FACTOR;
}
// "No recorded dimensions -> fall back to a 60 x 60cm placeholder."
export const PLACEHOLDER_SIZE_CM = 60;
// "Up to 20 artworks in one gallery."
export const MAX_GALLERY_ARTWORKS = 20;
