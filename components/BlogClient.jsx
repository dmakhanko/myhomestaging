"use client";

import React, { useCallback } from "react";
import { useRouter } from "next/navigation";
import { Calendar } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";

function PhotoSections({ post, postTitle }) {
  const sections = post.photoSections || [];
  const photos = (post.photos || []).filter(Boolean);

  if (sections.length > 0) {
    return (
      <div className="mt-6 space-y-4">
        {sections.map((section, si) => (
          <div key={si}>
            <div className="mb-2 text-xs font-semibold tracking-wider uppercase text-[#787878]">{section.label}</div>
            <div className="grid gap-2 grid-cols-2 sm:grid-cols-3">
              {(section.urls || []).map((url, idx) => (
                <div key={idx} className="relative overflow-hidden bg-[#E8DED6] aspect-[4/3]">
                  <img src={url} alt={`Хоумстейджинг ${postTitle} — ${section.label.toLowerCase()}, фото ${idx + 1}`} className="h-full w-full object-cover" loading="lazy" />
                  <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 text-xs font-semibold tracking-wider text-[#333333] uppercase">{section.label}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (photos.length === 0) return null;
  return (
    <div className="mt-6 grid gap-2 grid-cols-2 sm:grid-cols-3">
      {photos.map((url, idx) => (
        <div key={idx} className="overflow-hidden bg-[#E8DED6] aspect-[4/3]">
          <img src={url} alt={`Хоумстейджинг ${postTitle} — фото ${idx + 1}`} className="h-full w-full object-cover" loading="lazy" />
        </div>
      ))}
    </div>
  );
}

export default function BlogClient({ content }) {
  const router = useRouter();

  const handleNav = useCallback((id) => {
    if (id === "blog") return;
    if (id === "portfolio") { router.push("/portfolio"); return; }
    router.push("/");
  }, [router]);

  const { brand, blog, nav } = content || {};
  const publishedPosts = (blog?.posts || []).filter((p) => p.published);
  const navWithBlog = [...(nav || []), { id: "blog", label: "БЛОГ", isLink: true }];

  return (
    <div className="min-h-screen bg-[#FAF9F5]">
      <SiteHeader brand={brand || {}} nav={navWithBlog} onNav={handleNav} activeSection="blog" />

      <main className="mx-auto max-w-6xl px-5 py-10">
        <h1 className="font-display text-3xl tracking-tight text-[#333333] sm:text-4xl">Блог</h1>
        <p className="mt-2 text-base text-[#4A4A4A]">
          Статьи о хоумстейджинге от {brand?.person || "эксперта"}
        </p>

        <div className="mt-8 space-y-10">
          {publishedPosts.length === 0 && (
            <div className="m3-card p-8 text-center">
              <div className="text-lg font-medium text-[#333333]">Статей пока нет</div>
              <div className="mt-2 text-[#4A4A4A]">Скоро здесь появятся материалы о хоумстейджинге</div>
            </div>
          )}

          {publishedPosts.map((post) => (
            <article key={post.id} className="m3-card overflow-hidden p-6 sm:p-8">
              <h2 className="font-display text-xl tracking-tight text-[#333333] sm:text-2xl">
                {post.title}
              </h2>
              <div className="mt-2 flex items-center gap-2 text-[#787878]">
                <Calendar className="h-3.5 w-3.5" />
                <span className="text-sm">
                  {post.publishedAt
                    ? new Date(post.publishedAt).toLocaleDateString("ru-RU", { year: "numeric", month: "long", day: "numeric" })
                    : "Без даты"}
                </span>
              </div>

              <PhotoSections post={post} postTitle={post.title} />

              {post.content && (
                <div className="mt-6 space-y-3 text-sm text-[#4A4A4A] leading-relaxed">
                  {post.content.split("\n\n").map((paragraph, idx) => (
                    <p key={idx} className="whitespace-pre-line">{paragraph}</p>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>

        <footer className="mt-14 border-t border-[#E6E1D7] py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-[#333333]">{brand?.name}</div>
              <div className="mt-1 text-xs text-[#4A4A4A]/55">© {new Date().getFullYear()}</div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
