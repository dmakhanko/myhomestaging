export default function robots() {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] },
    sitemap: "https://myhomestaging.ru/sitemap.xml",
    host: "https://myhomestaging.ru",
  };
}
