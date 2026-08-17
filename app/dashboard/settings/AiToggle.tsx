"use client";

import { useState } from "react";
import { setAiEnabledAction } from "./actions";

export default function AiToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);

  async function handleChange(next: boolean) {
    setEnabled(next);
    setSaving(true);
    await setAiEnabledAction(next);
    setSaving(false);
  }

  return (
    <div className="mt-3 flex items-center justify-between rounded border border-grey-200 p-3">
      <label htmlFor="ai-enabled" className="text-[15px] font-semibold text-artego-black">
        AI drafting is {enabled ? "on" : "off"}
      </label>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center">
        <input
          id="ai-enabled"
          type="checkbox"
          role="switch"
          aria-checked={enabled}
          checked={enabled}
          disabled={saving}
          onChange={(e) => handleChange(e.target.checked)}
          className="h-6 w-6 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-artego-blue"
        />
      </span>
    </div>
  );
}
