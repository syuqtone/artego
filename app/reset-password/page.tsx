"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { resetPasswordAction, type ResetPasswordState } from "./actions";

const initialState: ResetPasswordState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-11 w-full rounded bg-artego-red px-4 text-[15px] font-semibold text-artego-white disabled:opacity-60"
    >
      {pending ? "Menyimpan..." : "Simpan Kata Laluan Baru"}
    </button>
  );
}

export default function ResetPasswordPage() {
  const [state, formAction] = useActionState(resetPasswordAction, initialState);

  return (
    <div className="mx-auto flex max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-9">
      <h1 className="text-xl font-semibold text-artego-black">Set Kata Laluan Baru</h1>

      <form action={formAction} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-[15px] font-semibold text-artego-black">
            Kata Laluan Baru
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            aria-describedby="password-hint"
            className="min-h-11 rounded border border-grey-200 px-3 text-base text-artego-black focus:border-artego-black focus:outline focus:outline-2 focus:outline-artego-blue"
          />
          <p id="password-hint" className="text-sm text-grey-600">
            Sekurang-kurangnya 6 aksara.
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="confirmPassword" className="text-[15px] font-semibold text-artego-black">
            Sahkan Kata Laluan Baru
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className="min-h-11 rounded border border-grey-200 px-3 text-base text-artego-black focus:border-artego-black focus:outline focus:outline-2 focus:outline-artego-blue"
          />
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
