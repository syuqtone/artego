"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  ARTWORK_AVAILABILITY_OPTIONS,
  ARTWORK_CATEGORIES,
  ARTWORK_VISIBILITY_OPTIONS,
  DIMENSION_UNITS,
  MEDIUMS,
  PRICE_VISIBILITY_OPTIONS,
} from "@/lib/profile-options";
import { createArtworkAction, type NewArtworkState } from "./actions";

const initialState: NewArtworkState = {};

const inputClass =
  "min-h-11 rounded border border-grey-200 px-3 text-base text-artego-black focus:border-artego-black focus:outline focus:outline-2 focus:outline-artego-blue";
const labelClass = "text-[15px] font-semibold text-artego-black";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-11 rounded bg-artego-red px-6 text-[15px] font-semibold text-artego-white disabled:opacity-60"
    >
      {pending ? "Saving..." : "Save Artwork"}
    </button>
  );
}

export default function ArtworkForm({ copyrightDefault }: { copyrightDefault: string }) {
  const [state, formAction] = useActionState(createArtworkAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      {state.error && (
        <p role="alert" className="rounded border border-danger px-3 py-2 text-sm font-semibold text-danger">
          {state.error}
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="image" className={labelClass}>
          Artwork Image <span aria-hidden>*</span>
        </label>
        <input
          id="image"
          name="image"
          type="file"
          required
          accept="image/jpeg,image/png,image/webp"
          className={inputClass}
        />
        <p className="text-sm text-grey-600">JPG, PNG or WebP. Maximum 10 MB.</p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="title" className={labelClass}>
          Title
        </label>
        <input id="title" name="title" type="text" placeholder="Untitled" className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="titleIdentifier" className={labelClass}>
          Title Identifier
        </label>
        <input
          id="titleIdentifier"
          name="titleIdentifier"
          type="text"
          placeholder="e.g. I, or (Blue)"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="year" className={labelClass}>
          Year <span aria-hidden>*</span>
        </label>
        <input
          id="year"
          name="year"
          type="text"
          required
          placeholder="e.g. 2024, or Undated"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="medium" className={labelClass}>
          Medium <span aria-hidden>*</span>
        </label>
        <select id="medium" name="medium" required defaultValue="" className={inputClass}>
          <option value="" disabled>
            Choose a medium
          </option>
          {MEDIUMS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="mediumOther" className={labelClass}>
          Medium (if &ldquo;Other&rdquo;)
        </label>
        <input id="mediumOther" name="mediumOther" type="text" className={inputClass} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="category" className={labelClass}>
          Category <span aria-hidden>*</span>
        </label>
        <select id="category" name="category" required defaultValue="" className={inputClass}>
          <option value="" disabled>
            Choose a category
          </option>
          {ARTWORK_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className={labelClass}>Dimensions</legend>
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="height" className="text-sm text-grey-600">
              Height
            </label>
            <input id="height" name="height" type="number" step="0.1" min="0" className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="width" className="text-sm text-grey-600">
              Width
            </label>
            <input id="width" name="width" type="number" step="0.1" min="0" className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="depth" className="text-sm text-grey-600">
              Depth
            </label>
            <input id="depth" name="depth" type="number" step="0.1" min="0" className={inputClass} />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="dimensionUnit" className="text-sm text-grey-600">
            Unit
          </label>
          <select id="dimensionUnit" name="dimensionUnit" defaultValue="cm" className={inputClass}>
            {DIMENSION_UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
        <p className="text-sm text-grey-600">
          Recommended now, required later for Room Visualisation and Virtual Gallery.
        </p>
      </fieldset>

      <div className="flex flex-col gap-1">
        <label htmlFor="description" className={labelClass}>
          Description
        </label>
        <textarea id="description" name="description" rows={4} className={`${inputClass} min-h-0 py-2`} />
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className={labelClass}>Price</legend>
        <div className="flex gap-2">
          <div className="flex flex-1 flex-col gap-1">
            <label htmlFor="price" className="text-sm text-grey-600">
              Amount
            </label>
            <input id="price" name="price" type="number" step="0.01" min="0" className={inputClass} />
          </div>
          <div className="flex w-24 flex-col gap-1">
            <label htmlFor="priceCurrency" className="text-sm text-grey-600">
              Currency
            </label>
            <input id="priceCurrency" name="priceCurrency" type="text" placeholder="MYR" className={inputClass} />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="priceVisibility" className="text-sm text-grey-600">
            Price Visibility
          </label>
          <select id="priceVisibility" name="priceVisibility" defaultValue="hidden" className={inputClass}>
            {PRICE_VISIBILITY_OPTIONS.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      <div className="flex flex-col gap-1">
        <label htmlFor="availability" className={labelClass}>
          Availability <span aria-hidden>*</span>
        </label>
        <select id="availability" name="availability" required defaultValue="available" className={inputClass}>
          {ARTWORK_AVAILABILITY_OPTIONS.map((v) => (
            <option key={v.value} value={v.value}>
              {v.label}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className={labelClass}>Edition</legend>
        <div className="flex gap-2">
          <div className="flex flex-1 flex-col gap-1">
            <label htmlFor="editionNumber" className="text-sm text-grey-600">
              Number
            </label>
            <input id="editionNumber" name="editionNumber" type="text" placeholder="e.g. 3" className={inputClass} />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <label htmlFor="editionTotal" className="text-sm text-grey-600">
              Total
            </label>
            <input id="editionTotal" name="editionTotal" type="text" placeholder="e.g. 10" className={inputClass} />
          </div>
        </div>
      </fieldset>

      <div className="flex flex-col gap-1">
        <label htmlFor="copyrightOwner" className={labelClass}>
          Copyright Owner
        </label>
        <input
          id="copyrightOwner"
          name="copyrightOwner"
          type="text"
          placeholder={copyrightDefault}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="visibility" className={labelClass}>
          Visibility <span aria-hidden>*</span>
        </label>
        <select id="visibility" name="visibility" required defaultValue="private" className={inputClass}>
          {ARTWORK_VISIBILITY_OPTIONS.map((v) => (
            <option key={v.value} value={v.value}>
              {v.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="altText" className={labelClass}>
          Alt Text
        </label>
        <input
          id="altText"
          name="altText"
          type="text"
          aria-describedby="altText-hint"
          className={inputClass}
        />
        <p id="altText-hint" className="text-sm text-grey-600">
          A short, factual description of the image, for screen readers.
        </p>
      </div>

      <SubmitButton />
    </form>
  );
}
