import { getSiteContent } from "@/lib/content";

const BASE_URL = "https://myhomestaging.ru";

export default async function sitemap() {
  const content = await getSiteContent();
  const posts = (content?.blog?.posts || []).filter((p) => p.published);

  const static_pages = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/portfolio`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
  ];

  const blog_pages = posts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: post.publishedAt ? new Date(post.publishedAt) : new Date(),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...static_pages, ...blog_pages];
}
