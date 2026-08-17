"use client";

import { useState } from "react";
import { deleteRoomVisualAction } from "@/app/dashboard/room-visual/actions";

export default function DeleteRoomVisualButton({ id }: { id: string }) {
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setPending(true);
    setError(null);
    const result = await deleteRoomVisualAction(id);
    if (result.error) {
      setError(result.error);
    }
    // Reset regardless of outcome: on success the row disappears via
    // revalidatePath (this component unmounts), but if it doesn't — e.g.
    // an RLS policy silently filtered the delete to zero rows — the
    // button must not stay stuck showing "Deleting…" forever.
    setPending(false);
  }

  if (confirming) {
    return (
      <div className="flex shrink-0 flex-col items-end gap-1">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="min-h-11 rounded bg-danger px-3 text-sm font-semibold text-artego-white disabled:opacity-60"
          >
            {pending ? "Deleting…" : "Confirm"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={pending}
            className="min-h-11 rounded border border-artego-black px-3 text-sm font-semibold text-artego-black"
          >
            Cancel
          </button>
        </div>
        {error && <p className="text-xs font-semibold text-danger">{error}</p>}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="min-h-11 shrink-0 rounded border border-danger px-3 text-sm font-semibold text-danger"
    >
      Delete
    </button>
  );
}
