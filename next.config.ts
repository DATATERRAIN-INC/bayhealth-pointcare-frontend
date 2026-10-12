import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bundle the browser MQTT client; do not externalize (breaks client Turbopack builds).
  transpilePackages: ["mqtt"],
};

export default nextConfig;
