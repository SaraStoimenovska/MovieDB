import "server-only";
import { MediaCarousel } from "@/modules/media";
import { getMovieList, type MovieList } from "../api/server";

type Props = { readonly title: string; readonly list: MovieList };

/** "In theaters" / "Coming soon" carousel (not auto-advancing: these are for browsing). */
export async function MovieListRow({ title, list }: Props) {
  return <MediaCarousel title={title} items={await getMovieList(list)} />;
}
