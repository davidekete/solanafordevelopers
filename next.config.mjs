import { createMDX } from "fumadocs-mdx/next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withMDX = createMDX();
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
  openAnalyzer: false,
});

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  experimental: {
    turbo: {
      rules: {
        "*.svg": {
          loaders: ["@svgr/webpack"],
          as: "*.js",
        },
      },
    },
  },
  webpack: (config) => {
    const fileLoaderRule = config.module.rules.find((rule) =>
      rule.test?.test?.(".svg")
    );

    // Existing config
    config.module.rules.push(
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
      },
      {
        test: /\.svg$/,
        issuer: /\.[jt]sx?$/,
        use: [{ loader: "@svgr/webpack", options: { icon: true } }],
      }
    );

    // Important: return the modified config
    return config;
  },
};

export default withBundleAnalyzer(withMDX(config));
