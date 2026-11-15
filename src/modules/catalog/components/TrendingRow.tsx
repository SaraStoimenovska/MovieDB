import "server-only";
import { MediaCarousel } from "@/modules/media";
import { getTrending, TrendingScope, TrendingWindow } from "../api/server";

type Props = {
  readonly title: string;
  readonly scope: TrendingScope;
  readonly window?: TrendingWindow;
  readonly href?: string;
};

/** Cached server data → auto-advancing, infinitely looping carousel. */
export async function TrendingRow({ title, scope, window = TrendingWindow.Week, href }: Props) {
  const items = await getTrending(scope, window);
  return (
    <MediaCarousel
      title={title}
      items={items}
      href={href}
      showType={scope === TrendingScope.All}
      autoplay
    />
  );
}
