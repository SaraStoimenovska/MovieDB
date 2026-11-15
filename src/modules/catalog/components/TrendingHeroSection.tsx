import "server-only";
import { HERO_SLIDES } from "@/shared/config/app";
import { getTrending, TrendingScope, TrendingWindow } from "../api/server";
import { TrendingHero } from "./TrendingHero";

export async function TrendingHeroSection() {
  const items = await getTrending(TrendingScope.All, TrendingWindow.Day);
  return <TrendingHero items={items.slice(0, HERO_SLIDES)} />;
}
