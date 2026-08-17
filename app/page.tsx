export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <span aria-hidden className="h-3 w-3 rounded-full bg-artego-red" />
      <h1 className="text-3xl font-bold tracking-tight text-artego-black">
        ArteGO
      </h1>
      <p className="max-w-xs text-base text-grey-600">
        Slice 0.1 — asas projek sudah jalan.
      </p>
    </div>
  );
}
