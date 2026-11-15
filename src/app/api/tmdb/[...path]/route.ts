import { type NextRequest, NextResponse } from "next/server";
import { HttpStatus } from "@/shared/config/http";
import { PROXY_CACHE_SECONDS } from "@/shared/config/timing";
import { isTmdbRequestError, tmdbGetCached } from "@/shared/lib/tmdb/client";
import { isAllowedTmdbPath, pickAllowedQuery } from "@/shared/lib/tmdb/request";

const CACHE_CONTROL = `public, s-maxage=${PROXY_CACHE_SECONDS.maxAge}, stale-while-revalidate=${PROXY_CACHE_SECONDS.staleWhileRevalidate}`;

/**
 * Thin read-only proxy so client components (infinite scroll, search) can call TMDB
 * without exposing the API key. Only allow-listed endpoints and query params pass.
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/tmdb/[...path]">) {
  const { path } = await ctx.params;
  const joinedPath = path.join("/");

  if (!isAllowedTmdbPath(joinedPath)) {
    return NextResponse.json({ error: "Endpoint not allowed" }, { status: HttpStatus.NotFound });
  }

  try {
    const data = await tmdbGetCached(joinedPath, pickAllowedQuery(request.nextUrl.searchParams));
    return NextResponse.json(data, { headers: { "Cache-Control": CACHE_CONTROL } });
  } catch (error) {
    const status = isTmdbRequestError(error) ? error.status : HttpStatus.BadGateway;
    return NextResponse.json({ error: "Upstream request failed" }, { status });
  }
}
