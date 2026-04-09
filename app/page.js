import { getSiteContent } from "@/lib/content";
import LandingClient from "@/components/LandingClient";

export const metadata = {
  title: "Хоумстейджинг в Москве — подготовка квартир | Квартирный стилист",
  description:
    "Профессиональный хоумстейджинг в Москве от студии «Квартирный стилист». Комплектация квартир и подготовка инвест-квартир для быстрой продажи и аренды.",
  alternates: { canonical: "https://myhomestaging.ru/" },
};

export default async function HomePage() {
  const content = await getSiteContent();
  return <LandingClient content={content} />;
}
