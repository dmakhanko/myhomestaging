/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Медиа теперь отдаётся с того же домена — внешние паттерны не нужны
    remotePatterns: [],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
      {
        source: "/((?!_next/static|_next/image|api/media).*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "CDN-Cache-Control", value: "s-maxage=60, stale-while-revalidate=600" },
        ],
      },
    ];
  },
};

export default nextConfig;
