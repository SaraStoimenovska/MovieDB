"use client";

import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { type ComponentType } from "react";
import { isTheme, type Theme, THEME_LABELS, THEMES } from "../model/theme";
import { useHydrated } from "@/shared/hooks/useHydrated";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

const THEME_ICONS: Readonly<Record<Theme, ComponentType<{ className?: string }>>> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const hydrated = useHydrated();
  // The stored theme is only known on the client; show "system" until hydrated to match the server HTML.
  const current: Theme = hydrated && isTheme(theme) ? theme : "system";
  const CurrentIcon = THEME_ICONS[current];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Theme: ${THEME_LABELS[current]}`}>
          <CurrentIcon className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {THEMES.map((option) => {
          const Icon = THEME_ICONS[option];
          return (
            <DropdownMenuItem key={option} onSelect={() => setTheme(option)}>
              <Icon className="size-4" />
              {THEME_LABELS[option]}
              {current === option && <Check className="ml-auto size-4" aria-hidden />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
