"use client";

import { useState } from "react";
import { shareRoomVisualAction } from "@/app/dashboard/room-visual/actions";

// room-visual.md: "Wall photo privacy: Private by default. Published
// only when the artist explicitly shares or embeds." — sharing is
// therefore always an explicit click, never automatic.
export default function ShareRoomVisualButton({
  roomVisualId,
  initialShareUrl,
}: {
  roomVisualId: string;
  initialShareUrl: string | null;
}) {
  const [shareUrl, setShareUrl] = useState(initialShareUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleShare() {
    setLoading(true);
    setError(null);
    const result = await shareRoomVisualAction(roomVisualId);
    if (result.error) {
      setError(result.error);
    } else if (result.shareUrl) {
      setShareUrl(result.shareUrl);
    }
    setLoading(false);
  }

  if (shareUrl) {
    const fullUrl = typeof window !== "undefined" ? `${window.location.origin}${shareUrl}` : shareUrl;
    return (
      <div className="rounded border border-grey-200 bg-grey-100 p-3">
        <p className="text-sm font-semibold text-artego-black">Anyone with this link can view it:</p>
        <a href={shareUrl} className="break-all text-sm font-semibold text-artego-red-deep underline">
          {fullUrl}
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleShare}
        disabled={loading}
        className="flex min-h-11 items-center justify-center rounded border border-artego-black px-5 text-[15px] font-semibold text-artego-black disabled:opacity-60"
      >
        {loading ? "Creating link…" : "Share"}
      </button>
      {error && (
        <p role="alert" className="text-sm font-semibold text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
