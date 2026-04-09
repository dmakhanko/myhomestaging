"use client";

import React, { useMemo } from "react";
import { Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export default function SiteHeader({ brand, nav, onNav, rightSlot, subtitle = "", adminTrigger = null, activeSection = null }) {
  // Show all nav items including blog
  const primaryNav = useMemo(() => nav?.slice(0, 6) ?? [], [nav]);
  const moreNav = useMemo(() => nav?.slice(6) ?? [], [nav]);

  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F5]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
        {/* Brand - minimal, larger logo space */}
        <button
          type="button"
          onClick={() => onNav("about")}
          className="flex items-center gap-3 text-left focus:outline-none shrink-0"
        >
          {brand?.logoUrl ? (
            <img 
              src={brand.logoUrl} 
              alt={brand?.name || "Logo"} 
              className="h-12 w-auto shrink-0 object-contain mix-blend-multiply" style={{ filter: "invert(1)" }}
            />
          ) : null}
          <span className="text-sm font-medium text-[#333333] tracking-tight whitespace-nowrap hidden sm:block">
            {brand?.name}
          </span>
        </button>

        {/* Desktop nav - compact single line with active state */}
        <nav className="hidden items-center gap-5 lg:flex">
          {primaryNav.map((n) => {
            const isActive = activeSection === n.id;
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => onNav(n.id)}
                className={cn(
                  "text-sm transition-colors focus:outline-none whitespace-nowrap",
                  isActive 
                    ? "font-semibold text-[#333333]" 
                    : "font-medium text-[#333333]/50 hover:text-[#333333]"
                )}
              >
                {n.label}
              </button>
            );
          })}
        </nav>

        {/* Right side - CTA button */}
        <div className="hidden shrink-0 items-center gap-3 lg:flex">
          <button 
            onClick={() => window.open(`tel:${brand?.headerPhoneRaw ?? brand?.phoneRaw}`, "_self")}
            className="text-xs text-[#333333]/70 transition-colors hover:text-[#333333] whitespace-nowrap"
          >
            {brand?.headerPhoneDisplay ?? brand?.phoneDisplay}
          </button>
          <Button
            className="rounded-full bg-[#333333] px-4 py-2 text-xs font-medium text-white hover:bg-[#1a1a1a] transition-colors"
            onClick={() => onNav("contact")}
          >
            Связаться
          </Button>
          {adminTrigger}
        </div>

        {/* Mobile menu */}
        <div className="flex shrink-0 items-center gap-3 lg:hidden">
          <Button
            className="rounded-full bg-[#333333] px-4 py-2 text-xs font-medium text-white hover:bg-[#1a1a1a]"
            onClick={() => window.open(`tel:${brand?.headerPhoneRaw ?? brand?.phoneRaw}`, "_self")}
          >
            <Phone className="h-4 w-4" />
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <button
                className="text-xs text-[#333333]/50 hover:text-[#333333]"
                aria-label="Меню"
              >
                Меню
              </button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="border-[#E6E1D7] bg-[#FAF9F5] text-[#333333]"
            >
              <SheetHeader>
                <SheetTitle className="text-[#333333]">{brand?.name}</SheetTitle>
              </SheetHeader>

              <div className="mt-8 space-y-4">
                {[...primaryNav, ...moreNav].map((n) => {
                  const isActive = activeSection === n.id;
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => onNav(n.id)}
                      className={cn(
                        "block w-full text-left text-lg transition-colors",
                        isActive 
                          ? "text-[#333333] font-semibold" 
                          : "text-[#333333]/70 hover:text-[#333333]"
                      )}
                    >
                      {n.label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 pt-6 border-t border-[#E6E1D7]">
                <a
                  className="text-lg text-[#333333]"
                  href={`tel:${brand?.phoneRaw}`}
                >
                  {brand?.headerPhoneDisplay ?? brand?.phoneDisplay}
                </a>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
