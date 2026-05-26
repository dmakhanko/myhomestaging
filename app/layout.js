import "./globals.css";
import { Manrope, Fraunces } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL("https://myhomestaging.ru"),
  title: {
    default: "Хоумстейджинг в Москве — подготовка квартир | Квартирный стилист",
    template: "%s | Квартирный стилист",
  },
  description:
    "Профессиональный хоумстейджинг в Москве от студии «Квартирный стилист». Комплектация квартир и подготовка инвест-квартир для быстрой продажи и аренды.",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://myhomestaging.ru",
    siteName: "Квартирный стилист",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
  verification: {
    yandex: "824627f0e46f3194",
  },
  robots: { index: true, follow: true },
};

const professionalServiceJsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "Квартирный стилист",
  description: "Профессиональный хоумстейджинг квартир в Москве — подготовка к продаже и сдаче в аренду",
  url: "https://myhomestaging.ru",
  image: "https://myhomestaging.ru/og-image.jpg",
  telephone: "+7-905-516-04-43",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Москва",
    addressRegion: "Москва",
    addressCountry: "RU",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 55.7558,
    longitude: 37.6173,
  },
  areaServed: {
    "@type": "Place",
    name: "Москва и Московская область",
  },
  serviceType: "Хоумстейджинг",
  priceRange: "от 400 000 ₽",
  founder: {
    "@type": "Person",
    name: "Оксана Фурсова",
  },
  sameAs: [
    "https://t.me/kvartirniystylist",
    "https://www.avito.ru/user/a28a12dbb364d1301a3340600b632419/profile",
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru" suppressHydrationWarning className={`${manrope.variable} ${fraunces.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(professionalServiceJsonLd) }}
        />
      </head>
      <body>
        <ThemeProvider>
          {children}
          <Toaster richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
