"use client";

import { useState } from "react";
import RoomVisualComposite from "@/components/RoomVisualComposite";
import { saveRoomVisualAction } from "@/app/dashboard/room-visual/actions";
import { FRAMES, FRAME_LABEL, type Frame } from "@/lib/room-visual";

// room-visual.md flow: SELECT ARTWORK -> UPLOAD WALL PHOTO -> SET
// REFERENCE SCALE (5.1) -> PLACE ARTWORK -> ADJUST (5.2) -> SAVE / SHARE
// (5.3, this slice's addition: frame choice, saving, and download —
// sharing happens from the saved-preview page since there's nothing to
// share until it's saved).

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MIN_LONGEST_SIDE = 1000;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MARKER_KEYBOARD_STEP = 0.005; // 0.5% of the photo's width per arrow-key press
const MAX_ROTATION_DEG = 3;

type MarkerHandle = "left" | "right";

export default function RoomVisualTool({
  artworkId,
  artworkTitle,
  artworkHeightCm,
  artworkWidthCm,
  artworkImageUrl,
}: {
  artworkId: string;
  artworkTitle: string;
  artworkHeightCm: number;
  artworkWidthCm: number;
  artworkImageUrl: string | null;
}) {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [naturalWidth, setNaturalWidth] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [markerLeftPct, setMarkerLeftPct] = useState(0.2);
  const [markerRightPct, setMarkerRightPct] = useState(0.8);
  const [widthCm, setWidthCm] = useState("");
  const [scaleConfirmed, setScaleConfirmed] = useState(false);
  const [placementXPct, setPlacementXPct] = useState(0.5);
  const [placementYPct, setPlacementYPct] = useState(0.5);
  const [rotationDeg, setRotationDeg] = useState(0);
  const [frame, setFrame] = useState<Frame>("none");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadError("Please choose a JPG, PNG or WebP photo.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setUploadError("That photo is over 10 MB. Please choose a smaller file.");
      return;
    }

    const url = URL.createObjectURL(file);
    const probe = new Image();
    probe.onload = () => {
      const longestSide = Math.max(probe.naturalWidth, probe.naturalHeight);
      if (longestSide < MIN_LONGEST_SIDE) {
        setUploadError(
          `This photo is too small (longest side ${longestSide}px). Use one at least ${MIN_LONGEST_SIDE}px on its longest side.`,
        );
        URL.revokeObjectURL(url);
        return;
      }
      setPhotoFile(file);
      setPhotoUrl(url);
      setNaturalWidth(probe.naturalWidth);
      setMarkerLeftPct(0.2);
      setMarkerRightPct(0.8);
      setScaleConfirmed(false);
      setPlacementXPct(0.5);
      setPlacementYPct(0.5);
      setRotationDeg(0);
      setFrame("none");
    };
    probe.onerror = () => {
      setUploadError("Couldn't read that photo. Please try another file.");
      URL.revokeObjectURL(url);
    };
    probe.src = url;
  }

  function markerPctFromClientX(clientX: number): number {
    const rect = document.getElementById("wall-photo-img")?.getBoundingClientRect();
    if (!rect || rect.width === 0) return 0;
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  }

  function startMarkerDrag(handle: MarkerHandle) {
    return (e: React.PointerEvent<HTMLButtonElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      e.currentTarget.dataset.handle = handle;
    };
  }

  function onMarkerDragMove(e: React.PointerEvent<HTMLButtonElement>) {
    const handle = e.currentTarget.dataset.handle as MarkerHandle | undefined;
    if (!handle) return;
    const pct = markerPctFromClientX(e.clientX);
    if (handle === "left") setMarkerLeftPct(pct);
    else setMarkerRightPct(pct);
  }

  function onMarkerKeyDown(handle: MarkerHandle) {
    return (e: React.KeyboardEvent<HTMLButtonElement>) => {
      const set = handle === "left" ? setMarkerLeftPct : setMarkerRightPct;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        set((p) => Math.max(0, p - MARKER_KEYBOARD_STEP));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        set((p) => Math.min(1, p + MARKER_KEYBOARD_STEP));
      }
    };
  }

  const spanPct = Math.abs(markerRightPct - markerLeftPct);
  const referenceSpanPx = Math.round(spanPct * naturalWidth);
  const widthCmNumber = Number(widthCm);
  const hasValidWidth = widthCm.trim() !== "" && widthCmNumber > 0;
  const pxPerCm = hasValidWidth ? referenceSpanPx / widthCmNumber : 0;

  async function handleSave() {
    if (!photoFile) return;
    setSaving(true);
    setSaveError(null);
    const formData = new FormData();
    formData.set("artworkId", artworkId);
    formData.set("photo", photoFile);
    formData.set("referenceSpanPx", String(referenceSpanPx));
    formData.set("referenceWidthCm", String(widthCmNumber));
    formData.set("placementX", String(placementXPct));
    formData.set("placementY", String(placementYPct));
    formData.set("rotationDeg", String(rotationDeg));
    formData.set("frame", frame);

    try {
      const result = await saveRoomVisualAction(formData);
      if (result?.error) {
        setSaveError(result.error);
        setSaving(false);
      }
      // On success the action redirects — nothing further to do here.
    } catch (err) {
      // Next.js redirect() throws internally to perform the navigation;
      // let anything that isn't that pass through as a real failure.
      if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
      setSaveError("Couldn't save the preview. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="wall-photo" className="text-[15px] font-semibold text-artego-black">
          Wall photo
        </label>
        <input
          id="wall-photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="text-sm text-artego-black"
        />
        <p className="text-sm text-grey-600">
          JPG, PNG or WebP, up to 10 MB, at least {MIN_LONGEST_SIDE}px on the longest side. Photograph
          the wall straight on for the most accurate result.
        </p>
        {uploadError && (
          <p role="alert" className="text-sm font-semibold text-danger">
            {uploadError}
          </p>
        )}
      </div>

      {photoUrl && !scaleConfirmed && (
        <>
          <p className="text-[15px] font-semibold text-artego-black">
            Drag the handles across a span you know the real width of — the full wall, or a door.
          </p>
          <div className="relative w-full select-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              id="wall-photo-img"
              src={photoUrl}
              alt="Uploaded wall"
              className="w-full touch-none"
              draggable={false}
            />
            <div
              aria-hidden
              className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-artego-red"
              style={{
                left: `${Math.min(markerLeftPct, markerRightPct) * 100}%`,
                width: `${spanPct * 100}%`,
              }}
            />
            <button
              type="button"
              role="slider"
              aria-label="Left marker handle"
              aria-orientation="horizontal"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(markerLeftPct * 100)}
              aria-valuetext={`${Math.round(markerLeftPct * 100)}% across the photo`}
              onPointerDown={startMarkerDrag("left")}
              onPointerMove={onMarkerDragMove}
              onKeyDown={onMarkerKeyDown("left")}
              className="absolute top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 touch-none items-center justify-center focus:outline focus:outline-2 focus:outline-artego-blue"
              style={{ left: `${markerLeftPct * 100}%` }}
            >
              <span className="h-6 w-6 rounded-full border-2 border-artego-white bg-artego-red" />
            </button>
            <button
              type="button"
              role="slider"
              aria-label="Right marker handle"
              aria-orientation="horizontal"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(markerRightPct * 100)}
              aria-valuetext={`${Math.round(markerRightPct * 100)}% across the photo`}
              onPointerDown={startMarkerDrag("right")}
              onPointerMove={onMarkerDragMove}
              onKeyDown={onMarkerKeyDown("right")}
              className="absolute top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 touch-none items-center justify-center focus:outline focus:outline-2 focus:outline-artego-blue"
              style={{ left: `${markerRightPct * 100}%` }}
            >
              <span className="h-6 w-6 rounded-full border-2 border-artego-white bg-artego-red" />
            </button>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="reference-width" className="text-[15px] font-semibold text-artego-black">
              Real width of that span
            </label>
            <div className="flex items-center gap-2">
              <input
                id="reference-width"
                type="number"
                inputMode="decimal"
                min="1"
                step="1"
                value={widthCm}
                onChange={(e) => setWidthCm(e.target.value)}
                placeholder="e.g. 340"
                className="min-h-11 w-32 rounded border border-grey-200 px-3 text-base text-artego-black focus:border-artego-black focus:outline focus:outline-2 focus:outline-artego-blue"
              />
              <span className="text-base text-grey-600">cm</span>
            </div>
          </div>

          <div aria-live="polite" className="rounded border border-grey-200 bg-grey-100 p-3">
            {hasValidWidth ? (
              <p className="text-[15px] font-semibold text-artego-black">
                {widthCmNumber} cm across this photo ({referenceSpanPx}px measured, ≈{" "}
                {pxPerCm.toFixed(2)} px/cm)
              </p>
            ) : (
              <p className="text-sm text-grey-600">
                Type the real width of the marked span to see the scale.
              </p>
            )}
            <p className="mt-1 text-sm text-grey-600">
              This artwork is {artworkWidthCm} × {artworkHeightCm} cm.
            </p>
          </div>

          {hasValidWidth && (
            <button
              type="button"
              onClick={() => setScaleConfirmed(true)}
              className="flex min-h-11 items-center justify-center rounded bg-artego-red px-5 text-[15px] font-semibold text-artego-white"
            >
              Continue to placement
            </button>
          )}
        </>
      )}

      {photoUrl && scaleConfirmed && (
        <>
          <RoomVisualComposite
            photoUrl={photoUrl}
            artworkTitle={artworkTitle}
            artworkImageUrl={artworkImageUrl}
            artworkWidthCm={artworkWidthCm}
            artworkHeightCm={artworkHeightCm}
            pxPerCm={pxPerCm}
            referenceWidthCm={widthCmNumber}
            placementXPct={placementXPct}
            placementYPct={placementYPct}
            rotationDeg={rotationDeg}
            frame={frame}
            interactive
            onPlacementChange={(x, y) => {
              setPlacementXPct(x);
              setPlacementYPct(y);
            }}
            showDownload
            downloadFileName={`${artworkTitle.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-on-wall.jpg`}
          />

          <p className="text-sm text-grey-600">
            Drag the artwork to move it. It keeps its true proportions — it can&rsquo;t be resized
            freely.
          </p>

          <div className="flex flex-col gap-1">
            <label htmlFor="rotation" className="text-[15px] font-semibold text-artego-black">
              Straighten ({rotationDeg.toFixed(1)}°)
            </label>
            <input
              id="rotation"
              type="range"
              min={-MAX_ROTATION_DEG}
              max={MAX_ROTATION_DEG}
              step={0.1}
              value={rotationDeg}
              onChange={(e) => setRotationDeg(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-[15px] font-semibold text-artego-black">Frame</legend>
            <div className="flex flex-wrap gap-2">
              {FRAMES.map((f) => (
                <label
                  key={f}
                  className={`flex min-h-11 items-center rounded border p-2 text-sm font-semibold has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-artego-blue ${
                    frame === f ? "border-artego-black bg-grey-100 text-artego-black" : "border-grey-200 text-grey-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="frame"
                    value={f}
                    checked={frame === f}
                    onChange={() => setFrame(f)}
                    className="sr-only"
                  />
                  {FRAME_LABEL[f]}
                </label>
              ))}
            </div>
          </fieldset>

          {saveError && (
            <p role="alert" className="text-sm font-semibold text-danger">
              {saveError}
            </p>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex min-h-11 items-center justify-center rounded bg-artego-red px-5 text-[15px] font-semibold text-artego-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-artego-blue disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Preview"}
          </button>

          <button
            type="button"
            onClick={() => setScaleConfirmed(false)}
            className="min-h-11 self-start text-sm font-semibold text-artego-red-deep underline"
          >
            Adjust reference scale
          </button>
        </>
      )}
    </div>
  );
}
