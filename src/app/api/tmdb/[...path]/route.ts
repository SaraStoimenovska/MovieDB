import { type NextRequest, NextResponse } from "next/server";
import { isTmdbRequestError, tmdbGetCached } from "@/shared/lib/tmdb/client";
import { isAllowedTmdbPath, pickAllowedQuery } from "@/shared/lib/tmdb/request";

/**
 * Thin read-only proxy so client components (infinite scroll, search) can call TMDB
 * without exposing the API key. Only allow-listed endpoints and query params pass.
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/tmdb/[...path]">) {
  const { path } = await ctx.params;
  const joinedPath = path.join("/");

  if (!isAllowedTmdbPath(joinedPath)) {
    return NextResponse.json({ error: "Endpoint not allowed" }, { status: 404 });
  }

  try {
    const data = await tmdbGetCached(joinedPath, pickAllowedQuery(request.nextUrl.searchParams));
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (error) {
    const status = isTmdbRequestError(error) ? error.status : 502;
    return NextResponse.json({ error: "Upstream request failed" }, { status });
  }
}
