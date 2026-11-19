/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    // Disable Webpack filesystem pack cache to prevent corrupted cache snapshot errors with large data files
    config.cache = false;
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/data/**',
        '**/public/data/**',
      ],
    };
    return config;
  },
};

module.exports = nextConfig;
