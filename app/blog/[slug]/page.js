import { getSiteContent } from "@/lib/content";
import BlogPostClient from "@/components/BlogPostClient";

export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";

const BASE_URL = "https://myhomestaging.ru";

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

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Главная", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Блог", item: `${BASE_URL}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: `${BASE_URL}/blog/${post.slug}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <BlogPostClient content={content} post={post} />
    </>
  );
}
