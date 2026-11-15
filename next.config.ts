import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "image.tmdb.org", pathname: "/t/p/**" }],
  },
  experimental: {
    // Tree-shake big icon/UI barrels so pages only ship the icons they use.
    optimizePackageImports: ["lucide-react", "radix-ui"],
  },
  // Movies and Series used to be separate pages; they're now tabs of /browse.
  async redirects() {
    return [
      { source: "/movies", destination: "/browse", permanent: true },
      { source: "/tv", destination: "/browse?type=tv", permanent: true },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
