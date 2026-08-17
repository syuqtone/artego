"use client";

import { useEffect, useRef, useState } from "react";

// room-visual.md flow: SELECT ARTWORK -> UPLOAD WALL PHOTO -> SET
// REFERENCE SCALE -> PLACE ARTWORK -> ADJUST -> SAVE / SHARE.
//
// Slice 5.1 (BUILD-ORDER.md) covered upload + reference scale. This
// slice (5.2) adds placing the artwork at true proportion: aspect ratio
// locked to its recorded real dimensions, position draggable, rotation
// limited to +/-3 degrees "to correct a slightly tilted photograph
// only" — no free rescaling, since scale derives entirely from the
// reference measurement. Saving, frames and sharing are 5.3; nothing
// here is persisted yet.

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MIN_LONGEST_SIDE = 1000;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MARKER_KEYBOARD_STEP = 0.005; // 0.5% of the photo's width per arrow-key press
const PLACEMENT_KEYBOARD_STEP = 0.01; // 1% of the photo per arrow-key press
const MAX_ROTATION_DEG = 3;

type MarkerHandle = "left" | "right";

export default function RoomVisualTool({
  artworkTitle,
  artworkHeightCm,
  artworkWidthCm,
  artworkImageUrl,
}: {
  artworkTitle: string;
  artworkHeightCm: number;
  artworkWidthCm: number;
  artworkImageUrl: string | null;
}) {
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
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });

  const imgRef = useRef<HTMLImageElement>(null);
  const draggingMarkerRef = useRef<MarkerHandle | null>(null);
  const draggingArtworkRef = useRef(false);

  useEffect(() => {
    function measure() {
      const rect = imgRef.current?.getBoundingClientRect();
      if (rect) setDisplaySize({ width: rect.width, height: rect.height });
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [photoUrl]);

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
      setScaleConfirmed(false);
      setPlacementXPct(0.5);
      setPlacementYPct(0.5);
      setRotationDeg(0);
    };
    probe.onerror = () => {
      setUploadError("Couldn't read that photo. Please try another file.");
      URL.revokeObjectURL(url);
    };
    probe.src = url;
  }

  function pctFromPoint(clientX: number, clientY: number): { x: number; y: number } {
    const rect = imgRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return { x: 0, y: 0 };
    return {
      x: Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (clientY - rect.top) / rect.height)),
    };
  }

  // -- Reference marker (5.1) ---------------------------------------------

  function startMarkerDrag(handle: MarkerHandle) {
    return (e: React.PointerEvent<HTMLButtonElement>) => {
      draggingMarkerRef.current = handle;
      e.currentTarget.setPointerCapture(e.pointerId);
    };
  }

  function onMarkerDragMove(e: React.PointerEvent<HTMLButtonElement>) {
    const handle = draggingMarkerRef.current;
    if (!handle) return;
    const { x } = pctFromPoint(e.clientX, e.clientY);
    if (handle === "left") setMarkerLeftPct(x);
    else setMarkerRightPct(x);
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

  // -- Artwork placement (5.2) ---------------------------------------------

  function startArtworkDrag(e: React.PointerEvent<HTMLDivElement>) {
    draggingArtworkRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onArtworkDragMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!draggingArtworkRef.current) return;
    const { x, y } = pctFromPoint(e.clientX, e.clientY);
    setPlacementXPct(x);
    setPlacementYPct(y);
  }

  function endArtworkDrag() {
    draggingArtworkRef.current = false;
  }

  function onArtworkKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setPlacementXPct((p) => Math.max(0, p - PLACEMENT_KEYBOARD_STEP));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setPlacementXPct((p) => Math.min(1, p + PLACEMENT_KEYBOARD_STEP));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setPlacementYPct((p) => Math.max(0, p - PLACEMENT_KEYBOARD_STEP));
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setPlacementYPct((p) => Math.min(1, p + PLACEMENT_KEYBOARD_STEP));
    }
  }

  const spanPct = Math.abs(markerRightPct - markerLeftPct);
  const referenceSpanPx = Math.round(spanPct * naturalWidth);
  const widthCmNumber = Number(widthCm);
  const hasValidWidth = widthCm.trim() !== "" && widthCmNumber > 0;
  const pxPerCm = hasValidWidth ? referenceSpanPx / widthCmNumber : null;

  // Scale derives entirely from the reference measurement — never a free
  // resize (room-visual.md "Free rescaling is not permitted").
  const scale = naturalWidth > 0 ? displaySize.width / naturalWidth : 0;
  const artworkDisplayWidth = pxPerCm ? artworkWidthCm * pxPerCm * scale : 0;
  const artworkDisplayHeight = pxPerCm ? artworkHeightCm * pxPerCm * scale : 0;

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
          {!scaleConfirmed && (
            <p className="text-[15px] font-semibold text-artego-black">
              Drag the handles across a span you know the real width of — the full wall, or a door.
            </p>
          )}

          <div className="relative w-full select-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={photoUrl}
              alt="Uploaded wall"
              className="w-full touch-none"
              draggable={false}
              onLoad={() => {
                const rect = imgRef.current?.getBoundingClientRect();
                if (rect) setDisplaySize({ width: rect.width, height: rect.height });
              }}
            />

            {!scaleConfirmed && (
              <>
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
                  onPointerUp={() => (draggingMarkerRef.current = null)}
                  onKeyDown={onMarkerKeyDown("left")}
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
                  onPointerDown={startMarkerDrag("right")}
                  onPointerMove={onMarkerDragMove}
                  onPointerUp={() => (draggingMarkerRef.current = null)}
                  onKeyDown={onMarkerKeyDown("right")}
                  className="absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 touch-none rounded-full border-2 border-artego-white bg-artego-red focus:outline focus:outline-2 focus:outline-artego-blue"
                  style={{ left: `${markerRightPct * 100}%` }}
                />
              </>
            )}

            {scaleConfirmed && pxPerCm && (
              <div
                role="button"
                tabIndex={0}
                aria-label={`Artwork placement, ${artworkWidthCm} by ${artworkHeightCm} centimetres. Use arrow keys to move.`}
                onPointerDown={startArtworkDrag}
                onPointerMove={onArtworkDragMove}
                onPointerUp={endArtworkDrag}
                onKeyDown={onArtworkKeyDown}
                className="absolute touch-none overflow-hidden border border-artego-black/40 bg-grey-100 shadow-lg focus:outline focus:outline-2 focus:outline-artego-blue"
                style={{
                  width: artworkDisplayWidth,
                  height: artworkDisplayHeight,
                  left: placementXPct * displaySize.width - artworkDisplayWidth / 2,
                  top: placementYPct * displaySize.height - artworkDisplayHeight / 2,
                  transform: `rotate(${rotationDeg}deg)`,
                }}
              >
                {artworkImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={artworkImageUrl}
                    alt={artworkTitle}
                    draggable={false}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center p-1 text-center text-xs text-grey-600">
                    {artworkTitle}
                  </span>
                )}
              </div>
            )}
          </div>

          {!scaleConfirmed ? (
            <>
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
                    {pxPerCm?.toFixed(2)} px/cm)
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
          ) : (
            <>
              <div aria-live="polite" className="rounded border border-grey-200 bg-grey-100 p-3">
                <p className="text-[15px] font-semibold text-artego-black">
                  {artworkWidthCm} × {artworkHeightCm} cm on a {widthCmNumber} cm wall
                </p>
                <p className="mt-1 text-sm text-grey-600">
                  Drag the artwork to move it. It keeps its true proportions — it can&rsquo;t be resized
                  freely.
                </p>
              </div>

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

              <button
                type="button"
                onClick={() => setScaleConfirmed(false)}
                className="min-h-11 self-start text-sm font-semibold text-artego-red-deep underline"
              >
                Adjust reference scale
              </button>
            </>
          )}

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
