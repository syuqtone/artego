import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type CreateOption = {
  label: string;
  description: string;
  icon: React.ReactNode;
  available: boolean;
  href?: string;
};

const iconProps = {
  viewBox: "0 0 32 32",
  className: "h-8 w-8",
  "aria-hidden": true,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
} as const;

const OPTIONS: CreateOption[] = [
  {
    label: "Catalogue",
    description: "Select artworks, choose a template, publish online and as a PDF.",
    available: true,
    href: "/dashboard/catalogues/new",
    icon: (
      <svg {...iconProps}>
        <rect x="7" y="5" width="18" height="22" rx="1" />
        <line x1="11" y1="11" x2="21" y2="11" />
        <line x1="11" y1="16" x2="21" y2="16" />
        <line x1="11" y1="21" x2="17" y2="21" />
      </svg>
    ),
  },
  {
    label: "Portfolio",
    description: "A focused set of works from one of your collections.",
    available: false,
    icon: (
      <svg {...iconProps}>
        <path d="M5 11a2 2 0 0 1 2-2h5l2 3h11a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" />
      </svg>
    ),
  },
  {
    label: "Virtual Gallery",
    description: "A walkable 2D room showing your artworks at true scale.",
    available: false,
    icon: (
      <svg {...iconProps}>
        <rect x="4" y="8" width="24" height="17" rx="1" />
        <rect x="8" y="12" width="6" height="6" />
        <rect x="18" y="12" width="6" height="6" />
      </svg>
    ),
  },
  {
    label: "Room Visualisation",
    description: "See one artwork on a real wall photo, at true proportion.",
    available: false,
    icon: (
      <svg {...iconProps}>
        <rect x="4" y="4" width="24" height="18" rx="1" />
        <circle cx="11" cy="11" r="2" />
        <path d="M4 19l6-6 5 5 4-4 7 7" />
      </svg>
    ),
  },
  {
    label: "Exhibition",
    description: "A solo or group exhibition workspace, with invitations.",
    available: false,
    icon: (
      <svg {...iconProps}>
        <rect x="5" y="6" width="22" height="20" rx="1" />
        <line x1="5" y1="12" x2="27" y2="12" />
        <line x1="11" y1="4" x2="11" y2="8" />
        <line x1="21" y1="4" x2="21" y2="8" />
      </svg>
    ),
  },
];

export default async function CreateMenuPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-6 px-4 py-9">
      <div>
        <Link href="/dashboard" className="text-sm font-semibold text-artego-red-deep underline">
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-artego-black">
          What would you like to create?
        </h1>
      </div>

      <ul className="flex flex-col gap-3">
        {OPTIONS.map((option) => {
          const content = (
            <>
              <span className="shrink-0 text-artego-black">{option.icon}</span>
              <span className="flex flex-col gap-1">
                <span className="flex items-center gap-2">
                  <span className="text-[15px] font-semibold text-artego-black">
                    {option.label}
                  </span>
                  {!option.available && (
                    <span className="rounded-full bg-grey-100 px-2 py-0.5 text-xs font-semibold text-grey-600">
                      Coming soon
                    </span>
                  )}
                </span>
                <span className="text-sm text-grey-600">{option.description}</span>
              </span>
            </>
          );
          return (
            <li key={option.label}>
              {option.available && option.href ? (
                <Link
                  href={option.href}
                  className="flex items-start gap-4 rounded border border-grey-200 p-4"
                >
                  {content}
                </Link>
              ) : (
                <div className="flex items-start gap-4 rounded border border-grey-200 p-4">
                  {content}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
