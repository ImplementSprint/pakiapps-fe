import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": path.resolve("./src"),
      "react-router": path.resolve("./src/lib/react-router-compat.tsx")
    };

    return config;
  }
};

export default nextConfig;
