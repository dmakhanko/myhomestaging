import { getSiteContent } from "@/lib/content";
import BlogPostClient from "@/components/BlogPostClient";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }) {
  const content = await getSiteContent();
  const { slug } = await params;
  const post = (content?.blog?.posts || []).find((p) => p.slug === slug && p.published);

  if (!post) {
    return { title: "Статья не найдена | Квартирный стилист" };
  }

  const ogImage = (post.photos || [])[0] || "https://myhomestaging.ru/og-image.jpg";

  return {
    title: post.title,
    description: post.excerpt || post.title,
    alternates: { canonical: `https://myhomestaging.ru/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt || post.title,
      url: `https://myhomestaging.ru/blog/${post.slug}`,
      type: "article",
      images: [{ url: ogImage }],
    },
  };
}

export default async function BlogPostPage({ params }) {
  const content = await getSiteContent();
  const { slug } = await params;
  const post = (content?.blog?.posts || []).find((p) => p.slug === slug && p.published);

  if (!post) notFound();

  return <BlogPostClient content={content} post={post} />;
}
