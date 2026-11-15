"use client";

import { useHydrated } from "@/shared/hooks/useHydrated";
import { ageInYears } from "../model/person";

type Props = { readonly birthday: string; readonly deathday: string | null };

/**
 * " (age 63)" / " (aged 79)". Computed in the browser: under Cache Components a server
 * component must not read the current time while prerendering (it would freeze the age).
 */
export function AgeLabel({ birthday, deathday }: Props) {
  const hydrated = useHydrated();
  if (!hydrated) return null;
  const age = ageInYears(birthday, deathday ? new Date(deathday) : new Date());
  if (age === null) return null;
  return (
    <>
      {" "}
      ({deathday ? "aged" : "age"} {age})
    </>
  );
}
