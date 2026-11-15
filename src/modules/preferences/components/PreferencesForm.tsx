"use client";

import { Globe, Monitor, Moon, Palette, Sun, UserRound } from "lucide-react";
import { useTheme } from "next-themes";
import { type ComponentType, useId, useState } from "react";
import { toast } from "sonner";
import { useHydrated } from "@/shared/hooks/useHydrated";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { cn } from "@/shared/utils/cn";
import { DISPLAY_NAME_MAX_LENGTH } from "../model/preferences";
import { DEFAULT_THEME, isTheme, Theme, THEME_LABELS, THEMES } from "../model/theme";
import { useDisplayName, useRegion } from "../store/preferences-store";
import { PreferenceSection } from "./PreferenceSection";

type Region = { readonly code: string; readonly name: string };

const THEME_ICONS: Readonly<Record<Theme, ComponentType<{ className?: string }>>> = {
  [Theme.Light]: Sun,
  [Theme.Dark]: Moon,
  [Theme.System]: Monitor,
};

export function PreferencesForm({ regions }: { readonly regions: ReadonlyArray<Region> }) {
  return (
    <div className="space-y-6">
      <ProfileSection />
      <AppearanceSection />
      <RegionSection regions={regions} />
    </div>
  );
}

function ProfileSection() {
  const inputId = useId();
  const ready = useHydrated();
  const { displayName, setDisplayName } = useDisplayName();

  return (
    <PreferenceSection
      icon={UserRound}
      title="Your name"
      description="Signed on your reviews and comments. There are no accounts: it's stored only in this browser."
    >
      {ready ? (
        <NameForm
          key={displayName}
          inputId={inputId}
          initial={displayName}
          onSave={setDisplayName}
        />
      ) : (
        <div className="h-9" aria-hidden />
      )}
    </PreferenceSection>
  );
}

function NameForm({
  inputId,
  initial,
  onSave,
}: {
  readonly inputId: string;
  readonly initial: string;
  readonly onSave: (name: string) => void;
}) {
  const [name, setName] = useState(initial);
  const changed = name.trim() !== initial;

  return (
    <form
      className="flex flex-col gap-2 sm:flex-row sm:items-end"
      onSubmit={(event) => {
        event.preventDefault();
        onSave(name);
        toast("Name saved", { description: name.trim() || "Cleared" });
      }}
    >
      <div className="flex-1 space-y-1.5">
        <Label htmlFor={inputId}>Display name</Label>
        <Input
          id={inputId}
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={DISPLAY_NAME_MAX_LENGTH}
          autoComplete="nickname"
          placeholder="e.g. Sam"
        />
      </div>
      <Button type="submit" disabled={!changed}>
        Save
      </Button>
    </form>
  );
}

function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  const hydrated = useHydrated();
  const current: Theme = hydrated && isTheme(theme) ? theme : DEFAULT_THEME;

  return (
    <PreferenceSection
      icon={Palette}
      title="Appearance"
      description="Light, dark, or follow your device's setting."
    >
      <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-2">
        {THEMES.map((option) => {
          const Icon = THEME_ICONS[option];
          const selected = current === option;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setTheme(option)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-lg border p-3 text-sm transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                selected && "border-primary bg-accent",
              )}
            >
              <Icon className="size-5" aria-hidden />
              {THEME_LABELS[option]}
            </button>
          );
        })}
      </div>
    </PreferenceSection>
  );
}

function RegionSection({ regions }: { readonly regions: ReadonlyArray<Region> }) {
  const { region, setRegion, ready } = useRegion();

  return (
    <PreferenceSection
      icon={Globe}
      title="Region"
      description="Used for “Where to watch”: streaming, rental and purchase options differ by country."
    >
      <Select
        value={region}
        disabled={!ready}
        onValueChange={(value) => {
          setRegion(value);
          toast("Region updated", {
            description: regions.find((r) => r.code === value)?.name ?? value,
          });
        }}
      >
        <SelectTrigger className="w-full sm:w-72" aria-label="Region">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-80">
          {regions.map((option) => (
            <SelectItem key={option.code} value={option.code}>
              {option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </PreferenceSection>
  );
}
