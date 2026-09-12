import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "standalone" packages a self-contained server for the Docker image
  // (see the client Dockerfile) — but Vercel's own build pipeline doesn't
  // support it: with this set, Next.js emits its traced server files under
  // .next/standalone/ instead of the top-level .next/ location Vercel's
  // build-completion step expects, which fails with ENOENT on
  // next-server.js.nft.json right after an otherwise-successful build.
  // Vercel sets VERCEL=1 for every build it runs, so this only takes
  // effect for a local/Docker `next build`, never on Vercel.
  output: process.env.VERCEL ? undefined : "standalone",
  turbopack: {
    root: path.join(__dirname),
  },
  devIndicators: false,
};

export default nextConfig;
