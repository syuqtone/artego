import BottomNav from "@/components/BottomNav";

// Same pattern as app/dashboard/layout.tsx — the bottom nav's own
// "Artist Directory" link points here, so this page needs the nav too
// or clicking it makes the whole nav disappear.
export default function ArtistsLayout({ children }: LayoutProps<"/artists">) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col" style={{ paddingBottom: "calc(56px + env(safe-area-inset-bottom))" }}>
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
