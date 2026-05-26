import { getSiteContent } from "@/lib/content";
import PortfolioClient from "@/components/PortfolioClient";

export const revalidate = 3600;

const BASE_URL = "https://myhomestaging.ru";

export const metadata = {
  title: "Портфолио — кейсы хоумстейджинга",
  description:
    "Примеры работ по хоумстейджингу в Москве: комплектация квартир, подготовка к сдаче и продаже. Фото до и после.",
  alternates: { canonical: "https://myhomestaging.ru/portfolio" },
  openGraph: {
    title: "Портфолио — кейсы хоумстейджинга",
    description: "Примеры работ по хоумстейджингу в Москве: комплектация квартир, подготовка к сдаче и продаже. Фото до и после.",
    url: "https://myhomestaging.ru/portfolio",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Главная", item: BASE_URL },
    { "@type": "ListItem", position: 2, name: "Портфолио", item: `${BASE_URL}/portfolio` },
  ],
};

function toAbsoluteUrl(path) {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  return `${BASE_URL}${path}`;
}

function buildItemListJsonLd(cards) {
  if (!cards || cards.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Кейсы хоумстейджинга — портфолио",
    itemListElement: cards.map((card, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${BASE_URL}/portfolio#${card.id}`,
      name: card.title,
      image: toAbsoluteUrl(card.afterUrl),
    })),
  };
}

export default async function PortfolioPage() {
  const content = await getSiteContent();
  const cards = content?.portfolio?.cards || [];
  const itemListJsonLd = buildItemListJsonLd(cards);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      )}
      <PortfolioClient content={content} />
    </>
  );
}
