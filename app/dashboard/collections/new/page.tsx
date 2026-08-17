"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { createCollectionAction, type NewCollectionState } from "./actions";

const initialState: NewCollectionState = {};

const inputClass =
  "min-h-11 rounded border border-grey-200 px-3 text-base text-artego-black focus:border-artego-black focus:outline focus:outline-2 focus:outline-artego-blue";
const labelClass = "text-[15px] font-semibold text-artego-black";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-11 rounded bg-artego-red px-6 text-[15px] font-semibold text-artego-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-artego-blue disabled:opacity-60"
    >
      {pending ? "Creating..." : "Create Collection"}
    </button>
  );
}

export default function NewCollectionPage() {
  const [state, formAction] = useActionState(createCollectionAction, initialState);
  const [attempt, setAttempt] = useState(0);
  const [lastValues, setLastValues] = useState<Record<string, string>>({});

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const fd = new FormData(e.currentTarget);
    const values: Record<string, string> = {};
    fd.forEach((v, k) => {
      if (typeof v === "string") values[k] = v;
    });
    setLastValues(values);
  }

  useEffect(() => {
    if (state.error) {
      setAttempt((n) => n + 1);
    }
  }, [state]);

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-6 px-4 py-9">
      <div>
        <Link href="/dashboard/collections" className="text-sm font-semibold text-artego-red-deep underline">
          ← Collections
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-artego-black">New Collection</h1>
      </div>

      <form key={attempt} action={formAction} onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1">
          <label htmlFor="title" className={labelClass}>
            Title <span aria-hidden>*</span>
          </label>
          <input id="title" name="title" type="text" required defaultValue={lastValues.title} className={inputClass} />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="description" className={labelClass}>
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={lastValues.description}
            className={`${inputClass} min-h-0 py-2`}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="visibility" className={labelClass}>
            Visibility <span aria-hidden>*</span>
          </label>
          <select
            id="visibility"
            name="visibility"
            required
            defaultValue={lastValues.visibility ?? "private"}
            className={inputClass}
          >
            <option value="public">Public — discoverable by everyone</option>
            <option value="unlisted">Unlisted — only accessible by direct link</option>
            <option value="private">Private — only visible to you</option>
          </select>
        </div>

        {state.error && (
          <p role="alert" className="text-sm font-semibold text-danger">
            {state.error}
          </p>
        )}

        <SubmitButton />
      </form>
    </div>
  );
}
