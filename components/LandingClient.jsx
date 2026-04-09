"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Phone, Send, MessageCircle } from "lucide-react";

import SiteHeader from "@/components/SiteHeader";
import { api } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

// Color palette
const accentColors = ["#9FB5B5", "#E8A05B", "#A8C7A1", "#B89A7C", "#D4E2D0"];
const serviceColors = [
  { bg: "bg-[#D8CCE3]/30", border: "border-[#D8CCE3]/50", accent: "#D8CCE3", text: "text-[#8B7B9E]" },
  { bg: "bg-[#A8C7A1]/30", border: "border-[#A8C7A1]/50", accent: "#A8C7A1", text: "text-[#6B8F63]" },
  { bg: "bg-[#E8A05B]/20", border: "border-[#E8A05B]/40", accent: "#E8A05B", text: "text-[#C4884D]" },
];

const BeforeAfter = ({ beforeLabel, afterLabel, beforeUrl, afterUrl, projectTitle }) => (
  <div className="grid gap-3 grid-cols-2">
    <div className="relative">
      <div className="aspect-[3/4] overflow-hidden bg-[#E8DED6]">
        <img
          src={beforeUrl}
          alt={`Хоум стейджинг квартиры в Москве — ${beforeLabel.toLowerCase()}${projectTitle ? `, ${projectTitle}` : ""}`}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold tracking-wider text-[#333333] uppercase">
        {beforeLabel}
      </div>
    </div>
    <div className="relative">
      <div className="aspect-[3/4] overflow-hidden bg-[#E8DED6]">
        <img
          src={afterUrl}
          alt={`Комплектация квартиры в Москве — ${afterLabel.toLowerCase()} после подготовки${projectTitle ? `, ${projectTitle}` : ""}`}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold tracking-wider text-[#333333] uppercase">
        {afterLabel}
      </div>
    </div>
  </div>
);

function ServiceCard({ card: c, cardIdx, servicePrices, priceOptions, servicesSection, onCta }) {
  const [selectedType, setSelectedType] = useState("studio");
  const currentPrice = servicePrices[selectedType] || "";
  const hasAnyPrice = Object.values(servicePrices).some(Boolean);
  const colors = serviceColors[cardIdx % serviceColors.length];

  return (
    <Card className="group m3-card relative flex flex-col overflow-hidden transition-all duration-300">
      <div className={`${colors.bg} p-5 pb-4`}>
        <div className="text-lg font-semibold text-[#333333] leading-snug">{c.title}</div>
      </div>
      <div className={`mx-5 border-t ${colors.border}`} />
      <div className="flex-1 p-5 pt-4">
        <p className="whitespace-pre-line m3-body-small text-[#4A4A4A] leading-relaxed">{c.desc}</p>
        <ul className="mt-4 space-y-2.5">
          {c.bullets.map((b, idx) => (
            <li key={idx} className="flex items-start gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: colors.accent }} />
              <span className="m3-body-small text-[#4A4A4A] leading-relaxed whitespace-pre-line">{b}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className={`mx-5 border-t ${colors.border}`} />
      <div className="p-5 pt-4">
        <div className={`flex items-center justify-between gap-3 rounded-xl ${colors.bg} px-3 py-2.5`}>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="h-8 w-[140px] border-[#E6E1D7] bg-white text-[#333333] shadow-sm text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-[#E6E1D7] bg-white text-[#333333]">
              {priceOptions.map((opt) => (
                <SelectItem key={opt.key} value={opt.key}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="text-right">
            {currentPrice ? (
              <span className={`font-semibold ${colors.text}`}>{currentPrice}</span>
            ) : hasAnyPrice ? (
              <span className="text-sm text-[#787878]">—</span>
            ) : (
              <span className="text-sm text-[#787878] italic">Уточняйте</span>
            )}
          </div>
        </div>
        <Button className="mt-4 w-full m3-btn-primary transition-all" onClick={onCta}>
          {servicesSection.cta}
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Button>
      </div>
    </Card>
  );
}

export default function LandingClient({ content }) {
  const router = useRouter();

  const refMap = useRef({});
  const [activeSection, setActiveSection] = useState("about");
  const [form, setForm] = useState({ name: "", phone: "", message: "", service: "" });
  const [submitting, setSubmitting] = useState(false);

  const brand = content?.brand || {};
  const dummyImages = content?.dummyImages || {};
  const hero = content?.hero || {};
  const nav = content?.nav || [];
  const portfolio = content?.portfolio || {};
  const processSteps = content?.processSteps || [];
  const servicesSection = content?.servicesSection || {};
  const blog = content?.blog || {};
  const seo = content?.seo || {};

  const navWithBlog = useMemo(() => [...(nav || []), { id: "blog", label: "БЛОГ", isLink: true }], [nav]);

  const setRef = (id) => (el) => { if (el) refMap.current[id] = el; };

  useEffect(() => {
    const sections = ["about", "services", "contact", "objects", "how"];
    const observers = [];
    sections.forEach((id) => {
      const el = refMap.current[id];
      if (!el) return;
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.2) setActiveSection(id);
          });
        },
        { threshold: 0.2, rootMargin: "-80px 0px -40% 0px" }
      );
      observer.observe(el);
      observers.push(observer);
    });
    return () => observers.forEach((obs) => obs.disconnect());
  }, []);

  const scrollToId = useCallback((id) => {
    if (id === "blog") { router.push("/blog"); return; }
    if (id === "portfolio") { router.push("/portfolio"); return; }
    const el = refMap.current?.[id];
    if (!el) return;
    const headerOffset = 80;
    const offsetPosition = el.getBoundingClientRect().top + window.pageYOffset - headerOffset;
    window.scrollTo({ top: offsetPosition, behavior: "smooth" });
  }, [router]);

  const scrollToContactWithService = useCallback((serviceTitle) => {
    setForm((p) => ({ ...p, service: serviceTitle }));
    setTimeout(() => {
      const el = refMap.current?.["contact"];
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    if ((form.phone || "").trim().length < 7) { toast.error("Укажите телефон *"); return; }
    setSubmitting(true);
    try {
      await api.post("/leads", {
        name: form.name.trim(),
        phone: form.phone.trim(),
        message: form.service ? `[${form.service}] ${form.message.trim()}` : form.message.trim(),
      });
      setForm({ name: "", phone: "", message: "", service: "" });
      toast.success("Заявка отправлена! Мы свяжемся с вами в ближайшее время.");
    } catch {
      toast.error("Не удалось отправить заявку. Попробуйте позже или позвоните нам.");
    } finally {
      setSubmitting(false);
    }
  };

  const headerRight = useMemo(() => {
    if (!brand.headerPhoneRaw) return null;
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" className="m3-btn-dark" onClick={() => window.open(`tel:${brand.headerPhoneRaw}`, "_self")}>
          {brand.headerPhoneDisplay}
        </Button>
        <Button variant="outline" className="m3-btn-dark" onClick={() => window.open(brand.telegramUrl, "_blank")} aria-label="Telegram">
          <Send className="h-4 w-4" />
        </Button>
        <Button variant="outline" className="m3-btn-dark" onClick={() => window.open(brand.whatsappUrl, "_blank")} aria-label="WhatsApp">
          <MessageCircle className="h-4 w-4" />
        </Button>
      </div>
    );
  }, [brand.headerPhoneRaw, brand.headerPhoneDisplay, brand.telegramUrl, brand.whatsappUrl]);

  return (
    <div className="min-h-screen m3-page">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(70%_70%_at_20%_10%,rgba(227,232,221,0.22),transparent_60%),radial-gradient(60%_60%_at_80%_25%,rgba(228,167,106,0.18),transparent_60%)]" />
      </div>

      <SiteHeader
        brand={brand}
        nav={navWithBlog}
        onNav={scrollToId}
        rightSlot={headerRight}
        subtitle=""
        activeSection={activeSection}
      />

      <main className="relative mx-auto max-w-6xl px-5 pb-20 pt-6">
        {/* Hero + About */}
        <section ref={setRef("about")} id="about" className="m3-card overflow-hidden">
          <div className="p-8 sm:p-10 lg:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-stretch">
              <div className="flex flex-col justify-between min-h-full">
                <div>
                  <h1 className="font-display text-3xl tracking-tight text-[#333333] sm:text-4xl lg:text-5xl leading-tight">
                    {hero.h1 || "Хоум стейджинг в Москве"}
                  </h1>
                  <p className="mt-3 text-base text-[#4A4A4A] leading-relaxed">
                    {hero.subline || "Подготовка квартир к продаже и аренде"}
                  </p>
                  <div className="mt-6 grid grid-cols-3 gap-2">
                    {(hero.statCards || []).map((s, idx) => {
                      const colors = ["#D8CCE3", "#A8C7A1", "#E8A05B"];
                      const isThird = idx === 2;
                      return (
                        <div key={s.value} className="rounded-xl p-3 text-center" style={{ backgroundColor: `${colors[idx % 3]}35` }}>
                          <div className={`font-bold text-[#333333] ${isThird ? "text-base" : "text-lg"}`}>{s.value}</div>
                          <div className="text-[#4A4A4A] leading-tight" style={{ fontSize: "12px" }}>{s.label}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-auto pt-6">
                  <Button
                    className="rounded-xl bg-[#333333] px-10 py-6 text-base font-medium text-white hover:bg-[#1a1a1a] transition-colors"
                    onClick={() => scrollToId("contact")}
                  >
                    Связаться со мной
                    <ArrowRight className="ml-3 h-5 w-5" />
                  </Button>
                </div>
              </div>
              <div className="flex items-stretch">
                <div className="w-full aspect-[4/3] overflow-hidden">
                  <img
                    src={hero.photoUrl || ""}
                    alt="Хоум стейджинг квартиры в Москве — пример интерьера"
                    className="h-full w-full object-cover"
                    loading="eager"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="mx-8 sm:mx-10 lg:mx-12 border-t border-[#E6E1D7]" />
          <div id="about-me" className="p-8 sm:p-10 lg:p-12 pt-6 sm:pt-8 lg:pt-10">
            <h2 className="font-display text-xl tracking-tight text-[#333333] sm:text-2xl">Обо мне</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 text-[#4A4A4A] text-sm leading-relaxed">
              {(hero.about || []).map((p, idx) => (
                <p key={idx} className="whitespace-pre-line">{p}</p>
              ))}
            </div>
          </div>
        </section>

        {/* Services */}
        <section ref={setRef("services")} id="services" className="mt-10">
          <h2 className="font-display text-2xl tracking-tight text-[#333333] sm:text-3xl">
            {servicesSection.title}
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {(servicesSection.cards || []).map((c, cardIdx) => {
              const servicePrices = servicesSection.prices?.[c.key] || {};
              const priceOptions = servicesSection.priceOptions || [
                { key: "studio", label: "Студия" },
                { key: "1k", label: "1-комнатная" },
                { key: "2k", label: "2-комнатная" },
                { key: "3k", label: "3-комнатная" },
              ];
              return (
                <ServiceCard
                  key={c.key}
                  card={c}
                  cardIdx={cardIdx}
                  servicePrices={servicePrices}
                  priceOptions={priceOptions}
                  servicesSection={servicesSection}
                  onCta={() => scrollToContactWithService(c.title)}
                />
              );
            })}
          </div>
        </section>

        {/* Contact */}
        <section ref={setRef("contact")} id="contact" className="mt-10">
          <div className="m3-card overflow-hidden">
            <div className="p-8 sm:p-10 grid gap-8 lg:grid-cols-2">
              <div>
                <h2 className="font-display text-2xl tracking-tight text-[#333333] sm:text-3xl">
                  Давайте подготовим вашу квартиру
                </h2>
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <Button className="rounded-full bg-[#333333] px-5 py-2 text-sm font-medium text-white hover:bg-[#1a1a1a]" onClick={() => window.open(`tel:${brand.contactPhoneRaw}`, "_self")}>
                    <Phone className="mr-2 h-4 w-4" />
                    {brand.contactPhoneDisplay}
                  </Button>
                  <Button className="rounded-full border border-[#333333]/20 bg-transparent px-5 py-2 text-sm font-medium text-[#333333] hover:bg-[#333333]/5" onClick={() => window.open(brand.telegramUrl, "_blank")}>
                    Telegram
                  </Button>
                  <Button className="rounded-full border border-[#333333]/20 bg-transparent px-5 py-2 text-sm font-medium text-[#333333] hover:bg-[#333333]/5" onClick={() => window.open(brand.whatsappUrl, "_blank")}>
                    WhatsApp
                  </Button>
                </div>
                <div className="mt-6">
                  <div className="text-xs text-[#787878] uppercase tracking-wide">Telegram-канал</div>
                  <button className="mt-1 text-sm font-medium text-[#333333] hover:underline" onClick={() => window.open(brand.telegramUrl, "_blank")}>
                    @{brand.telegramHandle}
                  </button>
                </div>
              </div>
              <div>
                <form onSubmit={onSubmit} className="space-y-4">
                  <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Имя" className="rounded-xl border-[#E6E1D7] bg-white placeholder:text-[#787878] h-12" disabled={submitting} />
                  {form.service && (
                    <div className="flex items-center gap-2 rounded-xl border border-[#E6E1D7] px-3 py-2">
                      <span className="text-xs text-[#787878]">Услуга:</span>
                      <span className="text-sm text-[#333333] font-medium">{form.service}</span>
                      <button type="button" onClick={() => setForm((p) => ({ ...p, service: "" }))} className="ml-auto text-[#787878] hover:text-[#333333]">✕</button>
                    </div>
                  )}
                  <Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="Телефон *" className="rounded-xl border-[#E6E1D7] bg-white placeholder:text-[#787878] h-12" disabled={submitting} />
                  <Textarea value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} placeholder="Краткое описание квартиры: город, район, ЖК, общий метраж, наличие ремонта" className="min-h-[100px] rounded-xl border-[#E6E1D7] bg-white placeholder:text-[#787878]" disabled={submitting} />
                  <Button type="submit" className="w-full rounded-xl bg-[#333333] py-6 text-sm font-medium text-white hover:bg-[#1a1a1a]" disabled={submitting}>
                    {submitting ? "Отправка..." : "Оставить заявку"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* Objects / Portfolio preview */}
        <section ref={setRef("objects")} id="objects" className="mt-10">
          <div className="m3-card overflow-hidden p-8 sm:p-10">
            <h2 className="font-display text-2xl tracking-tight text-[#333333] sm:text-3xl">
              {portfolio.title}
            </h2>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              {(portfolio.cards || []).map((c, idx) => {
                const portfolioColors = ["#D8CCE3", "#A8C7A1", "#E8A05B", "#9FB5B5"];
                const color = portfolioColors[idx % portfolioColors.length];
                return (
                  <div key={c.id} className="pb-6 border-b border-[#E6E1D7] last:border-b-0 last:pb-0">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-base font-medium text-[#333333]">{c.title}</div>
                        <div className="mt-1 text-sm text-[#4A4A4A]">{c.desc}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: `${color}30`, color }}>{c.badgeTime}</span>
                        <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: `${color}30`, color }}>{c.badgeCost}</span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <BeforeAfter
                        beforeLabel={c.beforeLabel}
                        afterLabel={c.afterLabel}
                        beforeUrl={c.beforeUrl || dummyImages.beforeUrl}
                        afterUrl={c.afterUrl || dummyImages.afterUrl}
                        projectTitle={c.title}
                      />
                    </div>
                    <div className="mt-3 text-sm text-[#4A4A4A]">{c.payoffLine}</div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 pt-6 border-t border-[#E6E1D7]">
              <button className="text-sm font-medium text-[#333333] hover:underline" onClick={() => router.push("/portfolio")}>
                Полное портфолио →
              </button>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section ref={setRef("how")} id="how" className="mt-10">
          <div className="m3-card overflow-hidden p-8 sm:p-10">
            <h2 className="font-display text-2xl tracking-tight text-[#333333] sm:text-3xl">
              Как это работает
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {(processSteps || []).map((s, idx) => {
                const processColors = [
                  { bg: "#D8CCE3", light: "rgba(216,204,227,0.25)" },
                  { bg: "#A8C7A1", light: "rgba(168,199,161,0.25)" },
                  { bg: "#E8A05B", light: "rgba(232,160,91,0.2)" },
                  { bg: "#9FB5B5", light: "rgba(159,181,181,0.25)" },
                ];
                const c = processColors[idx % processColors.length];
                return (
                  <div key={s.title} className="rounded-2xl p-5" style={{ backgroundColor: c.light }}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-semibold text-white" style={{ backgroundColor: c.bg }}>
                        {idx + 1}
                      </div>
                      <div className="text-base font-medium text-[#333333]">{s.title}</div>
                    </div>
                    <p className="mt-3 text-sm text-[#4A4A4A] leading-relaxed">{s.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* SEO Text */}
        {(seo.blockTitle || seo.blockContent) && (
          <section id="seo-content" className="mt-12">
            <div className="m3-card p-6 sm:p-8">
              <h2 className="font-display text-2xl tracking-tight text-[#333333] sm:text-3xl">
                {seo.blockTitle}
              </h2>
              {seo.blockContent && (
                <div className="mt-6 space-y-4 text-[#4A4A4A] m3-body-medium leading-relaxed">
                  {seo.blockContent.split("\n\n").map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        <footer className="mt-12 border-t border-[#E6E1D7] py-8">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="text-sm font-semibold text-[#333333]">{brand.name}</div>
              <div className="mt-1 text-xs text-[#787878]">© {new Date().getFullYear()}</div>
            </div>
            <Button className="m3-btn-outline" onClick={() => scrollToId("about")}>
              Наверх
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </footer>
      </main>
    </div>
  );
}
