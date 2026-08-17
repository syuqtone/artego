import Link from "next/link";
import LoginForm from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const { reset } = await searchParams;

  return (
    <div className="mx-auto flex max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-9">
      <h1 className="text-xl font-semibold text-artego-black">Log In to ArteGO</h1>

      {reset === "success" && (
        <p className="rounded border border-success px-3 py-2 text-sm font-semibold text-success">
          Your new password has been saved. Log in with it below.
        </p>
      )}

      <LoginForm />

      <div className="flex flex-col items-center gap-2 text-center text-base text-grey-600">
        <Link href="/forgot-password" className="font-semibold text-artego-red-deep underline">
          Forgot your password?
        </Link>
        <p>
          Don&rsquo;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-artego-red-deep underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
