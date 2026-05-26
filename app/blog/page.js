import { getSiteContent } from "@/lib/content";
import BlogClient from "@/components/BlogClient";

export const revalidate = 3600;

const BASE_URL = "https://myhomestaging.ru";

export const metadata = {
  title: "Блог о хоумстейджинге",
  description:
    "Советы, кейсы и статьи о хоумстейджинге и подготовке квартир к продаже и аренде в Москве.",
  alternates: { canonical: "https://myhomestaging.ru/blog" },
  openGraph: {
    title: "Блог о хоумстейджинге",
    description: "Советы, кейсы и статьи о хоумстейджинге и подготовке квартир к продаже и аренде в Москве.",
    url: "https://myhomestaging.ru/blog",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Главная", item: BASE_URL },
    { "@type": "ListItem", position: 2, name: "Блог", item: `${BASE_URL}/blog` },
  ],
};

export default async function BlogPage() {
  const content = await getSiteContent();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <BlogClient content={content} />
    </>
  );
}
