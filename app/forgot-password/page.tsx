"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { forgotPasswordAction, type ForgotPasswordState } from "./actions";

const initialState: ForgotPasswordState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-11 w-full rounded bg-artego-red px-4 text-[15px] font-semibold text-artego-white disabled:opacity-60"
    >
      {pending ? "Menghantar..." : "Hantar Pautan Reset"}
    </button>
  );
}

export default function ForgotPasswordPage() {
  const [state, formAction] = useActionState(forgotPasswordAction, initialState);

  if (state.success) {
    return (
      <div className="mx-auto flex max-w-sm flex-1 flex-col justify-center gap-4 px-4 py-9 text-center">
        <h1 className="text-xl font-semibold text-artego-black">Semak emel awak</h1>
        <p className="text-base text-grey-600">
          Kalau emel tu berdaftar dengan ArteGO, kami dah hantar pautan untuk set kata laluan baru.
        </p>
        <Link href="/login" className="text-base font-semibold text-artego-red-deep underline">
          Kembali ke Log In
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-9">
      <h1 className="text-xl font-semibold text-artego-black">Lupa Kata Laluan</h1>
      <p className="text-base text-grey-600">
        Masukkan emel akaun awak. Kami hantar pautan untuk set kata laluan baru.
      </p>

      <form action={formAction} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-[15px] font-semibold text-artego-black">
            Emel
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
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

      <p className="text-center text-base text-grey-600">
        Ingat kata laluan?{" "}
        <Link href="/login" className="font-semibold text-artego-red-deep underline">
          Log In
        </Link>
      </p>
    </div>
  );
}
