export default function robots() {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/admin" },
    sitemap: "https://myhomestaging.ru/sitemap.xml",
  };
}
