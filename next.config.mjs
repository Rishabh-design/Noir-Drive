/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Lets a production build run alongside `next dev` without sharing .next
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // Source maps for the shipped JS (Lighthouse best-practice; only fetched by devtools).
  productionBrowserSourceMaps: true,
  images: {
    // Every size is pre-generated as a static WebP (see lib/image-loader.ts).
    loader: 'custom',
    loaderFile: './lib/image-loader.ts',
    deviceSizes: [640, 960, 1280, 1920, 2560, 3200],
    imageSizes: [128, 256, 384],
  },
  async headers() {
    const immutable = [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }];
    return [
      { source: '/assets/:path*', headers: immutable },
      { source: '/fonts/:path*', headers: immutable },
    ];
  },
};
export default nextConfig;
