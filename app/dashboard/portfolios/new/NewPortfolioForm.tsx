"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { createPortfolioAction, type NewPortfolioState } from "./actions";

const initialState: NewPortfolioState = {};

const TEMPLATES = [
  { value: "minimal", label: "Minimal", description: "Clean, image-forward, generous whitespace." },
  { value: "editorial", label: "Editorial", description: "Magazine-style, stronger typography." },
] as const;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-11 rounded bg-artego-red px-6 text-[15px] font-semibold text-artego-white disabled:opacity-60"
    >
      {pending ? "Creating..." : "Create Portfolio"}
    </button>
  );
}

export default function NewPortfolioForm({
  collections,
}: {
  collections: { id: string; title: string; artworkCount: number }[];
}) {
  const [state, formAction] = useActionState(createPortfolioAction, initialState);
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
    <form key={attempt} action={formAction} onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      <div className="flex flex-col gap-1">
        <label htmlFor="title" className="text-[15px] font-semibold text-artego-black">
          Title <span aria-hidden>*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          defaultValue={lastValues.title}
          className="min-h-11 rounded border border-grey-200 px-3 text-base text-artego-black focus:border-artego-black focus:outline focus:outline-2 focus:outline-artego-blue"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="collectionId" className="text-[15px] font-semibold text-artego-black">
          From Collection <span aria-hidden>*</span>
        </label>
        <select
          id="collectionId"
          name="collectionId"
          required
          defaultValue={lastValues.collectionId ?? ""}
          className="min-h-11 rounded border border-grey-200 px-3 text-base text-artego-black focus:border-artego-black focus:outline focus:outline-2 focus:outline-artego-blue"
        >
          <option value="" disabled>
            Choose a collection
          </option>
          {collections.map((c) => (
            <option key={c.id} value={c.id} disabled={c.artworkCount === 0}>
              {c.title} ({c.artworkCount} artworks)
            </option>
          ))}
        </select>
        <p className="text-sm text-grey-600">
          All artworks in the collection, in their current order, become the portfolio.
        </p>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-[15px] font-semibold text-artego-black">
          Template <span aria-hidden>*</span>
        </legend>
        {TEMPLATES.map((t, i) => (
          <label key={t.value} className="flex items-start gap-3 rounded border border-grey-200 p-3">
            <input
              type="radio"
              name="templateId"
              value={t.value}
              required
              defaultChecked={lastValues.templateId ? lastValues.templateId === t.value : i === 0}
              className="mt-1 h-5 w-5 shrink-0"
            />
            <span className="flex flex-col">
              <span className="text-[15px] font-semibold text-artego-black">{t.label}</span>
              <span className="text-sm text-grey-600">{t.description}</span>
            </span>
          </label>
        ))}
      </fieldset>

      {state.error && (
        <p role="alert" className="text-sm font-semibold text-danger">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
