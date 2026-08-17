"use client";

import { useRef, useState } from "react";

// room-visual.md "The scale method": the user drags a horizontal marker
// across a known span in the photo — typically the full wall or a door —
// and types its real width in centimetres. The system computes pixels
// per centimetre.
//
// This slice (BUILD-ORDER.md 5.1) covers upload + setting that reference
// scale only. Placing the artwork (5.2) and saving/sharing (5.3) read the
// values this produces (reference span in the photo's natural pixels,
// and the typed width in cm) but aren't built yet, so nothing here is
// persisted — the photo lives in the browser as an object URL.

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MIN_LONGEST_SIDE = 1000;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const KEYBOARD_STEP = 0.005; // 0.5% of the photo's width per arrow-key press

type Handle = "left" | "right";

export default function RoomVisualScaleTool({
  artworkHeightCm,
  artworkWidthCm,
}: {
  artworkHeightCm: number;
  artworkWidthCm: number;
}) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [naturalWidth, setNaturalWidth] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [markerLeftPct, setMarkerLeftPct] = useState(0.2);
  const [markerRightPct, setMarkerRightPct] = useState(0.8);
  const [widthCm, setWidthCm] = useState("");

  const imgRef = useRef<HTMLImageElement>(null);
  const draggingRef = useRef<Handle | null>(null);

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
      setPhotoUrl(url);
      setNaturalWidth(probe.naturalWidth);
      setMarkerLeftPct(0.2);
      setMarkerRightPct(0.8);
    };
    probe.onerror = () => {
      setUploadError("Couldn't read that photo. Please try another file.");
      URL.revokeObjectURL(url);
    };
    probe.src = url;
  }

  function pctFromClientX(clientX: number): number {
    const rect = imgRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return 0;
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  }

  function startDrag(handle: Handle) {
    return (e: React.PointerEvent<HTMLButtonElement>) => {
      draggingRef.current = handle;
      e.currentTarget.setPointerCapture(e.pointerId);
    };
  }

  function onDragMove(e: React.PointerEvent<HTMLButtonElement>) {
    const handle = draggingRef.current;
    if (!handle) return;
    const pct = pctFromClientX(e.clientX);
    if (handle === "left") setMarkerLeftPct(pct);
    else setMarkerRightPct(pct);
  }

  function endDrag() {
    draggingRef.current = null;
  }

  function onHandleKeyDown(handle: Handle) {
    return (e: React.KeyboardEvent<HTMLButtonElement>) => {
      const set = handle === "left" ? setMarkerLeftPct : setMarkerRightPct;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        set((p) => Math.max(0, p - KEYBOARD_STEP));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        set((p) => Math.min(1, p + KEYBOARD_STEP));
      }
    };
  }

  const spanPct = Math.abs(markerRightPct - markerLeftPct);
  const referenceSpanPx = Math.round(spanPct * naturalWidth);
  const widthCmNumber = Number(widthCm);
  const hasValidWidth = widthCm.trim() !== "" && widthCmNumber > 0;
  const pxPerCm = hasValidWidth ? referenceSpanPx / widthCmNumber : null;

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

      {photoUrl && (
        <>
          <div className="flex flex-col gap-2">
            <p className="text-[15px] font-semibold text-artego-black">
              Drag the handles across a span you know the real width of — the full wall, or a door.
            </p>
            <div className="relative w-full select-none">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img ref={imgRef} src={photoUrl} alt="Uploaded wall" className="w-full touch-none" draggable={false} />

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
                onPointerDown={startDrag("left")}
                onPointerMove={onDragMove}
                onPointerUp={endDrag}
                onKeyDown={onHandleKeyDown("left")}
                className="absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 touch-none rounded-full border-2 border-artego-white bg-artego-red focus:outline focus:outline-2 focus:outline-artego-blue"
                style={{ left: `${markerLeftPct * 100}%` }}
              />
              <button
                type="button"
                role="slider"
                aria-label="Right marker handle"
                aria-orientation="horizontal"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(markerRightPct * 100)}
                aria-valuetext={`${Math.round(markerRightPct * 100)}% across the photo`}
                onPointerDown={startDrag("right")}
                onPointerMove={onDragMove}
                onPointerUp={endDrag}
                onKeyDown={onHandleKeyDown("right")}
                className="absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 touch-none rounded-full border-2 border-artego-white bg-artego-red focus:outline focus:outline-2 focus:outline-artego-blue"
                style={{ left: `${markerRightPct * 100}%` }}
              />
            </div>
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
                {widthCmNumber} cm across this photo ({referenceSpanPx}px measured, ≈
                {" "}
                {pxPerCm?.toFixed(2)} px/cm)
              </p>
            ) : (
              <p className="text-sm text-grey-600">
                Type the real width of the marked span to see the scale.
              </p>
            )}
            <p className="mt-1 text-sm text-grey-600">
              This artwork is {artworkHeightCm} × {artworkWidthCm} cm.
            </p>
          </div>

          <p className="text-sm text-grey-600">
            This preview is an approximation based on the wall width you entered. Lighting, camera
            angle and lens distortion affect how the artwork appears. Always confirm measurements
            before hanging or purchasing.
          </p>
        </>
      )}
    </div>
  );
}
