export default function robots() {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] },
      { userAgent: "YandexBot", allow: "/", disallow: ["/admin", "/api/"] },
      { userAgent: "Googlebot", allow: "/", disallow: ["/admin", "/api/"] },
    ],
    sitemap: "https://myhomestaging.ru/sitemap.xml",
  };
}
