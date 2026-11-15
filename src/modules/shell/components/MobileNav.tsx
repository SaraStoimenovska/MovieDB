"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { APP_NAME } from "@/shared/config/app";
import { mainNav, type NavItem, userNav } from "@/shared/config/routes";
import { Button } from "@/shared/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/shared/ui/sheet";
import { cn } from "@/shared/utils/cn";
import { isNavItemActive } from "../model/nav";

/** Mobile navigation drawer (below md): all destinations, grouped. Closes on navigation. */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const renderGroup = (label: string, items: ReadonlyArray<NavItem>) => (
    <nav aria-label={label} className="space-y-1">
      <p className="px-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <ul>
        {items.map((item) => {
          const active = isNavItemActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "block rounded-md px-3 py-2 text-sm font-medium hover:bg-accent",
                  active && "bg-accent",
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

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetHeader>
          <SheetTitle>{APP_NAME}</SheetTitle>
        </SheetHeader>
        <div className="space-y-6 px-2">
          {renderGroup("Menu", mainNav)}
          {renderGroup("Your library", userNav)}
        </div>
      </SheetContent>
    </Sheet>
  );
}
