"use client";

import React, { useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, ExternalLink } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function BlogPostClient({ content, post }) {
  const router = useRouter();

  const handleNav = useCallback((id) => {
    if (id === "blog") { router.push("/blog"); return; }
    router.push("/");
  }, [router]);

  const { brand, nav } = content || {};
  const navWithBlog = [...(nav || []), { id: "blog", label: "БЛОГ", isLink: true }];

  const photos = (post.photos || []).filter(Boolean);
  const socialLinks = post.socialLinks || {};
  const hasSocialLinks = Object.values(socialLinks).some(Boolean);

  const BASE_URL = "https://myhomestaging.ru";
  const rawImage = photos[0] || `${BASE_URL}/og-image.jpg`;
  const absoluteImage = rawImage.startsWith("http") ? rawImage : `${BASE_URL}${rawImage}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || post.title,
    image: absoluteImage,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    url: `${BASE_URL}/blog/${post.slug}`,
    mainEntityOfPage: { "@type": "WebPage", "@id": `${BASE_URL}/blog/${post.slug}` },
    author: { "@type": "Person", name: "Оксана Фурсова" },
    publisher: {
      "@type": "Organization",
      name: "Квартирный стилист",
      url: BASE_URL,
      logo: { "@type": "ImageObject", url: `${BASE_URL}/logo.png` },
    },
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <SiteHeader brand={brand || {}} nav={navWithBlog} onNav={handleNav} activeSection="blog" />

      <main className="mx-auto max-w-4xl px-5 py-10">
        <Link href="/blog">
          <Button variant="outline" className="border-[#E6E1D7] bg-white text-[#333333] hover:bg-[#FAF9F5]">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад к блогу
          </Button>
        </Link>

        <article className="mt-8">
          <h1 className="font-display text-3xl tracking-tight text-[#333333] sm:text-4xl lg:text-5xl">
            {post.title}
          </h1>

          <div className="mt-4 flex items-center gap-2 text-[#4A4A4A]/60">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">
              {post.publishedAt
                ? new Date(post.publishedAt).toLocaleDateString("ru-RU", { year: "numeric", month: "long", day: "numeric" })
                : "Без даты"}
            </span>
          </div>

          {photos.length > 0 && (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {photos.map((url, idx) => (
                <div key={idx} className="overflow-hidden border border-[#E6E1D7]">
                  <img src={url} alt={`Фото ${idx + 1}`} className="h-64 w-full object-cover" />
                </div>
              ))}
            </div>
          )}

          <Card className="mt-8 border-[#E6E1D7] bg-white p-6 lg:p-8 shadow-sm">
            <div className="prose prose-lg max-w-none text-[#4A4A4A]">
              {post.content.split("\n\n").map((paragraph, idx) => (
                <p key={idx} className="mb-4 leading-relaxed whitespace-pre-line">{paragraph}</p>
              ))}
            </div>

            {hasSocialLinks && (
              <div className="mt-6 pt-6 border-t border-[#E6E1D7]">
                <div className="text-sm text-[#4A4A4A]/70">Поделиться:</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {socialLinks.telegram && (
                    <a href={socialLinks.telegram} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="border-[#E6E1D7] bg-white text-[#333333] hover:bg-[#FAF9F5]">
                        Telegram <ExternalLink className="ml-1 h-3 w-3" />
                      </Button>
                    </a>
                  )}
                  {socialLinks.whatsapp && (
                    <a href={socialLinks.whatsapp} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="border-[#E6E1D7] bg-white text-[#333333] hover:bg-[#FAF9F5]">
                        WhatsApp <ExternalLink className="ml-1 h-3 w-3" />
                      </Button>
                    </a>
                  )}
                  {socialLinks.vk && (
                    <a href={socialLinks.vk} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="border-[#E6E1D7] bg-white text-[#333333] hover:bg-[#FAF9F5]">
                        VK <ExternalLink className="ml-1 h-3 w-3" />
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            )}
          </Card>
        </article>

        <footer className="mt-14 border-t border-[#E6E1D7] py-8">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="text-sm font-semibold text-[#333333]">{brand?.name}</div>
              <div className="mt-1 text-xs text-[#4A4A4A]/55">© {new Date().getFullYear()}</div>
            </div>
            <Link href="/">
              <Button variant="outline" className="border-[#E6E1D7] bg-white text-[#333333] hover:bg-[#FAF9F5]">
                На главную
              </Button>
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
