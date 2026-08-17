"use client";

import { useEffect, useRef, useState } from "react";
import { FRAME_COLOR, FRAME_WIDTH_PX, type Frame } from "@/lib/room-visual";

// Renders the wall photo with the artwork overlaid at true proportion —
// shared by the interactive placement step (5.2/5.3, draggable) and the
// static "reopen a saved preview" / public share views (5.3, read-only).
// Also owns the "Download image" composite (room-visual.md: "Composited
// JPG, up to 2000px longest side"), since it already has every value
// (photo, artwork image, placement, rotation, frame, scale) needed to
// build one, in both modes.

const PLACEMENT_KEYBOARD_STEP = 0.01;
const MAX_DOWNLOAD_SIDE = 2000;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Couldn't load ${src}`));
    img.src = src;
  });
}

export default function RoomVisualComposite({
  photoUrl,
  artworkTitle,
  artworkImageUrl,
  artworkWidthCm,
  artworkHeightCm,
  pxPerCm,
  referenceWidthCm,
  placementXPct,
  placementYPct,
  rotationDeg,
  frame,
  interactive = false,
  onPlacementChange,
  showDownload = true,
  downloadFileName,
}: {
  photoUrl: string;
  artworkTitle: string;
  artworkImageUrl: string | null;
  artworkWidthCm: number;
  artworkHeightCm: number;
  pxPerCm: number;
  referenceWidthCm: number;
  placementXPct: number;
  placementYPct: number;
  rotationDeg: number;
  frame: Frame;
  interactive?: boolean;
  onPlacementChange?: (xPct: number, yPct: number) => void;
  showDownload?: boolean;
  downloadFileName?: string;
}) {
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  const [naturalWidth, setNaturalWidth] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const imgRef = useRef<HTMLImageElement>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    function measure() {
      const el = imgRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setDisplaySize({ width: rect.width, height: rect.height });
      setNaturalWidth(el.naturalWidth);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [photoUrl]);

  function pctFromPoint(clientX: number, clientY: number) {
    const rect = imgRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return { x: placementXPct, y: placementYPct };
    return {
      x: Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (clientY - rect.top) / rect.height)),
    };
  }

  function startDrag(e: React.PointerEvent<HTMLDivElement>) {
    if (!interactive) return;
    draggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onDragMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!interactive || !draggingRef.current || !onPlacementChange) return;
    const { x, y } = pctFromPoint(e.clientX, e.clientY);
    onPlacementChange(x, y);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (!interactive || !onPlacementChange) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      onPlacementChange(Math.max(0, placementXPct - PLACEMENT_KEYBOARD_STEP), placementYPct);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      onPlacementChange(Math.min(1, placementXPct + PLACEMENT_KEYBOARD_STEP), placementYPct);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      onPlacementChange(placementXPct, Math.max(0, placementYPct - PLACEMENT_KEYBOARD_STEP));
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      onPlacementChange(placementXPct, Math.min(1, placementYPct + PLACEMENT_KEYBOARD_STEP));
    }
  }

  const scale = naturalWidth > 0 ? displaySize.width / naturalWidth : 0;
  const boxWidth = artworkWidthCm * pxPerCm * scale;
  const boxHeight = artworkHeightCm * pxPerCm * scale;
  const frameColor = FRAME_COLOR[frame];

  async function handleDownload() {
    setDownloading(true);
    setDownloadError(null);
    try {
      const wallImg = await loadImage(photoUrl);
      const outScale = Math.min(
        1,
        MAX_DOWNLOAD_SIDE / Math.max(wallImg.naturalWidth, wallImg.naturalHeight),
      );
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(wallImg.naturalWidth * outScale);
      canvas.height = Math.round(wallImg.naturalHeight * outScale);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable");
      ctx.drawImage(wallImg, 0, 0, canvas.width, canvas.height);

      const canvasPxPerCm = pxPerCm * outScale;
      const w = artworkWidthCm * canvasPxPerCm;
      const h = artworkHeightCm * canvasPxPerCm;
      const centerX = placementXPct * canvas.width;
      const centerY = placementYPct * canvas.height;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate((rotationDeg * Math.PI) / 180);
      ctx.shadowColor = "rgba(0,0,0,0.35)";
      ctx.shadowBlur = 14 * outScale;
      ctx.shadowOffsetY = 5 * outScale;

      const frameW = frameColor ? FRAME_WIDTH_PX * outScale : 0;
      if (frameColor) {
        ctx.fillStyle = frameColor;
        ctx.fillRect(-w / 2 - frameW, -h / 2 - frameW, w + frameW * 2, h + frameW * 2);
      }
      ctx.shadowColor = "transparent";

      if (artworkImageUrl) {
        const artImg = await loadImage(artworkImageUrl);
        const boxRatio = w / h;
        const imgRatio = artImg.naturalWidth / artImg.naturalHeight;
        let drawW = w;
        let drawH = h;
        if (imgRatio > boxRatio) drawH = w / imgRatio;
        else drawW = h * imgRatio;
        ctx.drawImage(artImg, -drawW / 2, -drawH / 2, drawW, drawH);
      } else {
        ctx.fillStyle = "#e5e5e5";
        ctx.fillRect(-w / 2, -h / 2, w, h);
        ctx.fillStyle = "#555555";
        ctx.font = `${14 * outScale}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(artworkTitle, 0, 0);
      }
      ctx.restore();

      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.92),
      );
      if (!blob) throw new Error("Could not create the image");

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = downloadFileName ?? "room-preview.jpg";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setDownloadError("Could not create the download. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative w-full select-none">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={photoUrl}
          alt="Wall"
          className="w-full touch-none"
          draggable={false}
          onLoad={() => {
            const el = imgRef.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            setDisplaySize({ width: rect.width, height: rect.height });
            setNaturalWidth(el.naturalWidth);
          }}
        />

        {pxPerCm > 0 && boxWidth > 0 && (
          <div
            role={interactive ? "button" : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-label={
              interactive
                ? `Artwork placement, ${artworkWidthCm} by ${artworkHeightCm} centimetres. Use arrow keys to move.`
                : undefined
            }
            onPointerDown={startDrag}
            onPointerMove={onDragMove}
            onPointerUp={() => (draggingRef.current = false)}
            onKeyDown={onKeyDown}
            className={`absolute overflow-hidden shadow-lg ${interactive ? "touch-none focus:outline focus:outline-2 focus:outline-artego-blue" : ""}`}
            style={{
              width: boxWidth,
              height: boxHeight,
              left: placementXPct * displaySize.width - boxWidth / 2,
              top: placementYPct * displaySize.height - boxHeight / 2,
              transform: `rotate(${rotationDeg}deg)`,
              border: frameColor ? `${FRAME_WIDTH_PX}px solid ${frameColor}` : undefined,
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
              <span className="flex h-full w-full items-center justify-center bg-grey-100 p-1 text-center text-xs text-grey-600">
                {artworkTitle}
              </span>
            )}
          </div>
        )}
      </div>

      {pxPerCm > 0 && (
        <p className="text-[15px] font-semibold text-artego-black">
          {artworkWidthCm} × {artworkHeightCm} cm on a {referenceWidthCm} cm wall
        </p>
      )}

      {showDownload && (
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="flex min-h-11 items-center justify-center rounded border border-artego-black px-5 text-[15px] font-semibold text-artego-black disabled:opacity-60"
        >
          {downloading ? "Preparing download…" : "Download image"}
        </button>
      )}
      {downloadError && (
        <p role="alert" className="text-sm font-semibold text-danger">
          {downloadError}
        </p>
      )}

      <p className="text-sm text-grey-600">
        This preview is an approximation based on the wall width you entered. Lighting, camera angle
        and lens distortion affect how the artwork appears. Always confirm measurements before
        hanging or purchasing.
      </p>
    </div>
  );
}
