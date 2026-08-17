import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logoutAction } from "@/app/logout/actions";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <span aria-hidden className="h-3 w-3 rounded-full bg-artego-red" />
      <h1 className="text-3xl font-bold tracking-tight text-artego-black">
        ArteGO
      </h1>

      {user ? (
        <>
          <p className="max-w-xs text-base text-grey-600">
            Log masuk sebagai <span className="font-semibold text-artego-black">{user.email}</span>
          </p>
          <form action={logoutAction}>
            <button
              type="submit"
              className="min-h-11 rounded border border-artego-black px-5 text-[15px] font-semibold text-artego-black"
            >
              Log Keluar
            </button>
          </form>
        </>
      ) : (
        <>
          <p className="max-w-xs text-base text-grey-600">
            Slice 1.1 — akaun dan log masuk.
          </p>
          <div className="flex gap-3">
            <Link
              href="/signup"
              className="flex min-h-11 items-center rounded bg-artego-red px-5 text-[15px] font-semibold text-artego-white"
            >
              Daftar
            </Link>
            <Link
              href="/login"
              className="flex min-h-11 items-center rounded border border-artego-black px-5 text-[15px] font-semibold text-artego-black"
            >
              Log In
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
