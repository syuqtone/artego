import BottomNav from "@/components/BottomNav";

// Same pattern as app/dashboard/layout.tsx — reached by clicking an
// artist from the Artist Directory, which itself needs the nav for the
// same reason (see app/artists/layout.tsx).
export default function ArtistProfileLayout({ children }: LayoutProps<"/artist/[id]">) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col" style={{ paddingBottom: "calc(56px + env(safe-area-inset-bottom))" }}>
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
