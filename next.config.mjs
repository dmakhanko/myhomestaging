/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone", // Оптимальная сборка для VPS (минимум зависимостей)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "fursova-staging-production.up.railway.app",
      },
    ],
  },
  // Разрешаем внешние домены для img (фото с Railway бэкенда)
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
