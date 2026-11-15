"use client";

import { Bookmark, Heart, Settings, UserRound } from "lucide-react";
import Link from "next/link";
import { type ComponentType } from "react";
import { routes } from "@/shared/config/routes";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

type MenuLink = {
  readonly label: string;
  readonly href: string;
  readonly icon: ComponentType<{ className?: string }>;
};

const LIBRARY_LINKS: ReadonlyArray<MenuLink> = [
  { label: "Favorites", href: routes.favorites(), icon: Heart },
  { label: "My list", href: routes.myList(), icon: Bookmark },
];

export function UserMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Your account">
          <UserRound className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Saved in this browser
        </DropdownMenuLabel>
        {LIBRARY_LINKS.map(({ label, href, icon: Icon }) => (
          <DropdownMenuItem key={href} asChild>
            <Link href={href}>
              <Icon className="size-4" />
              {label}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={routes.preferences()}>
            <Settings className="size-4" />
            Preferences
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
