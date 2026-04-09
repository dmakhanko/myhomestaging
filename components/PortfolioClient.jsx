"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";

function Lightbox({ photos, startIdx, onClose }) {
  const [idx, setIdx] = useState(startIdx);
  const prev = () => setIdx((i) => (i - 1 + photos.length) % photos.length);
  const next = () => setIdx((i) => (i + 1) % photos.length);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={onClose}>
      <button className="absolute top-4 right-4 text-white/70 hover:text-white" onClick={onClose}>
        <X className="h-7 w-7" />
      </button>
      {photos.length > 1 && (
        <>
          <button className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white" onClick={(e) => { e.stopPropagation(); prev(); }}>
            <ArrowLeft className="h-8 w-8" />
          </button>
          <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white" onClick={(e) => { e.stopPropagation(); next(); }}>
            <ArrowRight className="h-8 w-8" />
          </button>
        </>
      )}
      <img src={photos[idx]} alt={`Фото ${idx + 1}`} className="max-h-[90vh] max-w-[90vw] object-contain" onClick={(e) => e.stopPropagation()} />
      <div className="absolute bottom-4 text-white/60 text-sm">{idx + 1} / {photos.length}</div>
    </div>
  );
}

function ProjectPhotos({ card, dummyImages }) {
  const [lightbox, setLightbox] = useState(null);

  const photos = useMemo(() => {
    const list = card.photos?.filter(Boolean) || [];
    if (list.length === 0) {
      return [card.beforeUrl || dummyImages.beforeUrl, card.afterUrl || dummyImages.afterUrl].filter(Boolean);
    }
    return list;
  }, [card, dummyImages]);

  if (photos.length === 0) return null;

  return (
    <>
      <div className="mt-4" style={{ columns: photos.length === 1 ? 1 : 2, columnGap: "8px" }}>
        {photos.map((url, i) => (
          <button key={i} className="group relative w-full focus:outline-none" style={{ breakInside: "avoid", marginBottom: "8px", display: "block" }} onClick={() => setLightbox(i)}>
            <img src={url} alt={`${card.title} — фото ${i + 1}`} className="w-full h-auto block transition-opacity duration-300 group-hover:opacity-90" loading="lazy" />
          </button>
        ))}
      </div>
      {lightbox !== null && <Lightbox photos={photos} startIdx={lightbox} onClose={() => setLightbox(null)} />}
    </>
  );
}

export default function PortfolioClient({ content }) {
  const router = useRouter();

  const brand = content?.brand || {};
  const nav = content?.nav || [];
  const portfolio = content?.portfolio || {};
  const dummyImages = content?.dummyImages || {};

  const navWithBlog = useMemo(() => [...(nav || []), { id: "blog", label: "БЛОГ", isLink: true }], [nav]);

  const onNav = useCallback((id) => {
    if (id === "portfolio") return;
    if (id === "blog") { router.push("/blog"); return; }
    router.push("/");
  }, [router]);

  const headerRight = useMemo(() => {
    if (!brand.headerPhoneRaw) return null;
    return (
      <Button variant="outline" className="m3-btn-dark" onClick={() => window.open(`tel:${brand.headerPhoneRaw}`, "_self")}>
        {brand.headerPhoneDisplay}
      </Button>
    );
  }, [brand.headerPhoneRaw, brand.headerPhoneDisplay]);

  const portfolioColors = ["#D8CCE3", "#A8C7A1", "#E8A05B", "#9FB5B5"];

  return (
    <div className="min-h-screen m3-page">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(70%_70%_at_20%_10%,rgba(227,232,221,0.22),transparent_60%),radial-gradient(60%_60%_at_80%_25%,rgba(228,167,106,0.18),transparent_60%)]" />
      </div>

      <SiteHeader brand={brand} nav={navWithBlog} onNav={onNav} rightSlot={headerRight} subtitle="" activeSection="portfolio" />

      <main className="relative mx-auto max-w-6xl px-5 pb-20 pt-6">
        <button className="mb-6 flex items-center gap-1.5 text-sm text-[#787878] hover:text-[#333333] transition-colors" onClick={() => router.push("/")}>
          <ArrowLeft className="h-4 w-4" />
          На главную
        </button>

        <h1 className="font-display text-3xl tracking-tight text-[#333333] sm:text-4xl">Портфолио</h1>

        <div className="mt-8 space-y-8">
          {(portfolio.cards || []).map((c, idx) => {
            const color = portfolioColors[idx % portfolioColors.length];
            return (
              <div key={c.id} className="m3-card overflow-hidden p-6 sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold text-[#333333]">{c.title}</div>
                    <div className="mt-1 text-sm text-[#4A4A4A]">{c.desc}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {c.badgeTime && <span className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: `${color}30`, color }}>{c.badgeTime}</span>}
                    {c.badgeCost && <span className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: `${color}30`, color }}>{c.badgeCost}</span>}
                  </div>
                </div>
                <ProjectPhotos card={c} dummyImages={dummyImages} />
                {c.payoffLine && <div className="mt-4 text-sm text-[#4A4A4A]">{c.payoffLine}</div>}
              </div>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <p className="text-sm text-[#787878]">Хотите обсудить ваш объект?</p>
          <Button className="mt-3 rounded-full bg-[#333333] px-8 py-5 text-sm font-medium text-white hover:bg-[#1a1a1a]" onClick={() => router.push("/#contact")}>
            Связаться со мной
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </main>
    </div>
  );
}
