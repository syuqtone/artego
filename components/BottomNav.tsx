"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const iconProps = {
  viewBox: "0 0 32 32",
  className: "h-6 w-6",
  "aria-hidden": true,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
} as const;

const NAV_ITEMS = [
  {
    label: "Home",
    href: "/dashboard",
    exact: true,
    icon: (
      <svg {...iconProps}>
        <path d="M6 15l10-9 10 9" />
        <path d="M9 14v11h14V14" />
      </svg>
    ),
  },
  {
    label: "Artworks",
    href: "/dashboard/artworks",
    exact: false,
    icon: (
      <svg {...iconProps}>
        <rect x="6" y="6" width="20" height="20" rx="1" />
        <path d="M6 21l6-6 5 5 4-4 5 5" />
      </svg>
    ),
  },
  {
    label: "Artist Directory",
    href: "/artists",
    exact: false,
    icon: (
      <svg {...iconProps}>
        <circle cx="16" cy="11" r="5" />
        <path d="M6 27c0-6 4.5-10 10-10s10 4 10 10" />
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    exact: false,
    icon: (
      <svg {...iconProps}>
        <circle cx="16" cy="16" r="4.5" />
        <path d="M16 6v3M16 23v3M6 16h3M23 16h3M9 9l2 2M21 21l2 2M23 9l-2 2M9 23l2-2" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-grey-200 bg-artego-white"
      style={{ paddingBottom: "calc(8px + env(safe-area-inset-bottom))" }}
    >
      <ul className="mx-auto flex w-full max-w-sm items-center justify-between px-2">
        {NAV_ITEMS.slice(0, 2).map((item) => (
          <NavItem key={item.href} item={item} pathname={pathname} />
        ))}

        <li className="flex flex-1 justify-center self-end">
          <Link
            href="/dashboard/create"
            className="-mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-artego-red text-artego-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-artego-blue"
            aria-label="Create"
          >
            <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden fill="none" stroke="currentColor" strokeWidth={2}>
              <line x1="16" y1="8" x2="16" y2="24" />
              <line x1="8" y1="16" x2="24" y2="16" />
            </svg>
          </Link>
        </li>

        {NAV_ITEMS.slice(2).map((item) => (
          <NavItem key={item.href} item={item} pathname={pathname} />
        ))}
      </ul>
    </nav>
  );
}

function NavItem({
  item,
  pathname,
}: {
  item: (typeof NAV_ITEMS)[number];
  pathname: string;
}) {
  const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <li className="flex-1">
      <Link
        href={item.href}
        aria-current={isActive ? "page" : undefined}
        className={`flex min-h-11 flex-col items-center gap-0.5 py-3 text-center text-xs focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-artego-blue ${
          isActive ? "font-semibold text-artego-red-deep" : "font-normal text-grey-600"
        }`}
      >
        {item.icon}
        {item.label}
      </Link>
    </li>
  );
}
