"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signUpAction, type SignUpState } from "./actions";

const initialState: SignUpState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-11 w-full rounded bg-artego-red px-4 text-[15px] font-semibold text-artego-white disabled:opacity-60"
    >
      {pending ? "Mendaftar..." : "Daftar"}
    </button>
  );
}

export default function SignUpPage() {
  const [state, formAction] = useActionState(signUpAction, initialState);

  if (state.success) {
    return (
      <div className="mx-auto flex max-w-sm flex-1 flex-col justify-center gap-4 px-4 py-9 text-center">
        <h1 className="text-xl font-semibold text-artego-black">Semak emel awak</h1>
        <p className="text-base text-grey-600">
          Kami dah hantar pautan pengesahan. Klik pautan tu untuk sahkan akaun dan log masuk automatik.
        </p>
        <Link href="/login" className="text-base font-semibold text-artego-red-deep underline">
          Kembali ke Log In
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-9">
      <h1 className="text-xl font-semibold text-artego-black">Daftar Akaun ArteGO</h1>

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

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-[15px] font-semibold text-artego-black">
            Kata Laluan
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

        {state.error && (
          <p role="alert" className="text-sm font-semibold text-danger">
            {state.error}
          </p>
        )}

        <SubmitButton />
      </form>

      <p className="text-center text-base text-grey-600">
        Dah ada akaun?{" "}
        <Link href="/login" className="font-semibold text-artego-red-deep underline">
          Log In
        </Link>
      </p>
    </div>
  );
}
