import type { NextConfig } from "next";

/**
 * Point `mqtt` at the browser ESM file.
 * Turbopack (especially on Linux CI) often fails on mqtt's conditional "exports".
 * Use a package-relative path — absolute Windows paths break Turbopack.
 */
const mqttBrowserEntry = "mqtt/dist/mqtt.esm.js";

const nextConfig: NextConfig = {
  transpilePackages: ["mqtt"],
  turbopack: {
    resolveAlias: {
      mqtt: mqttBrowserEntry,
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      mqtt: mqttBrowserEntry,
    };
    return config;
  },
};

export default nextConfig;
