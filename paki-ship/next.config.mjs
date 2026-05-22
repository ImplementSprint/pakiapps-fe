import path from "path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.resolve(".."),
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@": path.resolve("./src"),
      "react-router": path.resolve("./src/lib/react-router-compat.tsx"),
    };

    return config;
  },
};

export default nextConfig;
