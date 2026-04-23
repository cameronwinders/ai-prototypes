"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Timeline", segment: "timeline", matches: ["timeline", "events"] },
  { label: "Reminders", segment: "reminders", matches: ["reminders"] },
  { label: "Notifications", segment: "notifications", matches: ["notifications"] },
  { label: "Members", segment: "members", matches: ["members"] }
];

export function SpaceNav({ spaceId }: { spaceId: string }) {
  const pathname = usePathname();

  return (
    <nav className="space-nav" aria-label="Space navigation">
      {navItems.map((item) => {
        const href = `/spaces/${spaceId}/${item.segment}`;
        const isActive = item.matches.some((segment) => {
          const matchedPath = `/spaces/${spaceId}/${segment}`;
          return pathname === matchedPath || pathname.startsWith(`${matchedPath}/`);
        });

        return (
          <Link aria-current={isActive ? "page" : undefined} className={isActive ? "is-active" : ""} href={href} key={item.segment}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
