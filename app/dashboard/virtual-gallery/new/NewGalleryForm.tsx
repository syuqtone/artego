"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createGalleryAction, type NewGalleryState } from "../actions";
import { WALL_PRESETS, WALL_PRESET_LABEL, MAX_GALLERY_ARTWORKS } from "@/lib/virtual-gallery";

const initialState: NewGalleryState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-11 rounded bg-artego-red px-6 text-[15px] font-semibold text-artego-white disabled:opacity-60"
    >
      {pending ? "Creating..." : "Create Gallery"}
    </button>
  );
}

export default function NewGalleryForm({
  artworks,
}: {
  artworks: { id: string; title: string; thumbUrl: string | null }[];
}) {
  const [state, formAction] = useActionState(createGalleryAction, initialState);

  return (
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
          Wall <span aria-hidden>*</span>
        </legend>
        <div className="flex gap-2">
          {WALL_PRESETS.map((preset, i) => (
            <label
              key={preset}
              className="flex-1 rounded border border-grey-200 p-3 text-center text-[15px] font-semibold text-artego-black"
            >
              <input
                type="radio"
                name="wallPreset"
                value={preset}
                required
                defaultChecked={i === 0}
                className="sr-only"
              />
              {WALL_PRESET_LABEL[preset]}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-[15px] font-semibold text-artego-black">
          Artworks <span aria-hidden>*</span> (up to {MAX_GALLERY_ARTWORKS})
        </legend>
        <ul className="flex flex-col gap-2">
          {artworks.map((a) => (
            <li key={a.id}>
              <label className="flex items-center gap-3 rounded border border-grey-200 p-2">
                <input type="checkbox" name="artworkId" value={a.id} className="h-5 w-5 shrink-0" />
                {a.thumbUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.thumbUrl} alt={a.title} className="h-10 w-10 shrink-0 rounded object-cover" />
                ) : (
                  <span className="h-10 w-10 shrink-0 rounded bg-grey-100" />
                )}
                <span className="text-sm text-artego-black">{a.title}</span>
              </label>
            </li>
          ))}
        </ul>
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
