import { getSiteContent } from "@/lib/content";
import PortfolioClient from "@/components/PortfolioClient";

export const metadata = {
  title: "Портфолио — кейсы хоумстейджинга | Квартирный стилист",
  description:
    "Примеры работ по хоумстейджингу в Москве: комплектация квартир, подготовка к сдаче и продаже. Фото до и после.",
  alternates: { canonical: "https://myhomestaging.ru/portfolio" },
  openGraph: {
    title: "Портфолио — кейсы хоумстейджинга | Квартирный стилист",
    description: "Примеры работ по хоумстейджингу в Москве: комплектация квартир, подготовка к сдаче и продаже. Фото до и после.",
    url: "https://myhomestaging.ru/portfolio",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
};

export default async function PortfolioPage() {
  const content = await getSiteContent();
  return <PortfolioClient content={content} />;
}
