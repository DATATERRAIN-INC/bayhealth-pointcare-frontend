import type { NextConfig } from "next";

/**
 * mqtt@5.x already declares browser exports → dist/mqtt.esm.js.
 * Do not add turbopack.resolveAlias for `mqtt` (e.g. mqtt/dist/mqtt.esm.js):
 * that import map breaks `next build` on AWS/Linux Turbopack with
 * "Can't resolve 'mqtt'" even when the package is installed.
 */
const nextConfig: NextConfig = {};

export default nextConfig;
