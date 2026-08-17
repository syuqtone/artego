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
      {pending ? "Sending..." : "Send Reset Link"}
    </button>
  );
}

export default function ForgotPasswordPage() {
  const [state, formAction] = useActionState(forgotPasswordAction, initialState);

  if (state.success) {
    return (
      <div className="mx-auto flex max-w-sm flex-1 flex-col justify-center gap-4 px-4 py-9 text-center">
        <h1 className="text-xl font-semibold text-artego-black">Check your email</h1>
        <p className="text-base text-grey-600">
          If that email is registered with ArteGO, we&rsquo;ve sent a link to set a new password.
        </p>
        <Link href="/login" className="text-base font-semibold text-artego-red-deep underline">
          Back to Log In
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-9">
      <h1 className="text-xl font-semibold text-artego-black">Forgot Password</h1>
      <p className="text-base text-grey-600">
        Enter your account email. We&rsquo;ll send you a link to set a new password.
      </p>

      <form action={formAction} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-[15px] font-semibold text-artego-black">
            Email
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
        Remember your password?{" "}
        <Link href="/login" className="font-semibold text-artego-red-deep underline">
          Log In
        </Link>
      </p>
    </div>
  );
}
