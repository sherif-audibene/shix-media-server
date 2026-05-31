import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Point the plugin at the i18n request config.
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Pin the tracing root to this project (a stray lockfile lives one dir up).
  outputFileTracingRoot: import.meta.dirname,
  // Keep ffmpeg-static unbundled so its __dirname-based binary path resolves
  // to the real node_modules location at runtime.
  serverExternalPackages: ["ffmpeg-static"],
  // Validate env at build/start time as a side effect.
  // (imported for its top-level parse)
  experimental: {
    // MUI + Emotion benefit from optimized package imports.
    optimizePackageImports: ["@mui/material", "@mui/icons-material"],
  },
};

export default withNextIntl(nextConfig);
