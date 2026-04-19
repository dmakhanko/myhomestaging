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
    ];
  },
};

export default nextConfig;
