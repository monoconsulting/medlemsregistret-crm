import type { NextConfig } from "next"

const enableStaticExport =
  process.env.NEXT_ENABLE_STATIC_EXPORT === "true" ||
  process.env.NEXT_OUTPUT === "export"

const nextConfig: NextConfig = enableStaticExport
  ? {
      output: "export",
      images: {
        unoptimized: true,
      },
    }
  : {}

export default nextConfig
