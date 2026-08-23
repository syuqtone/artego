import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import IntroVideo from "@/components/IntroVideo";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      {/* Visually hidden — the video below already carries the ArteGO
          wordmark, but the page still needs exactly one real heading
          for screen readers and document structure (CLAUDE.md rule 8). */}
      <h1 className="sr-only">ArteGO</h1>
      <div className="mt-8 w-full">
        <IntroVideo />
      </div>
      <p className="mt-2 max-w-xs text-base text-grey-600">
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
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-artego-red-deep">
        Art Connects People
      </p>
    </div>
  );
}
