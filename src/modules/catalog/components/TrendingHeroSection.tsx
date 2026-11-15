import "server-only";
import { getTrending } from "../api/server";
import { TrendingHero } from "./TrendingHero";

export async function TrendingHeroSection() {
  const items = await getTrending("all", "day");
  return <TrendingHero items={items.slice(0, 10)} />;
}
