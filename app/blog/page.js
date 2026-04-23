import { getSiteContent } from "@/lib/content";
import BlogClient from "@/components/BlogClient";

export const dynamic = "force-dynamic";

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

export default async function BlogPage() {
  const content = await getSiteContent();
  return <BlogClient content={content} />;
}
