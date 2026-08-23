import BottomNav from "@/components/BottomNav";

// Persistent bottom navigation across the whole creator area
// (BUILD-ORDER.md 8.2). paddingBottom reserves room for the fixed nav bar
// (measured ~99px tall — two-line "Artist Directory" label plus the
// breathing-room padding added around every item — so it never overlaps
// the last part of a page's content.
export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col" style={{ paddingBottom: "calc(100px + env(safe-area-inset-bottom))" }}>
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
