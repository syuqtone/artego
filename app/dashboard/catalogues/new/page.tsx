"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createCatalogueAction, type NewCatalogueState } from "./actions";

const initialState: NewCatalogueState = {};

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
      {pending ? "Creating..." : "Create Catalogue"}
    </button>
  );
}

export default function NewCataloguePage() {
  const [state, formAction] = useActionState(createCatalogueAction, initialState);

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-6 px-4 py-9">
      <div>
        <Link href="/dashboard/catalogues" className="text-sm font-semibold text-artego-red-deep underline">
          ← Catalogues
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-artego-black">New Catalogue</h1>
      </div>

      <form action={formAction} className="flex flex-col gap-6" noValidate>
        <div className="flex flex-col gap-1">
          <label htmlFor="title" className="text-[15px] font-semibold text-artego-black">
            Title <span aria-hidden>*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            className="min-h-11 rounded border border-grey-200 px-3 text-base text-artego-black focus:border-artego-black focus:outline focus:outline-2 focus:outline-artego-blue"
          />
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-[15px] font-semibold text-artego-black">
            Template <span aria-hidden>*</span>
          </legend>
          {TEMPLATES.map((t, i) => (
            <label
              key={t.value}
              className="flex items-start gap-3 rounded border border-grey-200 p-3"
            >
              <input
                type="radio"
                name="templateId"
                value={t.value}
                required
                defaultChecked={i === 0}
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
    </div>
  );
}
