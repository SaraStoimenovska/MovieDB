"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mainNav } from "@/shared/config/routes";
import { cn } from "@/shared/utils/cn";
import { isNavItemActive } from "../model/nav";

/** Desktop primary navigation (md and up). Short by design, so it never needs to scroll. */
export function MainNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="hidden md:block">
      <ul className="flex items-center gap-1">
        {mainNav.map((item) => {
          const active = isNavItemActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  active && "text-foreground",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
