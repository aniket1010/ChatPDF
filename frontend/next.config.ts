import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // Handle PDF.js binary files
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };
    
    // Ignore binary files from PDF.js
    config.module.rules.push({
      test: /\.node$/,
      use: 'ignore-loader',
    });
    
    return config;
  },
  // Disable server-side rendering for PDF.js
  experimental: {
    esmExternals: 'loose',
  },
};

export default nextConfig;
