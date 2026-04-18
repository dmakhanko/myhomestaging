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

export default function RootLayout({ children }) {
  return (
    <html lang="ru" suppressHydrationWarning className={`${manrope.variable} ${fraunces.variable}`}>
      <body>
        <ThemeProvider>
          {children}
          <Toaster richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
