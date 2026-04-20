/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@tcf-tracker/types',
    '@tcf-tracker/platform-adapters',
    '@tcf-tracker/utils',
  ],
  images: {
    remotePatterns: [],
  },
  experimental: {
    serverComponentsExternalPackages: [],
  },
}

module.exports = nextConfig
