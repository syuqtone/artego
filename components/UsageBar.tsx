// quota.md: "Show usage... as a figure and a bar. Warn at 80%, not only
// at 100%." Status is never colour alone — the label text itself changes
// too ("near limit" / "limit reached").
export default function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const atLimit = used >= limit;
  const nearLimit = !atLimit && pct >= 80;
  const barColor = atLimit || nearLimit ? "var(--warning)" : "var(--artego-black)";

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-[15px] font-semibold text-artego-black">{label}</span>
        <span className="text-sm text-grey-600">
          {used} of {limit} used
          {atLimit ? " — limit reached" : nearLimit ? " — near limit" : ""}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={used}
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-label={label}
        className="mt-1 h-2 w-full overflow-hidden rounded-full bg-grey-100"
      >
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: barColor }} />
      </div>
    </div>
  );
}
