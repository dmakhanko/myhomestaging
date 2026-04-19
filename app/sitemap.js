import { getSiteContent } from "@/lib/content";

const BASE_URL = "https://myhomestaging.ru";

export default async function sitemap() {
  const content = await getSiteContent();
  const posts = (content?.blog?.posts || []).filter((p) => p.published);

  const contentUpdated = content?.updatedAt ? new Date(content.updatedAt) : new Date("2026-04-19");

  const static_pages = [
    { url: BASE_URL, lastModified: contentUpdated, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/portfolio`, lastModified: contentUpdated, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/blog`, lastModified: contentUpdated, changeFrequency: "weekly", priority: 0.8 },
  ];

  const blog_pages = posts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: post.publishedAt ? new Date(post.publishedAt) : new Date(),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...static_pages, ...blog_pages];
}
