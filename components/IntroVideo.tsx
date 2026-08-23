"use client";

import { useEffect, useRef, useState } from "react";

// Plays once on load, muted (every browser blocks unmuted autoplay
// regardless), with an unmute toggle so the artist can hear the real
// montage if they want it. `prefers-reduced-motion` skips autoplay
// entirely and falls back to a normal click-to-play control, per
// CLAUDE.md rule 8 (WCAG 2.1 AA) -- motion should never be forced on
// someone who's asked for less of it.
export default function IntroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [autoplayAllowed, setAutoplayAllowed] = useState(true);

  useEffect(() => {
    setAutoplayAllowed(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
    // Sound only ever turns on from a direct tap on this button, which
    // is itself the user gesture browsers require to allow audio.
    if (!video.muted && video.paused) {
      video.play().catch(() => {});
    }
  }

  return (
    <div className="relative w-full overflow-hidden">
      <video
        ref={videoRef}
        src="/ARTEGO%20INTRO%20VIDEO.mp4"
        poster="/intro-poster.jpg"
        className="w-full"
        autoPlay={autoplayAllowed}
        muted={muted}
        playsInline
        controls={!autoplayAllowed}
        preload="metadata"
        aria-label="ArteGO introduction video"
      />
      {autoplayAllowed && (
        <button
          type="button"
          onClick={toggleMute}
          aria-label={muted ? "Unmute video" : "Mute video"}
          className="absolute bottom-2 right-2 flex h-11 w-11 items-center justify-center rounded-full bg-artego-black/60 text-artego-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-artego-blue"
        >
          {muted ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M4 9v6h4l5 5V4L8 9H4z" />
              <line x1="16" y1="9" x2="21" y2="14" />
              <line x1="21" y1="9" x2="16" y2="14" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M4 9v6h4l5 5V4L8 9H4z" />
              <path d="M16 8a5 5 0 0 1 0 8" />
              <path d="M18.5 5.5a9 9 0 0 1 0 13" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}
