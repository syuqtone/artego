import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <span aria-hidden className="h-3 w-3 rounded-full bg-artego-red" />
      <h1 className="text-3xl font-bold tracking-tight text-artego-black">
        ArteGO
      </h1>
      <p className="max-w-xs text-base text-grey-600">
        Digital art publishing platform.
      </p>
      <div className="flex gap-3">
        <Link
          href="/signup"
          className="flex min-h-11 items-center rounded bg-artego-red px-5 text-[15px] font-semibold text-artego-white"
        >
          Sign Up
        </Link>
        <Link
          href="/login"
          className="flex min-h-11 items-center rounded border border-artego-black px-5 text-[15px] font-semibold text-artego-black"
        >
          Log In
        </Link>
      </div>
      <Link href="/discover" className="text-[15px] font-semibold text-artego-red-deep underline">
        Discover artists and artworks
      </Link>
    </div>
  );
}
